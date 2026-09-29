import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../database/prisma';
import { config } from '../../config';
import { UnauthorizedError, NotFoundError } from '../../common/errors';
import { ModerationActionType } from '@prisma/client';

export class AdminService {
  /**
   * Admin authentication
   */
  async login(email: string, passwordPlain: string) {
    const admin = await prisma.adminUser.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!admin || !admin.isActive) {
      throw new UnauthorizedError('Invalid credentials or account inactive');
    }

    const isMatch = await bcrypt.compare(passwordPlain, admin.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Update last login
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const token = jwt.sign(
      { adminId: admin.id, email: admin.email, role: admin.role },
      config.jwt.accessSecret,
      { expiresIn: '8h' }
    );

    return {
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
      },
    };
  }

  /**
   * List pending and resolved reports for the moderation queue
   */
  async getReports(status?: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED', page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      prisma.userReport.findMany({
        where: status ? { status } : undefined,
        include: {
          reporter: {
            select: {
              id: true,
              phone: true,
              profile: { select: { displayName: true } },
            },
          },
          reportedUser: {
            select: {
              id: true,
              phone: true,
              status: true,
              profile: { select: { displayName: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.userReport.count({
        where: status ? { status } : undefined,
      }),
    ]);

    return {
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Execute moderation action (ban, suspend, warn) with mandatory audit logging
   */
  async executeModerationAction(
    adminId: string,
    targetUserId: string,
    actionType: ModerationActionType,
    reason: string,
    reportId?: string,
    durationHours?: number,
    ipAddress = '127.0.0.1'
  ) {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new NotFoundError('Target user not found');
    }

    let expiresAt: Date | undefined;
    if (durationHours) {
      expiresAt = new Date(Date.now() + durationHours * 3600 * 1000);
    }

    return prisma.$transaction(async (tx) => {
      // 1. Record moderation action
      const action = await tx.moderationAction.create({
        data: {
          adminId,
          targetUserId,
          actionType,
          reason,
          reportId,
          expiresAt,
        },
      });

      // 2. Update user status accordingly
      if (actionType === 'PERMANENT_BAN') {
        await tx.user.update({
          where: { id: targetUserId },
          data: { status: 'BANNED' },
        });
        // Revoke all active user sessions
        await tx.session.updateMany({
          where: { userId: targetUserId },
          data: { isRevoked: true },
        });
      } else if (actionType === 'TEMPORARY_SUSPENSION') {
        await tx.user.update({
          where: { id: targetUserId },
          data: { status: 'SUSPENDED' },
        });
        await tx.session.updateMany({
          where: { userId: targetUserId },
          data: { isRevoked: true },
        });
      } else if (actionType === 'UNBAN') {
        await tx.user.update({
          where: { id: targetUserId },
          data: { status: 'ACTIVE' },
        });
      }

      // 3. Resolve report if provided
      if (reportId) {
        await tx.userReport.update({
          where: { id: reportId },
          data: {
            status: 'RESOLVED',
            assignedAdminId: adminId,
            resolutionNotes: `Action taken: ${actionType}. Reason: ${reason}`,
          },
        });
      }

      // 4. Mandatory Audit Trail Entry
      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: `MODERATION_${actionType}`,
          targetEntity: 'USER',
          targetId: targetUserId,
          reason,
          ipAddress,
        },
      });

      return {
        actionId: action.id,
        actionType,
        targetUserId,
        message: `Moderation action ${actionType} applied successfully`,
      };
    });
  }

  /**
   * Get administrative dashboard metrics
   */
  async getDashboardMetrics() {
    const [
      totalUsers,
      verifiedUsers,
      totalMatches,
      unlockedConversations,
      pendingReports,
      completedPayments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'VERIFIED_USER' } }),
      prisma.match.count({ where: { isActive: true } }),
      prisma.conversation.count({ where: { isUnlocked: true } }),
      prisma.userReport.count({ where: { status: 'PENDING' } }),
      prisma.paymentOrder.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        verified: verifiedUsers,
        verificationRate: totalUsers > 0 ? ((verifiedUsers / totalUsers) * 100).toFixed(1) + '%' : '0%',
      },
      dating: {
        activeMatches: totalMatches,
        unlockedConversations,
      },
      moderation: {
        pendingReports,
      },
      revenue: {
        totalUnlockedCount: completedPayments._count,
        totalRevenueEtb: completedPayments._sum.amount ?? 0,
      },
    };
  }

  /**
   * Get immutable audit log history
   */
  async getAuditLogs(page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        include: {
          admin: { select: { email: true, fullName: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.adminAuditLog.count(),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const adminService = new AdminService();

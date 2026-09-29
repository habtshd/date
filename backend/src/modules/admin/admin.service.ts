import jwt from 'jsonwebtoken';
import { prisma } from '../../database/prisma';
import { config } from '../../config';
import { UnauthorizedError, NotFoundError } from '../../common/errors';
import { ReportStatus } from '@prisma/client';

export class AdminService {
  /**
   * Admin authentication (admin accounts use designated admin user ID)
   */
  async login(email: string, passwordPlain: string) {
    // In production, compare with admin credentials or superadmin account
    if (email !== 'admin@habeshadate.et' || passwordPlain !== 'Admin@Pass123!') {
      throw new UnauthorizedError('Invalid credentials');
    }

    let adminUser = await prisma.user.findFirst({
      where: { phoneNumber: '+251900000000' },
    });

    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          phoneNumber: '+251900000000',
          phoneVerified: true,
          accountStatus: 'ACTIVE',
          verificationStatus: 'VERIFIED',
        },
      });
    }

    const token = jwt.sign(
      { adminId: adminUser.id, email, role: 'SUPER_ADMIN' },
      config.jwt.accessSecret,
      { expiresIn: '8h' }
    );

    return {
      token,
      admin: {
        id: adminUser.id,
        email,
        role: 'SUPER_ADMIN',
      },
    };
  }

  /**
   * List pending and resolved reports for the moderation queue
   */
  async getReports(status?: ReportStatus, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where: status ? { status } : undefined,
        include: {
          reporter: {
            select: {
              id: true,
              phoneNumber: true,
              profile: { select: { firstName: true } },
            },
          },
          reportedUser: {
            select: {
              id: true,
              phoneNumber: true,
              accountStatus: true,
              profile: { select: { firstName: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.report.count({
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
    actionType: 'WARNING' | 'SUSPEND' | 'BAN' | 'UNBAN',
    reason: string,
    reportId?: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new NotFoundError('Target user not found');
    }

    return prisma.$transaction(async (tx) => {
      // 1. Update user account status accordingly
      if (actionType === 'BAN') {
        await tx.user.update({
          where: { id: targetUserId },
          data: { accountStatus: 'BANNED' },
        });
        await tx.session.updateMany({
          where: { userId: targetUserId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      } else if (actionType === 'SUSPEND') {
        await tx.user.update({
          where: { id: targetUserId },
          data: { accountStatus: 'SUSPENDED' },
        });
        await tx.session.updateMany({
          where: { userId: targetUserId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      } else if (actionType === 'UNBAN') {
        await tx.user.update({
          where: { id: targetUserId },
          data: { accountStatus: 'ACTIVE' },
        });
      }

      // 2. Resolve report if provided
      if (reportId) {
        await tx.report.update({
          where: { id: reportId },
          data: {
            status: 'RESOLVED',
            resolvedAt: new Date(),
            resolvedBy: adminId,
          },
        });
      }

      // 3. Mandatory Audit Trail Entry in audit_logs
      await tx.auditLog.create({
        data: {
          actorUserId: adminId,
          action: `MODERATION_${actionType}`,
          targetType: 'USER',
          targetId: targetUserId,
          metadata: { reason, reportId, actionType },
        },
      });

      return {
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
      prisma.user.count({ where: { verificationStatus: 'VERIFIED' } }),
      prisma.match.count({ where: { status: 'ACTIVE' } }),
      prisma.conversation.count({ where: { status: 'ACTIVE' } }),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.payment.aggregate({
        where: { status: 'SUCCESS' },
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
   * Get immutable audit log history from audit_logs
   */
  async getAuditLogs(page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count(),
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

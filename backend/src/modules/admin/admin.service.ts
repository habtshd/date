import jwt from 'jsonwebtoken';
import { prisma } from '../../plugins/prisma';
import { env } from '../../config/env';
import { ReportStatus, ModerationActionType, UserRole } from '@prisma/client';

export class AdminService {
  /**
   * Admin authentication (admin accounts use designated admin user ID)
   */
  async login(email: string, passwordPlain: string) {
    if (email !== 'admin@habeshadate.et' || passwordPlain !== 'Admin@Pass123!') {
      throw new Error('Invalid credentials');
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
          role: UserRole.ADMIN,
        },
      });
    } else if (adminUser.role !== UserRole.ADMIN) {
      adminUser = await prisma.user.update({
        where: { id: adminUser.id },
        data: { role: UserRole.ADMIN },
      });
    }

    const token = jwt.sign(
      { userId: adminUser.id, adminId: adminUser.id, email, role: 'ADMIN' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '8h' }
    );

    return {
      token,
      admin: {
        id: adminUser.id,
        email,
        role: 'ADMIN',
      },
    };
  }

  /**
   * List users with pagination for administrative audit
   */
  async getUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          phoneNumber: true,
          phoneVerified: true,
          accountStatus: true,
          verificationStatus: true,
          role: true,
          createdAt: true,
          lastActiveAt: true,
          profile: {
            select: { firstName: true, city: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count(),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
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
   * Scoped report details inspection: need-to-know access scoped strictly to the report.
   * Only retrieves attached conversation evidence if a conversationId is associated with the report.
   */
  async getReportDetails(reportId: string) {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        reporter: {
          select: {
            id: true,
            phoneNumber: true,
            accountStatus: true,
            verificationStatus: true,
            profile: { select: { firstName: true, city: true } },
          },
        },
        reportedUser: {
          select: {
            id: true,
            phoneNumber: true,
            accountStatus: true,
            verificationStatus: true,
            profile: { select: { firstName: true, city: true } },
          },
        },
      },
    });

    if (!report) {
      throw new Error('Report not found');
    }

    let conversationEvidence = null;
    if (report.conversationId) {
      const messages = await prisma.message.findMany({
        where: {
          conversationId: report.conversationId,
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          senderId: true,
          messageType: true,
          content: true,
          createdAt: true,
        },
      });

      conversationEvidence = {
        conversationId: report.conversationId,
        messages: messages.reverse(),
      };
    }

    return {
      report,
      conversationEvidence,
    };
  }

  /**
   * Update report status (e.g. OPEN -> REVIEWING -> RESOLVED/DISMISSED)
   */
  async updateReportStatus(
    adminId: string,
    reportId: string,
    status: ReportStatus,
    resolutionNotes?: string
  ) {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new Error('Report not found');
    }

    return prisma.$transaction(async (tx) => {
      const isResolution = status === 'RESOLVED' || status === 'DISMISSED';
      const updated = await tx.report.update({
        where: { id: reportId },
        data: {
          status,
          resolvedAt: isResolution ? new Date() : null,
          resolvedBy: isResolution ? adminId : null,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: adminId,
          action: isResolution ? 'REPORT_RESOLVED' : 'REPORT_REVIEWED',
          targetType: 'REPORT',
          targetId: reportId,
          metadata: {
            previousStatus: report.status,
            newStatus: status,
            resolutionNotes,
          },
        },
      });

      return updated;
    });
  }

  /**
   * Execute moderation action (ban, suspend, warn) with mandatory audit logging and ModerationAction record
   */
  async executeModerationAction(
    adminId: string,
    targetUserId: string,
    actionType:
      | 'WARNING'
      | 'SUSPEND'
      | 'BAN'
      | 'UNBAN'
      | 'CONTENT_REMOVED'
      | 'TEMPORARY_SUSPENSION'
      | 'PERMANENT_BAN'
      | 'REPORT_DISMISSED'
      | 'VERIFICATION_REVIEW',
    reason: string,
    reportId?: string,
    expiresAt?: Date
  ) {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new Error('Target user not found');
    }

    return prisma.$transaction(async (tx) => {
      // 1. Update user account status accordingly
      if (actionType === 'BAN' || actionType === 'PERMANENT_BAN') {
        await tx.user.update({
          where: { id: targetUserId },
          data: { accountStatus: 'BANNED' },
        });
        await tx.session.updateMany({
          where: { userId: targetUserId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      } else if (actionType === 'SUSPEND' || actionType === 'TEMPORARY_SUSPENSION') {
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
        const nextStatus = actionType === 'REPORT_DISMISSED' ? 'DISMISSED' : 'RESOLVED';
        await tx.report.update({
          where: { id: reportId },
          data: {
            status: nextStatus,
            resolvedAt: new Date(),
            resolvedBy: adminId,
          },
        });
      }

      // 3. Map to ModerationActionType enum
      let mappedType: ModerationActionType;
      switch (actionType) {
        case 'BAN':
        case 'PERMANENT_BAN':
          mappedType = ModerationActionType.PERMANENT_BAN;
          break;
        case 'SUSPEND':
        case 'TEMPORARY_SUSPENSION':
          mappedType = ModerationActionType.TEMPORARY_SUSPENSION;
          break;
        case 'CONTENT_REMOVED':
          mappedType = ModerationActionType.CONTENT_REMOVED;
          break;
        case 'REPORT_DISMISSED':
          mappedType = ModerationActionType.REPORT_DISMISSED;
          break;
        case 'VERIFICATION_REVIEW':
          mappedType = ModerationActionType.VERIFICATION_REVIEW;
          break;
        case 'WARNING':
        default:
          mappedType = ModerationActionType.WARNING;
          break;
      }

      const moderationAction = await tx.moderationAction.create({
        data: {
          targetUserId,
          moderatorId: adminId,
          type: mappedType,
          reason,
          expiresAt: expiresAt ?? null,
        },
      });

      // 4. Mandatory Audit Trail Entry in audit_logs
      const auditAction =
        actionType === 'BAN' || actionType === 'PERMANENT_BAN'
          ? 'USER_BANNED'
          : actionType === 'SUSPEND' || actionType === 'TEMPORARY_SUSPENSION'
          ? 'USER_SUSPENDED'
          : actionType === 'UNBAN'
          ? 'USER_UNBANNED'
          : 'MODERATION_ACTION_CREATED';

      await tx.auditLog.create({
        data: {
          actorUserId: adminId,
          action: auditAction,
          targetType: 'USER',
          targetId: targetUserId,
          metadata: {
            reason,
            reportId,
            actionType,
            moderationActionId: moderationAction.id,
          },
        },
      });

      return {
        actionType,
        targetUserId,
        moderationActionId: moderationAction.id,
        message: `Moderation action ${actionType} applied successfully`,
      };
    });
  }

  /**
   * Verification queue review for admin
   */
  async getVerificationQueue(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      prisma.verificationRecord.findMany({
        select: {
          id: true,
          userId: true,
          status: true,
          provider: true,
          verifiedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.verificationRecord.count(),
    ]);

    return {
      records: records.map((r) => ({
        id: r.id,
        userId: r.userId,
        status: r.status,
        provider: r.provider,
        verifiedAt: r.verifiedAt,
        createdAt: r.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get payments ledger
   */
  async getPayments(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payment.count(),
    ]);

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
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
      prisma.report.count({ where: { status: { in: ['PENDING', 'OPEN', 'REVIEWING'] } } }),
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

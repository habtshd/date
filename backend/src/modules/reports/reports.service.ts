import { prisma } from '../../database/prisma';
import { BadRequestError, NotFoundError } from '../../common/errors';
import { ReportReason } from '@prisma/client';

export class ReportsService {
  /**
   * File a safety or abuse report against another user
   */
  async fileReport(
    reporterId: string,
    reportedUserId: string,
    reason: ReportReason,
    description?: string,
    conversationId?: string
  ) {
    if (reporterId === reportedUserId) {
      throw new BadRequestError('You cannot report your own account');
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: reportedUserId },
    });

    if (!targetUser) {
      throw new NotFoundError('Target user not found');
    }

    const report = await prisma.userReport.create({
      data: {
        reporterId,
        reportedUserId,
        conversationId,
        reason,
        description,
        status: 'PENDING',
      },
    });

    return {
      reportId: report.id,
      status: report.status,
      message: 'Report received. Our safety moderation team will investigate.',
    };
  }
}

export const reportsService = new ReportsService();

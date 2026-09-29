import { prisma } from '../../plugins/prisma';
import { ReportReason } from '@prisma/client';
import { logger } from '../../utils/logger';

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
      throw new Error('You cannot report your own account');
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: reportedUserId },
    });

    if (!targetUser) {
      throw new Error('Target user not found');
    }

    const report = await prisma.report.create({
      data: {
        reporterId,
        reportedUserId,
        conversationId,
        reason,
        description,
        status: 'PENDING',
      },
    });

    logger.info('Safety report filed', {
      reportId: report.id,
      reporterId,
      reportedUserId,
      reason,
    });

    return {
      reportId: report.id,
      status: report.status,
      message: 'Report received. Our safety moderation team will investigate.',
    };
  }

  /**
   * Get report details by reporter
   */
  async getReportById(reporterId: string, reportId: string) {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new Error('Report not found');
    }

    if (report.reporterId !== reporterId) {
      throw new Error('Access denied to report');
    }

    return {
      id: report.id,
      reason: report.reason,
      description: report.description,
      status: report.status,
      createdAt: report.createdAt,
      resolvedAt: report.resolvedAt,
    };
  }
}

export const reportsService = new ReportsService();

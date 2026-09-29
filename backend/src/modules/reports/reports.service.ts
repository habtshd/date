import { prisma } from '../../plugins/prisma';
import { ReportReason } from '@prisma/client';
import { logger } from '../../utils/logger';

export interface CreateReportInput {
  reporterId: string;
  reportedUserId: string;
  conversationId?: string;
  reason: ReportReason;
  description?: string;
}

export class ReportsService {
  /**
   * File a safety or abuse report against another user
   */
  async createReport(input: CreateReportInput) {
    if (input.reporterId === input.reportedUserId) {
      throw new Error('CANNOT_REPORT_SELF');
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: input.reportedUserId },
    });

    if (!targetUser) {
      throw new Error('USER_NOT_FOUND');
    }

    if (input.description && input.description.length > 2000) {
      throw new Error('DESCRIPTION_TOO_LONG');
    }

    if (input.conversationId) {
      const isMember = await prisma.conversationMember.findUnique({
        where: {
          conversationId_userId: {
            conversationId: input.conversationId,
            userId: input.reporterId,
          },
        },
      });

      if (!isMember) {
        throw new Error('FORBIDDEN');
      }
    }

    const report = await prisma.report.create({
      data: {
        reporterId: input.reporterId,
        reportedUserId: input.reportedUserId,
        conversationId: input.conversationId,
        reason: input.reason,
        description: input.description,
        status: 'OPEN',
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: input.reporterId,
        action: 'REPORT_CREATED',
        targetType: 'USER',
        targetId: input.reportedUserId,
        metadata: { reason: input.reason, reportId: report.id },
      },
    });

    logger.info('Safety report filed', {
      reportId: report.id,
      reporterId: input.reporterId,
      reportedUserId: input.reportedUserId,
      reason: input.reason,
    });

    return {
      reportId: report.id,
      status: report.status,
      message: 'Report received. Our safety moderation team will investigate.',
    };
  }

  /**
   * Legacy alias for createReport
   */
  async fileReport(
    reporterId: string,
    reportedUserId: string,
    reason: ReportReason,
    description?: string,
    conversationId?: string
  ) {
    return this.createReport({
      reporterId,
      reportedUserId,
      reason,
      description,
      conversationId,
    });
  }

  /**
   * Get report details by reporter
   */
  async getReportById(reporterId: string, reportId: string) {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new Error('REPORT_NOT_FOUND');
    }

    if (report.reporterId !== reporterId) {
      throw new Error('FORBIDDEN');
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
export const createReport = (input: CreateReportInput) => reportsService.createReport(input);

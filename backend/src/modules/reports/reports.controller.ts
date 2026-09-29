import { FastifyRequest, FastifyReply } from 'fastify';
import { reportsService } from './reports.service';
import { FileReportSchema, ReportIdParamSchema } from './reports.schema';

export class ReportsController {
  async fileReport(request: FastifyRequest, reply: FastifyReply) {
    const reporterId = request.user!.userId;
    const body = FileReportSchema.parse(request.body);
    try {
      const result = await reportsService.createReport({
        reporterId,
        reportedUserId: body.reportedUserId,
        reason: body.reason,
        description: body.description,
        conversationId: body.conversationId,
      });
      return reply.status(201).send({ success: true, ...result });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'REPORT_FAILED';
      if (message === 'CANNOT_REPORT_SELF') {
        return reply.status(400).send({
          success: false,
          error: 'CANNOT_REPORT_SELF',
          message: 'You cannot report your own account',
        });
      }
      if (message === 'USER_NOT_FOUND') {
        return reply.status(404).send({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'Reported user not found',
        });
      }
      if (message === 'DESCRIPTION_TOO_LONG') {
        return reply.status(400).send({
          success: false,
          error: 'DESCRIPTION_TOO_LONG',
          message: 'Report description cannot exceed 2000 characters',
        });
      }
      if (message === 'FORBIDDEN') {
        return reply.status(403).send({
          success: false,
          error: 'FORBIDDEN',
          message: 'You do not have access to this conversation',
        });
      }
      throw err;
    }
  }

  async getReport(request: FastifyRequest, reply: FastifyReply) {
    const reporterId = request.user!.userId;
    const params = ReportIdParamSchema.parse(request.params);
    try {
      const report = await reportsService.getReportById(reporterId, params.id);
      return reply.status(200).send({ success: true, report });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'REPORT_ERROR';
      if (message === 'REPORT_NOT_FOUND') {
        return reply.status(404).send({ success: false, error: 'REPORT_NOT_FOUND', message: 'Report not found' });
      }
      if (message === 'FORBIDDEN') {
        return reply.status(403).send({ success: false, error: 'FORBIDDEN', message: 'Access denied' });
      }
      throw err;
    }
  }
}

export const reportsController = new ReportsController();

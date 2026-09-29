import { FastifyRequest, FastifyReply } from 'fastify';
import { reportsService } from './reports.service';
import { FileReportSchema, ReportIdParamSchema } from './reports.schema';

export class ReportsController {
  async fileReport(request: FastifyRequest, reply: FastifyReply) {
    const reporterId = request.user!.userId;
    const body = FileReportSchema.parse(request.body);
    const result = await reportsService.fileReport(
      reporterId,
      body.reportedUserId,
      body.reason,
      body.description,
      body.conversationId
    );
    return reply.status(201).send({ success: true, ...result });
  }

  async getReport(request: FastifyRequest, reply: FastifyReply) {
    const reporterId = request.user!.userId;
    const params = ReportIdParamSchema.parse(request.params);
    const report = await reportsService.getReportById(reporterId, params.id);
    return reply.status(200).send({ success: true, report });
  }
}

export const reportsController = new ReportsController();

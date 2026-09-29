import { FastifyRequest, FastifyReply } from 'fastify';
import { adminService } from './admin.service';
import {
  AdminLoginSchema,
  AdminModerationActionSchema,
  AdminUpdateReportSchema,
  AdminReportQuerySchema,
  AdminPaginationSchema,
} from './admin.schema';

export class AdminController {
  async login(request: FastifyRequest, reply: FastifyReply) {
    const body = AdminLoginSchema.parse(request.body);
    const result = await adminService.login(body.email, body.password);
    return reply.status(200).send({ success: true, ...result });
  }

  async getUsers(request: FastifyRequest, reply: FastifyReply) {
    const query = AdminPaginationSchema.parse(request.query || {});
    const result = await adminService.getUsers(query.page, query.limit);
    return reply.status(200).send({ success: true, ...result });
  }

  async getReports(request: FastifyRequest, reply: FastifyReply) {
    const query = AdminReportQuerySchema.parse(request.query || {});
    const result = await adminService.getReports(query.status as any, query.page, query.limit);
    return reply.status(200).send({ success: true, ...result });
  }

  async getReportDetails(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as { id: string };
    try {
      const result = await adminService.getReportDetails(params.id);
      return reply.status(200).send({ success: true, ...result });
    } catch (err: any) {
      return reply.status(404).send({ success: false, message: err.message });
    }
  }

  async updateReportStatus(request: FastifyRequest, reply: FastifyReply) {
    const adminId = request.user!.userId;
    const params = request.params as { id: string };
    const body = AdminUpdateReportSchema.parse(request.body);
    try {
      const result = await adminService.updateReportStatus(
        adminId,
        params.id,
        body.status as any,
        body.resolutionNotes
      );
      return reply.status(200).send({ success: true, report: result });
    } catch (err: any) {
      return reply.status(400).send({ success: false, message: err.message });
    }
  }

  async executeModeration(request: FastifyRequest, reply: FastifyReply) {
    const adminId = request.user!.userId;
    const body = AdminModerationActionSchema.parse(request.body);
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : undefined;
    const result = await adminService.executeModerationAction(
      adminId,
      body.targetUserId,
      body.actionType as any,
      body.reason,
      body.reportId,
      expiresAt
    );
    return reply.status(200).send({ success: true, ...result });
  }

  async getVerificationQueue(request: FastifyRequest, reply: FastifyReply) {
    const query = AdminPaginationSchema.parse(request.query || {});
    const result = await adminService.getVerificationQueue(query.page, query.limit);
    return reply.status(200).send({ success: true, ...result });
  }

  async getPayments(request: FastifyRequest, reply: FastifyReply) {
    const query = AdminPaginationSchema.parse(request.query || {});
    const result = await adminService.getPayments(query.page, query.limit);
    return reply.status(200).send({ success: true, ...result });
  }

  async getDashboardMetrics(_request: FastifyRequest, reply: FastifyReply) {
    const metrics = await adminService.getDashboardMetrics();
    return reply.status(200).send({ success: true, metrics });
  }

  async getAuditLogs(request: FastifyRequest, reply: FastifyReply) {
    const query = AdminPaginationSchema.parse(request.query || {});
    const result = await adminService.getAuditLogs(query.page, query.limit);
    return reply.status(200).send({ success: true, ...result });
  }
}

export const adminController = new AdminController();

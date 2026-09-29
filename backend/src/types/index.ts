import { AccountStatus, VerificationStatus, UserRole } from '@prisma/client';

export interface UserSessionPayload {
  userId: string;
  phoneNumber: string;
  accountStatus: AccountStatus;
  verificationStatus: VerificationStatus;
  role?: UserRole;
}

export interface AdminSessionPayload {
  adminId: string;
  email: string;
  role: string;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { userId: string; role?: string };
    user: UserSessionPayload;
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    admin?: AdminSessionPayload;
  }
}

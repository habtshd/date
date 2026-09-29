import { UserRole, UserStatus, AdminRole } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
}

export interface AuthenticatedAdmin {
  id: string;
  email: string;
  role: AdminRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      admin?: AuthenticatedAdmin;
    }
  }
}

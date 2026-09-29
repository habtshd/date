import { AccountStatus, VerificationStatus } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  phoneNumber: string;
  accountStatus: AccountStatus;
  verificationStatus: VerificationStatus;
}

export interface AuthenticatedAdmin {
  id: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      admin?: AuthenticatedAdmin;
    }
  }
}

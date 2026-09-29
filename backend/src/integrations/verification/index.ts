import { generateOpaqueToken } from '../../utils/crypto';

export interface VerificationInitResult {
  providerReference: string;
  sessionToken: string;
  verificationUrl?: string;
}

export interface VerificationCheckResult {
  providerReference: string;
  status: 'VERIFIED' | 'FAILED' | 'PENDING';
}

export interface IVerificationProvider {
  name: string;
  initiate(userId: string): Promise<VerificationInitResult>;
  verifyCallback(payload: Record<string, unknown>): Promise<VerificationCheckResult>;
}

export class FaydaVerificationProvider implements IVerificationProvider {
  name = 'FAYDA';

  async initiate(userId: string): Promise<VerificationInitResult> {
    const providerReference = `FAYDA_${userId.substring(0, 8)}_${generateOpaqueToken(8).toUpperCase()}`;
    return {
      providerReference,
      sessionToken: generateOpaqueToken(16),
      verificationUrl: `https://fayda.et/kyc-portal?ref=${providerReference}`,
    };
  }

  async verifyCallback(payload: Record<string, unknown>): Promise<VerificationCheckResult> {
    const providerReference = (payload.providerReference || payload.ref) as string;
    const status = payload.status === 'SUCCESS' || payload.status === 'VERIFIED' ? 'VERIFIED' : 'FAILED';

    return {
      providerReference,
      status,
    };
  }
}

export function getVerificationProvider(_name = 'FAYDA'): IVerificationProvider {
  return new FaydaVerificationProvider();
}

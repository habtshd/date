import {
  VerificationProvider,
  VerificationStartResult,
  VerificationResult,
} from './verification.types';

export class MockVerificationProvider implements VerificationProvider {
  readonly name = 'MOCK_PROVIDER';
  private nextStatus: 'VERIFIED' | 'FAILED' | 'PENDING' = 'VERIFIED';

  setNextStatus(status: 'VERIFIED' | 'FAILED' | 'PENDING') {
    this.nextStatus = status;
  }

  async start(userId: string): Promise<VerificationStartResult> {
    const providerReference = `MOCK_REF_${userId.substring(0, 8)}_${Date.now()}`;
    return {
      providerReference,
      redirectUrl: `https://mock-verify.local/session?ref=${providerReference}`,
    };
  }

  async check(providerReference: string): Promise<VerificationResult> {
    return {
      providerReference,
      status: this.nextStatus,
    };
  }

  async verifyWebhook(
    payload: unknown,
    _signature: string | undefined
  ): Promise<VerificationResult> {
    const data = (payload || {}) as Record<string, unknown>;
    const providerReference = String(data.providerReference || 'MOCK_REF_DEFAULT');
    const rawStatus = String(data.status || 'VERIFIED').toUpperCase();

    const status =
      rawStatus === 'FAILED' ? 'FAILED' : rawStatus === 'PENDING' ? 'PENDING' : 'VERIFIED';

    return {
      providerReference,
      status,
    };
  }
}

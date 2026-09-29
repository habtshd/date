export interface VerificationStartResult {
  providerReference: string;
  redirectUrl?: string;
}

export interface VerificationResult {
  providerReference: string;
  status: 'VERIFIED' | 'FAILED' | 'PENDING';
}

export interface VerificationProvider {
  readonly name: string;

  start(userId: string): Promise<VerificationStartResult>;

  check(providerReference: string): Promise<VerificationResult>;

  verifyWebhook(
    payload: unknown,
    signature: string | undefined
  ): Promise<VerificationResult>;
}

import { VerificationProvider } from './verification.types';
import { FaydaVerificationProvider } from './fayda.provider';
import { MockVerificationProvider } from './mock.provider';
import { VerificationService } from './verification.service';

export * from './verification.types';
export * from './fayda.provider';
export * from './mock.provider';
export * from './verification.service';

const defaultProvider =
  process.env.NODE_ENV === 'test'
    ? new MockVerificationProvider()
    : new FaydaVerificationProvider();

export const defaultVerificationService = new VerificationService(
  defaultProvider,
  defaultProvider.name
);

export function getVerificationProvider(name = 'FAYDA'): VerificationProvider {
  if (name.toUpperCase() === 'MOCK' || process.env.NODE_ENV === 'test') {
    return new MockVerificationProvider();
  }
  return new FaydaVerificationProvider();
}

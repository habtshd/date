import { runAuthorizationTests } from './authorization.test';
import { runPrivacyTests } from './privacy.test';
import { runPaymentBypassTests } from './payment-bypass.test';
import { runVerificationBypassTests } from './verification-bypass.test';
import { runBlockBypassTests } from './block-bypass.test';

export async function runSecuritySuite() {
  console.log('\n------------------------------------------------------');
  console.log('🛡️  PHASE 3H SECURITY, PRIVACY & AUTHORIZATION TEST SUITE');
  console.log('------------------------------------------------------');

  await runAuthorizationTests();
  await runPrivacyTests();
  await runPaymentBypassTests();
  await runVerificationBypassTests();
  await runBlockBypassTests();
}

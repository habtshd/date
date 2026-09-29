import { runCryptoTests } from './crypto.test';
import { runSchemaTests } from './schemas.test';
import { runFastifyAppTests } from './fastify-app.test';

async function main() {
  console.log('\n======================================================');
  console.log('🇪🇹 Ethiopian Dating Platform — Phase 3 Test Suite');
  console.log('======================================================\n');

  try {
    await runCryptoTests();
    runSchemaTests();
    await runFastifyAppTests();

    console.log('\n======================================================');
    console.log('🎉 ALL ARCHITECTURE & FASTIFY TESTS PASSED SUCCESSFULLY');
    console.log('======================================================\n');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ TEST SUITE FAILURE:');
    console.error(error);
    process.exit(1);
  }
}

main();

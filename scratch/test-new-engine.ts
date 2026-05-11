import { validateEmailFull } from './src/lib/validator.js';

async function runTests() {
  const tests = [
    { email: 'valid@gmail.com', options: {} },
    { email: 'admin@google.com', options: {} },
    { email: 'support@github.com', options: {} },
    { email: 'nonexistent_test_123@google.com', options: {} },
    { email: 'test@temp-mail.org', options: {} },
    { email: 'invalid-syntax', options: {} }
  ];

  console.log('--- Email Validation Engine Test ---');
  for (const test of tests) {
    console.log(`Testing: ${test.email}`);
    try {
      const result = await validateEmailFull(test.email, {
        excludeDisposable: true,
        excludeRoleBased: true,
        excludeCatchAll: true,
        excludeSpamTraps: true
      });
      console.log(JSON.stringify(result, null, 2));
    } catch (err) {
      console.error(`Error testing ${test.email}:`, err);
    }
    console.log('-----------------------------------');
  }
}

runTests();

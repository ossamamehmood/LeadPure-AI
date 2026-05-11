import { validateEmailFull } from './src/lib/validator.js';

const testEmails = [
  'info@github.com',
  'invalid-random-xyz-123@google.com',
  'contact@leadpure.ai',
  'fake-test-trap-001@yahoo.com'
];

async function runDeterminismTest() {
  console.log("🔥 Running Deterministic Engine Test (10 Iterations)...\n");

  const resultsMatrix: any[] = [];

  for (let i = 0; i < 10; i++) {
    process.stdout.write(`Iteration ${i + 1}/10... `);
    const start = Date.now();
    
    // Simulate concurrent batch processing exactly like the Vercel handler
    const batchResults = await Promise.all(
      testEmails.map(email => validateEmailFull(email, {
        excludeDisposable: true,
        excludeRoleBased: false,
        excludeCatchAll: false,
        excludeSpamTraps: true
      }))
    );

    // Extract statuses for hashing/comparison
    const statusString = batchResults.map(r => `${r.email}:${r.verificationStatus}`).join(' | ');
    resultsMatrix.push(statusString);
    
    console.log(`${Date.now() - start}ms`);
  }

  console.log("\n📊 Determinism Results:");
  const uniqueResults = new Set(resultsMatrix);
  
  if (uniqueResults.size === 1) {
    console.log("✅ 100% DETERMINISTIC: All 10 iterations produced identical validation statuses!");
    console.log(`Expected output state: ${resultsMatrix[0]}`);
  } else {
    console.log("❌ NON-DETERMINISTIC BEHAVIOR DETECTED!");
    console.log("Observed output states:", Array.from(uniqueResults));
  }
}

runDeterminismTest().catch(console.error);

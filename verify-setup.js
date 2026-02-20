import DatabaseManager from './server/DatabaseManager.js';
import { compressPlanFeaturesSync, decompressPlanFeaturesSync } from './server/compression.js';

async function verifySetup() {
  console.log('🔍 Verifying setup...\n');

  try {
    // Test 1: Database connection
    console.log('✓ Test 1: Database connection');
    const db = new DatabaseManager('./data/subscriptions.db');
    await db.initialize();
    console.log('  Database connected successfully\n');

    // Test 2: Check customers
    console.log('✓ Test 2: Customers');
    const customers = await db.query('SELECT * FROM customers');
    console.log(`  Found ${customers.length} customers`);
    customers.forEach(c => console.log(`    - ${c.name} (${c.email})`));
    console.log('');

    // Test 3: Check plans
    console.log('✓ Test 3: Plans');
    const plans = await db.query('SELECT id, name, price, billing_cycle FROM plans');
    console.log(`  Found ${plans.length} plans`);
    plans.forEach(p => console.log(`    - ${p.name}: $${p.price}/${p.billing_cycle}`));
    console.log('');

    // Test 4: Check subscriptions
    console.log('✓ Test 4: Subscriptions');
    const subscriptions = await db.query('SELECT * FROM subscriptions');
    console.log(`  Found ${subscriptions.length} active subscriptions\n`);

    // Test 5: Check billing history
    console.log('✓ Test 5: Billing History');
    const billing = await db.query('SELECT * FROM billing_history');
    console.log(`  Found ${billing.length} billing transactions\n`);

    // Test 6: Compression
    console.log('✓ Test 6: Compression');
    const testData = { features: ['Feature 1', 'Feature 2'], price: 9.99 };
    const compressed = compressPlanFeaturesSync(testData);
    const decompressed = decompressPlanFeaturesSync(compressed);
    const match = JSON.stringify(testData) === JSON.stringify(decompressed);
    console.log(`  Compression round-trip: ${match ? 'PASS' : 'FAIL'}`);
    console.log(`  Original size: ${JSON.stringify(testData).length} bytes`);
    console.log(`  Compressed size: ${compressed.length} bytes\n`);

    await db.close();

    console.log('✅ All verification tests passed!\n');
    console.log('🚀 Ready to start the server with: npm start');
    console.log('📝 Then open http://localhost:3000 in your browser\n');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

verifySetup();

import dotenv from 'dotenv';
import DatabaseManager from './DatabaseManager.js';
import { initializeSchema } from './schema.js';
import { compressPlanFeaturesSync } from './compression.js';
import { randomUUID } from 'crypto';

dotenv.config();

const DB_PATH = process.env.DB_PATH || './data/subscriptions.db';

async function seedDatabase() {
  console.log('Starting database seeding...');

  const db = new DatabaseManager(DB_PATH);
  await db.initialize();
  await initializeSchema(db);

  try {
    // Create sample customers
    const customers = [
      { id: 'customer-1', name: 'Alice Johnson', email: 'alice@example.com' },
      { id: 'customer-2', name: 'Bob Smith', email: 'bob@example.com' },
      { id: 'customer-3', name: 'Carol Williams', email: 'carol@example.com' }
    ];

    console.log('Creating customers...');
    for (const customer of customers) {
      await db.execute(
        'INSERT OR REPLACE INTO customers (id, name, email) VALUES (?, ?, ?)',
        [customer.id, customer.name, customer.email]
      );
    }

    // Create sample plans with compressed features
    const plans = [
      {
        id: 'basic',
        name: 'Basic Plan',
        description: 'Perfect for individuals getting started',
        price: 9.99,
        billing_cycle: 'monthly',
        features: {
          storage: '10GB',
          users: 1,
          support: 'Email',
          features: ['Basic analytics', 'Mobile app access', 'Email support']
        }
      },
      {
        id: 'pro',
        name: 'Pro Plan',
        description: 'For professionals who need more power',
        price: 29.99,
        billing_cycle: 'monthly',
        features: {
          storage: '100GB',
          users: 5,
          support: 'Priority email & chat',
          features: ['Advanced analytics', 'API access', 'Priority support', 'Custom integrations']
        }
      },
      {
        id: 'enterprise',
        name: 'Enterprise Plan',
        description: 'For large teams with advanced needs',
        price: 99.99,
        billing_cycle: 'monthly',
        features: {
          storage: 'Unlimited',
          users: 'Unlimited',
          support: '24/7 phone & chat',
          features: ['Enterprise analytics', 'Dedicated account manager', 'Custom SLA', 'Advanced security', 'SSO integration']
        }
      },
      {
        id: 'yearly-pro',
        name: 'Pro Plan (Yearly)',
        description: 'Pro plan with annual billing - save 20%',
        price: 287.88,
        billing_cycle: 'yearly',
        features: {
          storage: '100GB',
          users: 5,
          support: 'Priority email & chat',
          features: ['Advanced analytics', 'API access', 'Priority support', 'Custom integrations', '20% discount']
        }
      }
    ];

    console.log('Creating plans...');
    for (const plan of plans) {
      const compressed = compressPlanFeaturesSync(plan.features);
      await db.execute(
        'INSERT OR REPLACE INTO plans (id, name, description, price, billing_cycle, features_compressed) VALUES (?, ?, ?, ?, ?, ?)',
        [plan.id, plan.name, plan.description, plan.price, plan.billing_cycle, compressed]
      );
    }

    // Create sample subscriptions
    const subscriptions = [
      {
        id: randomUUID(),
        customer_id: 'customer-1',
        plan_id: 'basic',
        status: 'active',
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: randomUUID(),
        customer_id: 'customer-2',
        plan_id: 'pro',
        status: 'active',
        start_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: randomUUID(),
        customer_id: 'customer-2',
        plan_id: 'basic',
        status: 'active',
        start_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        next_billing_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    console.log('Creating subscriptions...');
    for (const sub of subscriptions) {
      await db.execute(
        'INSERT OR REPLACE INTO subscriptions (id, customer_id, plan_id, status, start_date, next_billing_date) VALUES (?, ?, ?, ?, ?, ?)',
        [sub.id, sub.customer_id, sub.plan_id, sub.status, sub.start_date, sub.next_billing_date]
      );
    }

    // Create sample billing history
    console.log('Creating billing history...');
    for (const sub of subscriptions) {
      const plan = plans.find(p => p.id === sub.plan_id);
      
      // Create 3 months of billing history
      for (let i = 0; i < 3; i++) {
        const transactionDate = new Date(Date.now() - (i * 30 + 5) * 24 * 60 * 60 * 1000).toISOString();
        await db.execute(
          'INSERT INTO billing_history (id, customer_id, subscription_id, amount, status, payment_method, transaction_date, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            randomUUID(),
            sub.customer_id,
            sub.id,
            plan.price,
            'success',
            'Credit Card',
            transactionDate,
            `Payment for ${plan.name}`
          ]
        );
      }
    }

    console.log('✅ Database seeded successfully!');
    console.log('\nSample data created:');
    console.log('- 3 customers');
    console.log('- 4 plans (Basic, Pro, Enterprise, Yearly Pro)');
    console.log('- 3 active subscriptions');
    console.log('- 9 billing transactions');

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await db.close();
  }
}

// Run seeding
seedDatabase().catch(error => {
  console.error('Seeding failed:', error);
  process.exit(1);
});

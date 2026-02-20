/**
 * Database schema definitions
 * Creates all required tables with proper constraints and indexes
 */

export const createTablesSQL = [
  // Customers table
  `CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // Plans table with compressed features
  `CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    billing_cycle TEXT NOT NULL,
    features_compressed BLOB,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // Subscriptions table
  `CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    plan_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('active', 'cancelled', 'paused')),
    start_date DATETIME NOT NULL,
    end_date DATETIME,
    next_billing_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE RESTRICT
  )`,

  // Billing history table
  `CREATE TABLE IF NOT EXISTS billing_history (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    subscription_id TEXT NOT NULL,
    amount REAL NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('success', 'failed', 'pending', 'refunded')),
    payment_method TEXT,
    transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
  )`,

  // Indexes for better query performance
  `CREATE INDEX IF NOT EXISTS idx_subscriptions_customer 
   ON subscriptions(customer_id)`,

  `CREATE INDEX IF NOT EXISTS idx_subscriptions_status 
   ON subscriptions(status)`,

  `CREATE INDEX IF NOT EXISTS idx_billing_customer 
   ON billing_history(customer_id)`,

  `CREATE INDEX IF NOT EXISTS idx_billing_subscription 
   ON billing_history(subscription_id)`,

  `CREATE INDEX IF NOT EXISTS idx_billing_date 
   ON billing_history(transaction_date DESC)`
];

/**
 * Initialize database schema
 * @param {DatabaseManager} db - Database manager instance
 */
export async function initializeSchema(db) {
  try {
    for (const sql of createTablesSQL) {
      await db.execute(sql);
    }
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Schema initialization error:', error);
    throw error;
  }
}

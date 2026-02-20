import { randomUUID } from 'crypto';

/**
 * BillingManager handles billing history and transaction operations
 */
class BillingManager {
  constructor(database) {
    this.db = database;
  }

  /**
   * Record a billing transaction
   * @param {string} customerId - Customer ID
   * @param {string} subscriptionId - Subscription ID
   * @param {number} amount - Transaction amount
   * @param {string} status - Transaction status (success, failed, pending, refunded)
   * @param {string} paymentMethod - Payment method used
   * @param {string} description - Transaction description
   * @returns {Promise<Object>} Created transaction
   */
  async recordTransaction(customerId, subscriptionId, amount, status, paymentMethod = null, description = null) {
    try {
      const transactionId = randomUUID();
      const transactionDate = new Date().toISOString();

      await this.db.execute(
        `INSERT INTO billing_history 
         (id, customer_id, subscription_id, amount, status, payment_method, transaction_date, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [transactionId, customerId, subscriptionId, amount, status, paymentMethod, transactionDate, description]
      );

      return await this.db.queryOne(
        'SELECT * FROM billing_history WHERE id = ?',
        [transactionId]
      );
    } catch (error) {
      console.error('Record transaction error:', error);
      throw error;
    }
  }

  /**
   * Get billing history for a customer
   * @param {string} customerId - Customer ID
   * @param {number} limit - Maximum number of records to return
   * @returns {Promise<Array>} Array of formatted transactions
   */
  async getBillingHistory(customerId, limit = 50) {
    try {
      const transactions = await this.db.query(
        `SELECT bh.*, s.plan_id, p.name as plan_name
         FROM billing_history bh
         JOIN subscriptions s ON bh.subscription_id = s.id
         JOIN plans p ON s.plan_id = p.id
         WHERE bh.customer_id = ?
         ORDER BY bh.transaction_date DESC
         LIMIT ?`,
        [customerId, limit]
      );

      // Format transactions for display
      return transactions.map(tx => this.formatTransaction(tx));
    } catch (error) {
      console.error('Get billing history error:', error);
      throw error;
    }
  }

  /**
   * Get details for a specific transaction
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} Transaction details
   */
  async getTransactionDetails(transactionId) {
    try {
      const transaction = await this.db.queryOne(
        `SELECT bh.*, s.plan_id, p.name as plan_name, c.name as customer_name, c.email
         FROM billing_history bh
         JOIN subscriptions s ON bh.subscription_id = s.id
         JOIN plans p ON s.plan_id = p.id
         JOIN customers c ON bh.customer_id = c.id
         WHERE bh.id = ?`,
        [transactionId]
      );

      if (!transaction) {
        throw new Error(`Transaction with ID ${transactionId} not found`);
      }

      return this.formatTransaction(transaction);
    } catch (error) {
      console.error('Get transaction details error:', error);
      throw error;
    }
  }

  /**
   * Format transaction for display
   * @param {Object} transaction - Raw transaction from database
   * @returns {Object} Formatted transaction
   */
  formatTransaction(transaction) {
    return {
      id: transaction.id,
      date: transaction.transaction_date,
      amount: transaction.amount,
      status: transaction.status,
      paymentMethod: transaction.payment_method,
      description: transaction.description || `Payment for ${transaction.plan_name || 'subscription'}`,
      planName: transaction.plan_name,
      customerId: transaction.customer_id,
      subscriptionId: transaction.subscription_id
    };
  }
}

export default BillingManager;

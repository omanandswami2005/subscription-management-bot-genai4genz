import { randomUUID } from 'crypto';

/**
 * SubscriptionManager handles all subscription-related operations
 */
class SubscriptionManager {
  constructor(database) {
    this.db = database;
  }

  /**
   * Validate that a plan exists in the database
   * @param {string} planId - Plan ID to validate
   * @returns {Promise<boolean>} True if plan exists
   * @throws {Error} If plan doesn't exist
   */
  async validatePlan(planId) {
    const plan = await this.db.queryOne(
      'SELECT id FROM plans WHERE id = ?',
      [planId]
    );
    
    if (!plan) {
      throw new Error(`Plan with ID ${planId} does not exist`);
    }
    
    return true;
  }

  /**
   * Create a new subscription
   * @param {string} customerId - Customer ID
   * @param {string} planId - Plan ID
   * @param {string} startDate - Start date (ISO format)
   * @returns {Promise<Object>} Created subscription object
   */
  async createSubscription(customerId, planId, startDate = new Date().toISOString()) {
    try {
      // Validate plan exists
      await this.validatePlan(planId);

      // Generate subscription ID
      const subscriptionId = randomUUID();

      // Calculate next billing date (30 days from start)
      const start = new Date(startDate);
      const nextBilling = new Date(start);
      nextBilling.setDate(nextBilling.getDate() + 30);

      // Insert subscription
      await this.db.execute(
        `INSERT INTO subscriptions 
         (id, customer_id, plan_id, status, start_date, next_billing_date)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [subscriptionId, customerId, planId, 'active', startDate, nextBilling.toISOString()]
      );

      // Return created subscription
      return await this.db.queryOne(
        'SELECT * FROM subscriptions WHERE id = ?',
        [subscriptionId]
      );
    } catch (error) {
      console.error('Create subscription error:', error);
      throw error;
    }
  }

  /**
   * Update an existing subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated subscription
   */
  async updateSubscription(subscriptionId, updates) {
    try {
      // Validate subscription exists
      const existing = await this.db.queryOne(
        'SELECT * FROM subscriptions WHERE id = ?',
        [subscriptionId]
      );

      if (!existing) {
        throw new Error(`Subscription with ID ${subscriptionId} not found`);
      }

      // If updating plan_id, validate it exists
      if (updates.plan_id) {
        await this.validatePlan(updates.plan_id);
      }

      // Build update query dynamically
      const allowedFields = ['plan_id', 'status', 'end_date', 'next_billing_date'];
      const updateFields = [];
      const values = [];

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          updateFields.push(`${key} = ?`);
          values.push(value);
        }
      }

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      values.push(subscriptionId);

      await this.db.execute(
        `UPDATE subscriptions SET ${updateFields.join(', ')} WHERE id = ?`,
        values
      );

      // Return updated subscription
      return await this.db.queryOne(
        'SELECT * FROM subscriptions WHERE id = ?',
        [subscriptionId]
      );
    } catch (error) {
      console.error('Update subscription error:', error);
      throw error;
    }
  }

  /**
   * Cancel a subscription
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Cancelled subscription
   */
  async cancelSubscription(subscriptionId) {
    try {
      const subscription = await this.db.queryOne(
        'SELECT * FROM subscriptions WHERE id = ?',
        [subscriptionId]
      );

      if (!subscription) {
        throw new Error(`Subscription with ID ${subscriptionId} not found`);
      }

      // Update status to cancelled and set end date
      await this.db.execute(
        `UPDATE subscriptions 
         SET status = ?, end_date = ?
         WHERE id = ?`,
        ['cancelled', new Date().toISOString(), subscriptionId]
      );

      // Return updated subscription
      return await this.db.queryOne(
        'SELECT * FROM subscriptions WHERE id = ?',
        [subscriptionId]
      );
    } catch (error) {
      console.error('Cancel subscription error:', error);
      throw error;
    }
  }

  /**
   * Get all subscriptions for a customer
   * @param {string} customerId - Customer ID
   * @returns {Promise<Array>} Array of subscriptions
   */
  async getCustomerSubscriptions(customerId) {
    try {
      const subscriptions = await this.db.query(
        `SELECT s.*, p.name as plan_name, p.price, p.billing_cycle
         FROM subscriptions s
         JOIN plans p ON s.plan_id = p.id
         WHERE s.customer_id = ?
         ORDER BY s.created_at DESC`,
        [customerId]
      );

      return subscriptions;
    } catch (error) {
      console.error('Get customer subscriptions error:', error);
      throw error;
    }
  }
}

export default SubscriptionManager;

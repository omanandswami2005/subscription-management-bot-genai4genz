/**
 * APIClient handles all HTTP communication with the server
 */
class APIClient {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Send chat message to server
   * @param {string} customerId - Customer ID
   * @param {string} message - User message
   * @param {Array} conversationHistory - Previous messages
   * @returns {Promise<Object>} Server response
   */
  async sendChatMessage(customerId, message, conversationHistory = []) {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerId,
          message,
          conversationHistory
        })
      });

      if (response.status === 429) {
        const data = await response.json();
        this.handleRateLimitError(data.retryAfter);
        throw new Error(data.message);
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send message');
      }

      return await response.json();
    } catch (error) {
      if (error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      throw error;
    }
  }

  /**
   * Get customer subscriptions
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Subscriptions data
   */
  async getSubscriptions(customerId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/subscriptions/${customerId}`);

      if (response.status === 429) {
        const data = await response.json();
        this.handleRateLimitError(data.retryAfter);
        throw new Error(data.message);
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch subscriptions');
      }

      return await response.json();
    } catch (error) {
      if (error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      throw error;
    }
  }

  /**
   * Get billing history
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Billing history data
   */
  async getBillingHistory(customerId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/billing/${customerId}`);

      if (response.status === 429) {
        const data = await response.json();
        this.handleRateLimitError(data.retryAfter);
        throw new Error(data.message);
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch billing history');
      }

      return await response.json();
    } catch (error) {
      if (error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      throw error;
    }
  }

  /**
   * Get AI recommendations
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Recommendations data
   */
  async getRecommendations(customerId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/recommendations/${customerId}`);

      if (response.status === 429) {
        const data = await response.json();
        this.handleRateLimitError(data.retryAfter);
        throw new Error(data.message);
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch recommendations');
      }

      return await response.json();
    } catch (error) {
      if (error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      throw error;
    }
  }

  /**
   * Handle rate limit errors
   * @param {number} retryAfter - Seconds until retry allowed
   */
  handleRateLimitError(retryAfter) {
    console.warn(`Rate limit exceeded. Retry after ${retryAfter} seconds.`);
  }
}

export default APIClient;

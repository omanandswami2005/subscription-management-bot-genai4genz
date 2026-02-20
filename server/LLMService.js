import OpenAI from 'openai';

/**
 * LLMService manages interactions with Groq API for natural language processing
 */
class LLMService {
  constructor(apiKey, baseUrl = 'https://api.groq.com/openai/v1', model = 'llama-3.3-70b-versatile') {
    if (!apiKey) {
      throw new Error('API key is required for LLMService');
    }

    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: baseUrl
    });
    
    this.model = model;
    this.maxRetries = 3;
    this.retryDelay = 1000; // Start with 1 second
  }

  /**
   * Generate chat completion with retry logic
   * @param {Array} messages - Array of message objects
   * @param {string} systemPrompt - System prompt for context
   * @returns {Promise<string>} Generated response text
   */
  async generateResponse(messages, systemPrompt = null) {
    const allMessages = systemPrompt 
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const completion = await this.client.chat.completions.create({
          model: this.model,
          messages: allMessages,
          temperature: 0.7,
          max_tokens: 1000
        });

        return completion.choices[0]?.message?.content || '';
      } catch (error) {
        console.error(`LLM API attempt ${attempt} failed:`, error.message);
        
        if (attempt === this.maxRetries) {
          throw new Error('AI service temporarily unavailable. Please try again later.');
        }

        // Exponential backoff
        await this.sleep(this.retryDelay * attempt);
      }
    }
  }

  /**
   * Extract intent from user message
   * @param {string} userMessage - User's message
   * @param {Object} context - Additional context (customer data, subscriptions)
   * @returns {Promise<Object>} Intent object with action and parameters
   */
  async extractIntent(userMessage, context = {}) {
    try {
      const systemPrompt = `You are a subscription management assistant. Analyze the user's message and extract their intent.
Respond with a JSON object containing:
- action: one of "create_subscription", "update_subscription", "cancel_subscription", "view_subscriptions", "view_billing", "get_recommendations", "general_query"
- parameters: object with relevant parameters (planId, subscriptionId, etc.)
- confidence: number between 0 and 1

Available plans: ${context.availablePlans?.map(p => `${p.id} (${p.name})`).join(', ') || 'Basic, Pro, Enterprise'}`;

      const messages = [
        { role: 'user', content: userMessage }
      ];

      const response = await this.generateResponse(messages, systemPrompt);
      
      // Parse JSON response
      try {
        const intent = JSON.parse(response);
        return intent;
      } catch (parseError) {
        // If JSON parsing fails, return general query intent
        return {
          action: 'general_query',
          parameters: {},
          confidence: 0.5
        };
      }
    } catch (error) {
      console.error('Intent extraction error:', error);
      throw error;
    }
  }

  /**
   * Generate subscription recommendations
   * @param {Object} customerData - Customer information
   * @param {Array} subscriptions - Current subscriptions
   * @param {Array} billingHistory - Billing history
   * @returns {Promise<Array>} Array of recommendations
   */
  async generateRecommendations(customerData, subscriptions, billingHistory) {
    try {
      const systemPrompt = `You are a subscription optimization expert. Analyze the customer's current subscriptions and billing history to provide personalized recommendations.
Respond with a JSON array of recommendations, each containing:
- planId: recommended plan ID
- planName: plan name
- reasoning: explanation of why this plan is recommended
- potentialSavings: estimated savings (positive) or additional cost (negative)
- benefits: array of key benefits`;

      const userMessage = `Customer has ${subscriptions.length} subscription(s):
${subscriptions.map(s => `- ${s.plan_name} ($${s.price}/${s.billing_cycle}), status: ${s.status}`).join('\n')}

Recent billing (last 3 months): $${billingHistory.slice(0, 3).reduce((sum, b) => sum + b.amount, 0).toFixed(2)}

Provide 1-2 recommendations for better plans or consolidation opportunities.`;

      const messages = [
        { role: 'user', content: userMessage }
      ];

      const response = await this.generateResponse(messages, systemPrompt);
      
      try {
        const recommendations = JSON.parse(response);
        return Array.isArray(recommendations) ? recommendations : [recommendations];
      } catch (parseError) {
        console.error('Failed to parse recommendations:', parseError);
        return [];
      }
    } catch (error) {
      console.error('Generate recommendations error:', error);
      throw error;
    }
  }

  /**
   * Sleep utility for retry delays
   * @param {number} ms - Milliseconds to sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default LLMService;

/**
 * RecommendationEngine generates AI-powered subscription recommendations
 */
class RecommendationEngine {
  constructor(llmService, database) {
    this.llmService = llmService;
    this.db = database;
  }

  /**
   * Generate recommendations for a customer
   * @param {string} customerId - Customer ID
   * @returns {Promise<Array>} Array of recommendations
   */
  async generateRecommendations(customerId) {
    try {
      // Get customer data
      const customer = await this.db.queryOne(
        'SELECT * FROM customers WHERE id = ?',
        [customerId]
      );

      if (!customer) {
        throw new Error(`Customer with ID ${customerId} not found`);
      }

      // Get customer subscriptions
      const subscriptions = await this.db.query(
        `SELECT s.*, p.name as plan_name, p.price, p.billing_cycle
         FROM subscriptions s
         JOIN plans p ON s.plan_id = p.id
         WHERE s.customer_id = ? AND s.status = 'active'`,
        [customerId]
      );

      if (subscriptions.length === 0) {
        return [{
          planId: 'basic',
          planName: 'Basic Plan',
          reasoning: 'Start with our Basic plan to get access to essential features',
          potentialSavings: 0,
          benefits: ['Essential features', 'Affordable pricing', 'Easy to upgrade']
        }];
      }

      // Get billing history
      const billingHistory = await this.db.query(
        `SELECT * FROM billing_history
         WHERE customer_id = ? AND status = 'success'
         ORDER BY transaction_date DESC
         LIMIT 10`,
        [customerId]
      );

      // Get all available plans for context
      const allPlans = await this.db.query('SELECT id, name, price, billing_cycle FROM plans');

      // Use LLM to generate recommendations
      const recommendations = await this.llmService.generateRecommendations(
        customer,
        subscriptions,
        billingHistory
      );

      // Calculate savings and format recommendations
      const formattedRecommendations = recommendations.map(rec => {
        const currentTotal = subscriptions.reduce((sum, s) => sum + s.price, 0);
        const recommendedPlan = allPlans.find(p => p.id === rec.planId || p.name === rec.planName);
        
        if (recommendedPlan) {
          rec.potentialSavings = this.calculateSavings(
            subscriptions,
            recommendedPlan,
            billingHistory
          );
        }

        return this.formatRecommendation(rec);
      });

      // Check for multi-subscription consolidation opportunities
      if (subscriptions.length >= 2) {
        const consolidationRec = this.analyzeConsolidation(subscriptions, allPlans);
        if (consolidationRec) {
          formattedRecommendations.push(consolidationRec);
        }
      }

      return formattedRecommendations;
    } catch (error) {
      console.error('Generate recommendations error:', error);
      throw error;
    }
  }

  /**
   * Calculate potential savings
   * @param {Array} currentSubscriptions - Current subscriptions
   * @param {Object} recommendedPlan - Recommended plan
   * @param {Array} billingHistory - Billing history
   * @returns {number} Potential savings (positive) or additional cost (negative)
   */
  calculateSavings(currentSubscriptions, recommendedPlan, billingHistory) {
    // Calculate current monthly cost
    const currentMonthlyCost = currentSubscriptions.reduce((sum, sub) => {
      if (sub.billing_cycle === 'monthly') {
        return sum + sub.price;
      } else if (sub.billing_cycle === 'yearly') {
        return sum + (sub.price / 12);
      }
      return sum;
    }, 0);

    // Calculate recommended plan monthly cost
    let recommendedMonthlyCost = recommendedPlan.price;
    if (recommendedPlan.billing_cycle === 'yearly') {
      recommendedMonthlyCost = recommendedPlan.price / 12;
    }

    // Return savings (positive means saving money)
    return Math.round((currentMonthlyCost - recommendedMonthlyCost) * 100) / 100;
  }

  /**
   * Analyze consolidation opportunities for multiple subscriptions
   * @param {Array} subscriptions - Current subscriptions
   * @param {Array} allPlans - All available plans
   * @returns {Object|null} Consolidation recommendation or null
   */
  analyzeConsolidation(subscriptions, allPlans) {
    const totalCost = subscriptions.reduce((sum, s) => sum + s.price, 0);
    
    // Find enterprise/premium plans that might consolidate features
    const premiumPlans = allPlans.filter(p => 
      p.name.toLowerCase().includes('enterprise') || 
      p.name.toLowerCase().includes('premium')
    );

    if (premiumPlans.length > 0) {
      const bestPlan = premiumPlans[0];
      const savings = totalCost - bestPlan.price;

      if (savings > 0) {
        return {
          planId: bestPlan.id,
          planName: bestPlan.name,
          reasoning: `You have ${subscriptions.length} active subscriptions. Consolidating to ${bestPlan.name} could simplify billing and provide all features in one plan.`,
          potentialSavings: Math.round(savings * 100) / 100,
          benefits: [
            'Single billing cycle',
            'All features included',
            'Simplified management',
            `Save $${Math.round(savings * 100) / 100} per ${bestPlan.billing_cycle}`
          ]
        };
      }
    }

    return null;
  }

  /**
   * Format recommendation for display
   * @param {Object} recommendation - Raw recommendation
   * @returns {Object} Formatted recommendation
   */
  formatRecommendation(recommendation) {
    return {
      planId: recommendation.planId,
      planName: recommendation.planName,
      reasoning: recommendation.reasoning,
      potentialSavings: recommendation.potentialSavings || 0,
      benefits: recommendation.benefits || [],
      costImplication: recommendation.potentialSavings > 0 
        ? `Save $${recommendation.potentialSavings}/month`
        : recommendation.potentialSavings < 0
        ? `Additional $${Math.abs(recommendation.potentialSavings)}/month`
        : 'Similar cost'
    };
  }
}

export default RecommendationEngine;

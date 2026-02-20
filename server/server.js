import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import DatabaseManager from './DatabaseManager.js';
import { initializeSchema } from './schema.js';
import RateLimiter from './RateLimiter.js';
import LLMService from './LLMService.js';
import SubscriptionManager from './SubscriptionManager.js';
import BillingManager from './BillingManager.js';
import RecommendationEngine from './RecommendationEngine.js';

// Load environment variables
dotenv.config();

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || './data/subscriptions.db';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client')));

// Initialize services
let db, rateLimiter, llmService, subscriptionManager, billingManager, recommendationEngine;

async function initializeServices() {
  try {
    // Initialize database
    db = new DatabaseManager(DB_PATH);
    await db.initialize();
    await initializeSchema(db);

    // Initialize rate limiter
    const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10;
    const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000;
    rateLimiter = new RateLimiter(maxRequests, windowMs);

    // Initialize LLM service
    if (!GROQ_API_KEY) {
      console.warn('WARNING: GROQ_API_KEY not set. LLM features will not work.');
    }
    llmService = new LLMService(GROQ_API_KEY);

    // Initialize managers
    subscriptionManager = new SubscriptionManager(db);
    billingManager = new BillingManager(db);
    recommendationEngine = new RecommendationEngine(llmService, db);

    console.log('All services initialized successfully');
  } catch (error) {
    console.error('Service initialization error:', error);
    process.exit(1);
  }
}

// Apply rate limiting to all API routes
app.use('/api', (req, res, next) => {
  if (rateLimiter) {
    return rateLimiter.middleware()(req, res, next);
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// POST /api/chat - Process chat messages
app.post('/api/chat', async (req, res, next) => {
  try {
    const { customerId, message, conversationHistory = [] } = req.body;

    if (!customerId || !message) {
      return res.status(400).json({
        error: true,
        message: 'Missing required fields: customerId and message',
        code: 'MISSING_FIELDS'
      });
    }

    // Get available plans for context
    const availablePlans = await db.query('SELECT id, name, price, billing_cycle FROM plans');

    // Simple keyword-based intent detection (runs first for reliability)
    const lowerMessage = message.toLowerCase();
    let intent = { action: 'general_query', parameters: {}, confidence: 0.5 };

    // Check for subscription viewing keywords
    if ((lowerMessage.includes('subscription') || lowerMessage.includes('plan')) && 
        (lowerMessage.includes('show') || lowerMessage.includes('view') || 
         lowerMessage.includes('list') || lowerMessage.includes('my') || 
         lowerMessage.includes('what') || lowerMessage.includes('see') ||
         lowerMessage.includes('have') || lowerMessage.includes('get'))) {
      intent = { action: 'view_subscriptions', parameters: {}, confidence: 0.9 };
    }
    // Check for billing keywords
    else if (lowerMessage.includes('billing') || lowerMessage.includes('payment') || 
             lowerMessage.includes('transaction') || lowerMessage.includes('invoice') ||
             (lowerMessage.includes('history') && !lowerMessage.includes('subscription'))) {
      intent = { action: 'view_billing', parameters: {}, confidence: 0.9 };
    }
    // Check for recommendation keywords
    else if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest') ||
             lowerMessage.includes('better plan') || lowerMessage.includes('upgrade') ||
             lowerMessage.includes('downgrade')) {
      intent = { action: 'get_recommendations', parameters: {}, confidence: 0.9 };
    }
    // Check for subscription creation keywords
    else if ((lowerMessage.includes('subscribe') || lowerMessage.includes('sign up') || 
              lowerMessage.includes('buy') || lowerMessage.includes('purchase') ||
              lowerMessage.includes('get')) && 
             (lowerMessage.includes('plan') || lowerMessage.includes('basic') || 
              lowerMessage.includes('pro') || lowerMessage.includes('enterprise'))) {
      intent = { action: 'create_subscription', parameters: {}, confidence: 0.8 };
      
      // Try to extract plan ID
      if (lowerMessage.includes('basic')) intent.parameters.planId = 'basic';
      else if (lowerMessage.includes('pro') && !lowerMessage.includes('enterprise')) intent.parameters.planId = 'pro';
      else if (lowerMessage.includes('enterprise')) intent.parameters.planId = 'enterprise';
    }
    // Check for cancellation keywords
    else if (lowerMessage.includes('cancel') || lowerMessage.includes('unsubscribe') || 
             lowerMessage.includes('stop') || lowerMessage.includes('end')) {
      intent = { action: 'cancel_subscription', parameters: {}, confidence: 0.8 };
    }
    // If no keyword match, try LLM (only for complex queries)
    else if (GROQ_API_KEY) {
      try {
        intent = await llmService.extractIntent(message, { availablePlans });
      } catch (error) {
        console.error('LLM intent extraction failed, using keyword fallback:', error);
      }
    }

    console.log('Detected intent:', intent);

    let response = '';
    let action = 'none';
    let data = {};

    // Execute action based on intent
    switch (intent.action) {
      case 'create_subscription':
        if (intent.parameters.planId) {
          const subscription = await subscriptionManager.createSubscription(
            customerId,
            intent.parameters.planId
          );
          action = 'subscription_created';
          data = subscription;
          response = `Great! I've created your ${subscription.plan_name || 'subscription'}. Your subscription is now active.`;
        } else {
          response = 'Which plan would you like to subscribe to? We have: ' + 
                    availablePlans.map(p => `${p.name} ($${p.price}/${p.billing_cycle})`).join(', ');
        }
        break;

      case 'cancel_subscription':
        if (intent.parameters.subscriptionId) {
          const cancelled = await subscriptionManager.cancelSubscription(intent.parameters.subscriptionId);
          action = 'subscription_cancelled';
          data = cancelled;
          response = `Your subscription has been cancelled. It will remain active until the end of your billing period.`;
        } else {
          const subs = await subscriptionManager.getCustomerSubscriptions(customerId);
          if (subs.length === 0) {
            response = "You don't have any active subscriptions to cancel.";
          } else {
            response = 'Which subscription would you like to cancel? ' + 
                      subs.map(s => `${s.plan_name} (ID: ${s.id})`).join(', ');
          }
        }
        break;

      case 'view_subscriptions':
        const subscriptions = await subscriptionManager.getCustomerSubscriptions(customerId);
        data = { subscriptions };
        if (subscriptions.length === 0) {
          response = "You don't have any subscriptions yet. Would you like to explore our plans?";
        } else {
          response = `You have ${subscriptions.length} subscription(s):\n` +
                    subscriptions.map(s => 
                      `- ${s.plan_name}: $${s.price}/${s.billing_cycle}, Status: ${s.status}`
                    ).join('\n');
        }
        break;

      case 'view_billing':
        const billing = await billingManager.getBillingHistory(customerId, 10);
        data = { billing };
        if (billing.length === 0) {
          response = "You don't have any billing history yet.";
        } else {
          response = `Here are your recent transactions:\n` +
                    billing.slice(0, 5).map(b => 
                      `- ${new Date(b.date).toLocaleDateString()}: $${b.amount} (${b.status})`
                    ).join('\n');
        }
        break;

      case 'get_recommendations':
        const recommendations = await recommendationEngine.generateRecommendations(customerId);
        data = { recommendations };
        response = `Based on your usage, here are my recommendations:\n` +
                  recommendations.map(r => 
                    `- ${r.planName}: ${r.reasoning} (${r.costImplication})`
                  ).join('\n');
        break;

      default:
        // General query - use LLM to generate response with proper context
        const customerSubs = await subscriptionManager.getCustomerSubscriptions(customerId);
        const contextInfo = `You are a subscription management assistant helping customer ${customerId}.
        
Current customer subscriptions: ${customerSubs.length > 0 ? customerSubs.map(s => `${s.plan_name} ($${s.price}/${s.billing_cycle})`).join(', ') : 'None'}

Available plans: ${availablePlans.map(p => `${p.name} ($${p.price}/${p.billing_cycle})`).join(', ')}

You can help with:
- Viewing subscriptions
- Creating new subscriptions
- Canceling subscriptions
- Viewing billing history
- Getting plan recommendations

Provide helpful, concise responses. If the user asks about their subscriptions, tell them what they have.`;

        const messages = [
          ...conversationHistory,
          { role: 'user', content: message }
        ];
        response = await llmService.generateResponse(messages, contextInfo);
    }

    res.json({
      response,
      action,
      data
    });

  } catch (error) {
    next(error);
  }
});

// GET /api/subscriptions/:customerId - Get customer subscriptions
app.get('/api/subscriptions/:customerId', async (req, res, next) => {
  try {
    const { customerId } = req.params;

    const subscriptions = await subscriptionManager.getCustomerSubscriptions(customerId);

    res.json({
      subscriptions: subscriptions.map(s => ({
        id: s.id,
        planId: s.plan_id,
        planName: s.plan_name,
        status: s.status,
        startDate: s.start_date,
        nextBillingDate: s.next_billing_date,
        amount: s.price,
        billingCycle: s.billing_cycle
      }))
    });

  } catch (error) {
    next(error);
  }
});

// GET /api/billing/:customerId - Get billing history
app.get('/api/billing/:customerId', async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const transactions = await billingManager.getBillingHistory(customerId, limit);

    res.json({
      transactions
    });

  } catch (error) {
    next(error);
  }
});

// GET /api/recommendations/:customerId - Get AI recommendations
app.get('/api/recommendations/:customerId', async (req, res, next) => {
  try {
    const { customerId } = req.params;

    const recommendations = await recommendationEngine.generateRecommendations(customerId);

    res.json({
      recommendations
    });

  } catch (error) {
    next(error);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    error: true,
    message: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR'
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  
  if (rateLimiter) {
    rateLimiter.stop();
  }
  
  if (db) {
    await db.close();
  }
  
  process.exit(0);
});

// Start server
initializeServices().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
});

// Export for testing
export { app, db, subscriptionManager, billingManager, recommendationEngine };

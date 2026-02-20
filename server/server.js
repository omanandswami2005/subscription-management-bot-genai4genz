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

    // Define available tools/functions for the LLM
    const tools = [
      {
        type: 'function',
        function: {
          name: 'view_subscriptions',
          description: 'Get all subscriptions for the current customer. Use this when user asks to see, show, list, or view their subscriptions.',
          parameters: {
            type: 'object',
            properties: {},
            required: []
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'view_billing_history',
          description: 'Get billing history and transactions for the current customer. Use this when user asks about billing, payments, invoices, or transaction history.',
          parameters: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                description: 'Maximum number of transactions to return (default: 10)'
              }
            },
            required: []
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'get_recommendations',
          description: 'Get AI-powered plan recommendations based on customer usage. Use this when user asks for recommendations, suggestions, or better plans.',
          parameters: {
            type: 'object',
            properties: {},
            required: []
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'create_subscription',
          description: 'Create a new subscription for a plan. Use this when user wants to subscribe, sign up, or purchase a plan.',
          parameters: {
            type: 'object',
            properties: {
              planId: {
                type: 'string',
                description: `Plan ID to subscribe to. Available: ${availablePlans.map(p => p.id).join(', ')}`,
                enum: availablePlans.map(p => p.id)
              }
            },
            required: ['planId']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'cancel_subscription',
          description: 'Cancel an existing subscription. Use this when user wants to cancel or unsubscribe.',
          parameters: {
            type: 'object',
            properties: {
              subscriptionId: {
                type: 'string',
                description: 'ID of the subscription to cancel'
              }
            },
            required: ['subscriptionId']
          }
        }
      }
    ];

    const systemPrompt = `You are a helpful subscription management assistant for customer ${customerId}.

Available plans: ${availablePlans.map(p => `${p.name} (${p.id}) - $${p.price}/${p.billing_cycle}`).join(', ')}

When the user asks about their subscriptions, billing, or wants recommendations, use the appropriate function.
Always be helpful and concise in your responses.`;

    const messages = [
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    // Call LLM with function calling
    const llmResponse = await llmService.generateResponseWithTools(messages, systemPrompt, tools);

    console.log('LLM Response:', llmResponse);

    let response = '';
    let action = 'none';
    let data = {};

    // Check if LLM wants to call a function
    if (llmResponse.toolCalls && llmResponse.toolCalls.length > 0) {
      const toolCall = llmResponse.toolCalls[0];
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments || '{}');

      console.log('Function call:', functionName, functionArgs);

      // Execute the requested function
      switch (functionName) {
        case 'view_subscriptions':
          const subscriptions = await subscriptionManager.getCustomerSubscriptions(customerId);
          data = { subscriptions };
          if (subscriptions.length === 0) {
            response = "You don't have any subscriptions yet. Would you like to explore our plans?";
          } else {
            response = `You have ${subscriptions.length} subscription(s):\n\n` +
                      subscriptions.map(s => 
                        `📦 ${s.plan_name}\n` +
                        `   Status: ${s.status}\n` +
                        `   Price: $${s.price}/${s.billing_cycle}\n` +
                        `   Next billing: ${new Date(s.next_billing_date).toLocaleDateString()}`
                      ).join('\n\n');
          }
          break;

        case 'view_billing_history':
          const limit = functionArgs.limit || 10;
          const billing = await billingManager.getBillingHistory(customerId, limit);
          data = { billing };
          if (billing.length === 0) {
            response = "You don't have any billing history yet.";
          } else {
            response = `Here are your recent transactions:\n\n` +
                      billing.slice(0, 5).map(b => 
                        `💳 ${new Date(b.date).toLocaleDateString()}\n` +
                        `   Amount: $${b.amount}\n` +
                        `   Status: ${b.status}\n` +
                        `   ${b.description}`
                      ).join('\n\n');
          }
          break;

        case 'get_recommendations':
          const recommendations = await recommendationEngine.generateRecommendations(customerId);
          data = { recommendations };
          if (recommendations.length === 0) {
            response = "No recommendations available at this time.";
          } else {
            response = `✨ Based on your usage, here are my recommendations:\n\n` +
                      recommendations.map(r => 
                        `📊 ${r.planName}\n` +
                        `   ${r.reasoning}\n` +
                        `   💰 ${r.costImplication}\n` +
                        `   Benefits: ${r.benefits.join(', ')}`
                      ).join('\n\n');
          }
          break;

        case 'create_subscription':
          if (functionArgs.planId) {
            const subscription = await subscriptionManager.createSubscription(
              customerId,
              functionArgs.planId
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
          if (functionArgs.subscriptionId) {
            const cancelled = await subscriptionManager.cancelSubscription(functionArgs.subscriptionId);
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

        default:
          response = llmResponse.message || "I'm not sure how to help with that.";
      }
    } else {
      // No function call, use LLM's direct response
      response = llmResponse.message || "I'm not sure how to help with that.";
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

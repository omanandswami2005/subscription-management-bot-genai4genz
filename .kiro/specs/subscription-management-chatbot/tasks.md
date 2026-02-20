# Implementation Plan: Subscription Management Chatbot

## Overview

This implementation plan breaks down the subscription management chatbot into discrete coding tasks. The system will be built using JavaScript (Node.js for backend, vanilla JS for frontend) with SQLite database and Groq LLM integration. Tasks are organized to build incrementally, with testing integrated throughout to catch errors early.

## Tasks

- [x] 1. Set up project structure and dependencies
  - Create `client/` and `server/` directories
  - Initialize Node.js project with `package.json`
  - Install dependencies: express, sqlite3, openai, dotenv, cors
  - Install dev dependencies: jest, fast-check, nock
  - Create `.env.example` file with required environment variables
  - Create `.gitignore` file
  - _Requirements: 10.1, 10.2, 10.3, 10.5_

- [ ] 2. Implement database layer
  - [x] 2.1 Create DatabaseManager class
    - Implement SQLite connection management
    - Create `initialize()` method to set up database file and tables
    - Create `query()` and `execute()` methods for database operations
    - Implement `close()` method for cleanup
    - _Requirements: 7.2, 7.3_
  
  - [x] 2.2 Define database schema
    - Create customers table with id, name, email, created_at
    - Create plans table with id, name, description, price, billing_cycle, features_compressed, created_at
    - Create subscriptions table with id, customer_id, plan_id, status, start_date, end_date, next_billing_date, created_at
    - Create billing_history table with id, customer_id, subscription_id, amount, status, payment_method, transaction_date, description
    - Add foreign key constraints
    - _Requirements: 7.3_
  
  - [ ]* 2.3 Write unit tests for DatabaseManager
    - Test database initialization creates file and tables
    - Test query and execute methods work correctly
    - Test error handling for invalid queries
    - _Requirements: 7.2, 7.3_
  
  - [ ]* 2.4 Write property test for database error handling
    - **Property 22: Database Error Handling**
    - **Validates: Requirements 7.5**

- [ ] 3. Implement plan compression utilities
  - [x] 3.1 Create compression functions
    - Implement `compressPlanFeatures(features)` using zlib.gzipSync
    - Implement `decompressPlanFeatures(compressed)` using zlib.gunzipSync
    - Add validation for plan structure before compression
    - _Requirements: 4.1, 4.3, 4.4_
  
  - [ ]* 3.2 Write property test for compression round-trip
    - **Property 16: Compression Round-Trip**
    - **Validates: Requirements 4.5**
  
  - [ ]* 3.3 Write property test for compression storage efficiency
    - **Property 13: Plan Compression Storage**
    - **Validates: Requirements 4.1**
  
  - [ ]* 3.4 Write property test for plan structure validation
    - **Property 15: Plan Structure Validation**
    - **Validates: Requirements 4.4**

- [ ] 4. Implement SubscriptionManager
  - [x] 4.1 Create SubscriptionManager class
    - Implement `createSubscription(customerId, planId, startDate)` method
    - Implement `updateSubscription(subscriptionId, updates)` method
    - Implement `cancelSubscription(subscriptionId)` method
    - Implement `getCustomerSubscriptions(customerId)` method
    - Implement `validatePlan(planId)` method
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [ ]* 4.2 Write property test for subscription creation
    - **Property 5: Subscription Creation**
    - **Validates: Requirements 2.1**
  
  - [ ]* 4.3 Write property test for subscription updates
    - **Property 6: Subscription Update Persistence**
    - **Validates: Requirements 2.2**
  
  - [ ]* 4.4 Write property test for subscription cancellation
    - **Property 7: Subscription Cancellation**
    - **Validates: Requirements 2.3**
  
  - [ ]* 4.5 Write property test for plan validation
    - **Property 8: Plan Validation**
    - **Validates: Requirements 2.4**
  
  - [ ]* 4.6 Write property test for immediate persistence
    - **Property 9: Immediate Database Persistence**
    - **Validates: Requirements 2.5, 3.5**

- [ ] 5. Implement BillingManager
  - [x] 5.1 Create BillingManager class
    - Implement `recordTransaction(customerId, subscriptionId, amount, status)` method
    - Implement `getBillingHistory(customerId, limit)` method
    - Implement `getTransactionDetails(transactionId)` method
    - Add transaction formatting helper method
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [ ]* 5.2 Write property test for billing history retrieval
    - **Property 10: Billing History Retrieval**
    - **Validates: Requirements 3.1, 3.3**
  
  - [ ]* 5.3 Write property test for billing format completeness
    - **Property 11: Billing History Format Completeness**
    - **Validates: Requirements 3.2**
  
  - [ ]* 5.4 Write property test for billing storage completeness
    - **Property 12: Billing Transaction Storage Completeness**
    - **Validates: Requirements 3.4**

- [ ] 6. Checkpoint - Database and core managers
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement RateLimiter
  - [-] 7.1 Create RateLimiter class
    - Implement in-memory storage for request tracking (Map with IP as key)
    - Implement `isAllowed(clientIp)` method
    - Implement `recordRequest(clientIp)` method
    - Implement `getResetTime(clientIp)` method
    - Implement automatic cleanup of expired entries
    - _Requirements: 1.1, 1.2, 1.4_
  
  - [ ]* 7.2 Write property test for rate limit enforcement
    - **Property 1: Rate Limit Enforcement Per IP**
    - **Validates: Requirements 1.1**
  
  - [ ]* 7.3 Write property test for rate limit error response
    - **Property 2: Rate Limit Error Response**
    - **Validates: Requirements 1.2**
  
  - [ ]* 7.4 Write property test for rate limit window reset
    - **Property 3: Rate Limit Window Reset**
    - **Validates: Requirements 1.4**

- [ ] 8. Implement LLMService
  - [ ] 8.1 Create LLMService class
    - Initialize OpenAI client with Groq configuration (baseURL: https://api.groq.com/openai/v1)
    - Implement `generateResponse(messages, systemPrompt)` method
    - Implement `extractIntent(userMessage, context)` method for intent detection
    - Implement `generateRecommendations(customerData, subscriptions, billingHistory)` method
    - Add error handling for API failures with retry logic
    - _Requirements: 9.1, 9.2, 9.3, 9.5_
  
  - [ ]* 8.2 Write property test for LLM error handling
    - **Property 26: LLM Service Error Handling**
    - **Validates: Requirements 9.3**
  
  - [ ]* 8.3 Write unit tests for LLMService
    - Test successful API calls with mocked responses
    - Test retry logic on failures
    - Test intent extraction with various message types
    - _Requirements: 9.1, 9.3_

- [ ] 9. Implement RecommendationEngine
  - [ ] 9.1 Create RecommendationEngine class
    - Implement `generateRecommendations(customerId)` method
    - Implement `calculateSavings(currentPlan, recommendedPlan, billingHistory)` helper
    - Implement `formatRecommendations(recommendations)` helper
    - Implement multi-subscription consolidation analysis
    - _Requirements: 6.1, 6.2, 6.4_
  
  - [ ]* 9.2 Write property test for recommendation generation
    - **Property 19: Recommendation Generation**
    - **Validates: Requirements 6.1**
  
  - [ ]* 9.3 Write property test for recommendation completeness
    - **Property 20: Recommendation Content Completeness**
    - **Validates: Requirements 6.2**
  
  - [ ]* 9.4 Write property test for multi-subscription analysis
    - **Property 21: Multi-Subscription Analysis**
    - **Validates: Requirements 6.4**

- [ ] 10. Implement Express API server
  - [ ] 10.1 Create server.js with Express setup
    - Initialize Express app
    - Configure CORS middleware
    - Configure JSON body parser
    - Add rate limiter middleware to all routes
    - Set up error handling middleware
    - Load environment variables from .env
    - _Requirements: 8.5, 1.5_
  
  - [ ] 10.2 Implement POST /api/chat endpoint
    - Accept customerId, message, conversationHistory in request body
    - Use LLMService to process message and extract intent
    - Execute appropriate operations based on intent (create/update/cancel subscription)
    - Return response with bot message, action type, and data
    - _Requirements: 5.2, 5.4_
  
  - [ ] 10.3 Implement GET /api/subscriptions/:customerId endpoint
    - Retrieve customer subscriptions using SubscriptionManager
    - Return subscriptions array with all details
    - Handle customer not found errors
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [ ] 10.4 Implement GET /api/billing/:customerId endpoint
    - Retrieve billing history using BillingManager
    - Return transactions array with formatted data
    - Handle customer not found errors
    - _Requirements: 3.1, 3.2_
  
  - [ ] 10.5 Implement GET /api/recommendations/:customerId endpoint
    - Generate recommendations using RecommendationEngine
    - Return recommendations array with reasoning and savings
    - Handle errors gracefully
    - _Requirements: 6.1, 6.2, 6.4_
  
  - [ ]* 10.6 Write property test for universal rate limiting
    - **Property 4: Universal Rate Limiting**
    - **Validates: Requirements 1.5**
  
  - [ ]* 10.7 Write property test for JSON response consistency
    - **Property 25: JSON Response Consistency**
    - **Validates: Requirements 8.4**
  
  - [ ]* 10.8 Write property test for intent execution
    - **Property 17: Intent Execution**
    - **Validates: Requirements 5.2**
  
  - [ ]* 10.9 Write property test for conversation context preservation
    - **Property 18: Conversation Context Preservation**
    - **Validates: Requirements 5.4**

- [ ] 11. Checkpoint - Backend complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Implement frontend HTML structure
  - [ ] 12.1 Create client/index.html
    - Add HTML5 boilerplate structure
    - Create chat container with message display area
    - Create input form with text input and send button
    - Add customer ID selector/input for demo purposes
    - Add sections for displaying subscriptions and billing history
    - Link CSS and JavaScript files
    - _Requirements: 10.2_
  
  - [ ] 12.2 Create client/styles.css
    - Style chat interface with modern, clean design
    - Style message bubbles (user vs bot)
    - Style input form and buttons
    - Add responsive design for mobile devices
    - Style error messages and loading states
    - _Requirements: 10.2_

- [ ] 13. Implement frontend JavaScript
  - [ ] 13.1 Create client/apiClient.js
    - Implement APIClient class with baseUrl configuration
    - Implement `sendChatMessage(customerId, message, conversationHistory)` method
    - Implement `getSubscriptions(customerId)` method
    - Implement `getBillingHistory(customerId)` method
    - Implement `handleRateLimitError(retryAfter)` method
    - Add error handling for network failures
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [ ] 13.2 Create client/chatInterface.js
    - Implement ChatInterface class
    - Implement `displayMessage(message, sender)` method to add messages to UI
    - Implement `sendMessage(messageText)` method to send to server
    - Implement `handleResponse(response)` method to process bot replies
    - Implement `displayError(errorMessage)` method
    - Maintain conversation history array
    - Add loading indicators during API calls
    - _Requirements: 5.1, 5.2, 5.4_
  
  - [ ] 13.3 Create client/app.js
    - Initialize ChatInterface and APIClient
    - Set up event listeners for form submission
    - Handle customer ID selection
    - Add buttons to load subscriptions and billing history
    - Wire up all UI interactions
    - _Requirements: 8.1, 8.2_
  
  - [ ]* 13.4 Write property test for client response handling
    - **Property 23: Client Response Handling**
    - **Validates: Requirements 8.2**
  
  - [ ]* 13.5 Write property test for network error handling
    - **Property 24: Network Error Handling**
    - **Validates: Requirements 8.3**

- [ ] 14. Create seed data and initialization
  - [ ] 14.1 Create server/seedData.js
    - Create sample customers (3-5 demo customers)
    - Create sample plans (Basic, Pro, Enterprise with different features and pricing)
    - Create sample subscriptions for demo customers
    - Create sample billing history
    - Export seed function to populate database
    - _Requirements: 7.2, 7.3_
  
  - [ ] 14.2 Add seed command to package.json
    - Create npm script to run seed data
    - Add instructions in README for seeding database
    - _Requirements: 10.5_

- [ ] 15. Create documentation
  - [ ] 15.1 Create comprehensive README.md
    - Add project overview and features
    - Add prerequisites (Node.js version, API key)
    - Add installation instructions
    - Add configuration instructions (.env setup)
    - Add usage instructions (starting server, accessing UI)
    - Add API endpoint documentation
    - Add troubleshooting section
    - _Requirements: 10.4_
  
  - [ ] 15.2 Create docs/ARCHITECTURE.md
    - Document system architecture with diagrams
    - Explain component interactions
    - Document data flow
    - _Requirements: 10.4_
  
  - [ ] 15.3 Create docs/API.md
    - Document all API endpoints with request/response examples
    - Document error codes and messages
    - Document rate limiting behavior
    - _Requirements: 10.4_
  
  - [ ] 15.4 Create docs/DEPLOYMENT.md
    - Add deployment instructions for common platforms
    - Document environment variable requirements
    - Add production considerations
    - _Requirements: 10.4_

- [ ] 16. Integration and final testing
  - [ ]* 16.1 Write integration tests for complete flows
    - Test end-to-end subscription creation flow
    - Test end-to-end billing history retrieval flow
    - Test end-to-end recommendation flow
    - Test error handling across components
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 6.1_
  
  - [ ] 16.2 Manual testing checklist
    - Test chat interface with various queries
    - Test subscription operations through chat
    - Test billing history display
    - Test recommendations feature
    - Test rate limiting behavior
    - Test error scenarios (invalid inputs, network failures)
    - _Requirements: All_

- [ ] 17. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- The innovative feature (AI-powered recommendations) is integrated in tasks 9 and 10.5
- Database is SQLite file-based for easy demo setup
- Rate limiting protects the demo from abuse without requiring authentication

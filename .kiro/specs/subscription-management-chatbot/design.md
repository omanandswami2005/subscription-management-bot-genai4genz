# Design Document: Subscription Management Chatbot

## Overview

The subscription management chatbot is a web-based application that enables customers to manage their subscriptions through natural language conversations. The system consists of a Node.js backend server that integrates with Groq's LLM API and a vanilla JavaScript frontend that provides a chat interface. Data is stored in a SQLite database file, and the system includes AI-powered subscription recommendations as an innovative feature.

The architecture follows a client-server model with clear separation between the presentation layer (HTML/CSS/JS), business logic layer (Node.js API), and data layer (SQLite). The chatbot uses the LLM to understand customer intent and execute appropriate subscription operations.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   HTML UI    │  │  CSS Styles  │  │  JavaScript  │      │
│  │              │  │              │  │   (Fetch)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/JSON
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        Server Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Rate Limiter │  │  API Routes  │  │ LLM Service  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Subscription │  │   Billing    │  │Recommendation│      │
│  │   Manager    │  │   Manager    │  │    Engine    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ SQL
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                         Data Layer                           │
│                    SQLite Database File                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │Customers │ │Subscript.│ │  Plans   │ │ Billing  │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Backend**: Node.js (v18+), Express.js
- **Database**: SQLite3
- **LLM Integration**: OpenAI SDK with Groq API endpoint
- **HTTP Client**: Fetch API (browser), node-fetch (server if needed)

## Components and Interfaces

### 1. Client Components

#### ChatInterface
Manages the chat UI and user interactions.

```javascript
class ChatInterface {
  constructor(apiBaseUrl)
  
  // Display a message in the chat window
  displayMessage(message, sender)
  
  // Send user message to server
  async sendMessage(messageText)
  
  // Handle incoming responses
  handleResponse(response)
  
  // Display error messages
  displayError(errorMessage)
}
```

#### APIClient
Handles all HTTP communication with the server.

```javascript
class APIClient {
  constructor(baseUrl)
  
  // Send chat message to server
  async sendChatMessage(customerId, message, conversationHistory)
  
  // Get customer subscriptions
  async getSubscriptions(customerId)
  
  // Get billing history
  async getBillingHistory(customerId)
  
  // Handle rate limit errors
  handleRateLimitError(retryAfter)
}
```

### 2. Server Components

#### RateLimiter
Implements rate limiting using in-memory storage.

```javascript
class RateLimiter {
  constructor(maxRequests, windowMs)
  
  // Check if request is allowed
  isAllowed(clientIp)
  
  // Record a request
  recordRequest(clientIp)
  
  // Get time until reset
  getResetTime(clientIp)
  
  // Clean up expired entries
  cleanup()
}
```

#### LLMService
Manages interactions with the Groq API.

```javascript
class LLMService {
  constructor(apiKey, baseUrl, model)
  
  // Generate chat completion
  async generateResponse(messages, systemPrompt)
  
  // Extract intent from user message
  async extractIntent(userMessage, context)
  
  // Generate subscription recommendations
  async generateRecommendations(customerData, subscriptions, billingHistory)
}
```

#### SubscriptionManager
Handles all subscription-related operations.

```javascript
class SubscriptionManager {
  constructor(database)
  
  // Create new subscription
  async createSubscription(customerId, planId, startDate)
  
  // Update subscription
  async updateSubscription(subscriptionId, updates)
  
  // Cancel subscription
  async cancelSubscription(subscriptionId)
  
  // Get customer subscriptions
  async getCustomerSubscriptions(customerId)
  
  // Validate plan exists
  async validatePlan(planId)
}
```

#### BillingManager
Manages billing history and transactions.

```javascript
class BillingManager {
  constructor(database)
  
  // Record billing transaction
  async recordTransaction(customerId, subscriptionId, amount, status)
  
  // Get customer billing history
  async getBillingHistory(customerId, limit)
  
  // Get billing details
  async getTransactionDetails(transactionId)
}
```

#### RecommendationEngine
Generates AI-powered subscription recommendations.

```javascript
class RecommendationEngine {
  constructor(llmService, database)
  
  // Analyze customer data and generate recommendations
  async generateRecommendations(customerId)
  
  // Calculate potential savings
  calculateSavings(currentPlan, recommendedPlan, billingHistory)
  
  // Format recommendations for display
  formatRecommendations(recommendations)
}
```

#### DatabaseManager
Manages SQLite database operations.

```javascript
class DatabaseManager {
  constructor(dbPath)
  
  // Initialize database and create tables
  async initialize()
  
  // Execute query
  async query(sql, params)
  
  // Execute insert/update/delete
  async execute(sql, params)
  
  // Close database connection
  async close()
}
```

### 3. API Routes

#### POST /api/chat
Processes chat messages and returns bot responses.

**Request:**
```json
{
  "customerId": "string",
  "message": "string",
  "conversationHistory": [
    {"role": "user|assistant", "content": "string"}
  ]
}
```

**Response:**
```json
{
  "response": "string",
  "action": "none|subscription_created|subscription_updated|subscription_cancelled",
  "data": {}
}
```

#### GET /api/subscriptions/:customerId
Retrieves customer subscriptions.

**Response:**
```json
{
  "subscriptions": [
    {
      "id": "string",
      "planId": "string",
      "planName": "string",
      "status": "active|cancelled",
      "startDate": "ISO8601",
      "nextBillingDate": "ISO8601",
      "amount": "number"
    }
  ]
}
```

#### GET /api/billing/:customerId
Retrieves customer billing history.

**Response:**
```json
{
  "transactions": [
    {
      "id": "string",
      "date": "ISO8601",
      "amount": "number",
      "status": "success|failed|pending",
      "description": "string"
    }
  ]
}
```

#### GET /api/recommendations/:customerId
Gets AI-powered subscription recommendations.

**Response:**
```json
{
  "recommendations": [
    {
      "planId": "string",
      "planName": "string",
      "reasoning": "string",
      "potentialSavings": "number",
      "benefits": ["string"]
    }
  ]
}
```

## Data Models

### Database Schema

#### customers table
```sql
CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### plans table
```sql
CREATE TABLE plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  billing_cycle TEXT NOT NULL,
  features_compressed BLOB,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### subscriptions table
```sql
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL,
  start_date DATETIME NOT NULL,
  end_date DATETIME,
  next_billing_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (plan_id) REFERENCES plans(id)
);
```

#### billing_history table
```sql
CREATE TABLE billing_history (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  subscription_id TEXT NOT NULL,
  amount REAL NOT NULL,
  status TEXT NOT NULL,
  payment_method TEXT,
  transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  description TEXT,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
);
```

### Data Compression

Plan features are stored as compressed JSON to optimize storage:

```javascript
// Compression
function compressPlanFeatures(features) {
  const json = JSON.stringify(features);
  return zlib.gzipSync(Buffer.from(json));
}

// Decompression
function decompressPlanFeatures(compressed) {
  const buffer = zlib.gunzipSync(compressed);
  return JSON.parse(buffer.toString());
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Rate Limit Enforcement Per IP
*For any* client IP address, when that client makes more than 10 requests within a 60-second window, the system should reject subsequent requests until the window resets.
**Validates: Requirements 1.1**

### Property 2: Rate Limit Error Response
*For any* client that exceeds the rate limit, the system should return an HTTP 429 status code with retry-after information indicating when requests will be allowed again.
**Validates: Requirements 1.2**

### Property 3: Rate Limit Window Reset
*For any* client IP address that has been rate limited, after the 60-second window expires, the client should be able to make requests again without receiving rate limit errors.
**Validates: Requirements 1.4**

### Property 4: Universal Rate Limiting
*For any* API endpoint in the system, requests to that endpoint should be subject to the same rate limiting rules as all other endpoints.
**Validates: Requirements 1.5**

### Property 5: Subscription Creation
*For any* valid customer ID and plan ID, when a subscription creation request is made, the system should create a new subscription record in the database with the correct customer and plan associations.
**Validates: Requirements 2.1**

### Property 6: Subscription Update Persistence
*For any* existing subscription, when an update is requested with valid new values, the system should modify the subscription record and the updated values should be retrievable from the database.
**Validates: Requirements 2.2**

### Property 7: Subscription Cancellation
*For any* active subscription, when a cancellation request is made, the system should update the subscription status to "cancelled" and this status should be reflected in subsequent queries.
**Validates: Requirements 2.3**

### Property 8: Plan Validation
*For any* subscription creation or update request with an invalid plan ID, the system should reject the request and return an error indicating the plan does not exist.
**Validates: Requirements 2.4**

### Property 9: Immediate Database Persistence
*For any* subscription or billing transaction operation (create, update, cancel, record), immediately after the operation completes, querying the database should return the updated data.
**Validates: Requirements 2.5, 3.5**

### Property 10: Billing History Retrieval
*For any* customer with billing transactions, when billing history is requested, the system should return all transactions associated with that customer, including specific transaction details when queried by ID.
**Validates: Requirements 3.1, 3.3**

### Property 11: Billing History Format Completeness
*For any* billing transaction, when formatted for display, the output should contain the transaction date, amount, and status fields.
**Validates: Requirements 3.2**

### Property 12: Billing Transaction Storage Completeness
*For any* billing transaction recorded in the database, the stored record should contain timestamp, amount, payment_method, and status fields.
**Validates: Requirements 3.4**

### Property 13: Plan Compression Storage
*For any* plan stored in the database, the features_compressed field should contain data that is smaller in size than the uncompressed JSON representation of the features.
**Validates: Requirements 4.1**

### Property 14: Plan Update with Compression
*For any* existing plan, when the plan details are updated, the new compressed data should decompress to match the updated plan details exactly.
**Validates: Requirements 4.3**

### Property 15: Plan Structure Validation
*For any* plan detail object that is missing required fields or has invalid data types, attempting to store it should result in a validation error and the plan should not be saved.
**Validates: Requirements 4.4**

### Property 16: Compression Round-Trip
*For any* valid plan detail object, compressing it and then decompressing it should produce an object equivalent to the original.
**Validates: Requirements 4.5**

### Property 17: Intent Execution
*For any* message containing a clear subscription operation intent (create, update, cancel), the system should extract the parameters and execute the corresponding operation in the database.
**Validates: Requirements 5.2**

### Property 18: Conversation Context Preservation
*For any* sequence of related messages within a conversation, when a later message references information from an earlier message, the system should correctly interpret the reference using the conversation history.
**Validates: Requirements 5.4**

### Property 19: Recommendation Generation
*For any* customer with at least one active subscription and billing history, when recommendations are requested, the system should return at least one recommendation with a plan ID and reasoning.
**Validates: Requirements 6.1**

### Property 20: Recommendation Content Completeness
*For any* generated recommendation, the recommendation should include the plan name, reasoning explanation, and cost implications (savings or additional cost).
**Validates: Requirements 6.2**

### Property 21: Multi-Subscription Analysis
*For any* customer with two or more active subscriptions, when recommendations are requested, the system should analyze whether consolidation into a single plan would provide benefits.
**Validates: Requirements 6.4**

### Property 22: Database Error Handling
*For any* database operation that fails due to connection errors or constraint violations, the system should catch the error, log the details, and return an appropriate error response without crashing.
**Validates: Requirements 7.5**

### Property 23: Client Response Handling
*For any* HTTP response from the server (success or error), the client should handle it appropriately by either displaying the data or showing an error message.
**Validates: Requirements 8.2**

### Property 24: Network Error Handling
*For any* network error that occurs during a fetch request, the client should display a user-friendly error message and provide an option to retry the request.
**Validates: Requirements 8.3**

### Property 25: JSON Response Consistency
*For any* API endpoint response, the response should be valid JSON and should contain a consistent structure with expected fields for that endpoint type.
**Validates: Requirements 8.4**

### Property 26: LLM Service Error Handling
*For any* LLM API request that fails due to service unavailability or timeout, the system should return an error message to the customer indicating the service is temporarily unavailable.
**Validates: Requirements 9.3**

## Error Handling

### Rate Limiting Errors
- **429 Too Many Requests**: Return when rate limit exceeded with `Retry-After` header
- Include clear message: "Rate limit exceeded. Please try again in X seconds."

### Database Errors
- **500 Internal Server Error**: Return for database connection failures
- Log full error details server-side
- Return generic message to client: "Database error occurred. Please try again."

### Validation Errors
- **400 Bad Request**: Return for invalid input data
- Include specific validation error messages
- Examples: "Invalid plan ID", "Missing required field: customer_id"

### LLM Service Errors
- **503 Service Unavailable**: Return when LLM API is down
- Implement retry logic with exponential backoff (3 attempts)
- Fallback message: "AI service temporarily unavailable. Please try again."

### Not Found Errors
- **404 Not Found**: Return when requested resource doesn't exist
- Examples: "Customer not found", "Subscription not found"

### Error Response Format
All errors follow consistent JSON structure:
```json
{
  "error": true,
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

## Testing Strategy

### Dual Testing Approach

The system will use both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests** focus on:
- Specific examples of subscription operations
- Edge cases (empty inputs, boundary values)
- Error conditions (invalid IDs, missing fields)
- Integration points between components
- Database initialization and schema validation

**Property-Based Tests** focus on:
- Universal properties that hold for all inputs
- Round-trip properties (compression/decompression)
- Invariants (rate limiting, persistence)
- Comprehensive input coverage through randomization

### Property-Based Testing Configuration

**Library**: Use `fast-check` for JavaScript/Node.js property-based testing

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with format: **Feature: subscription-management-chatbot, Property {number}: {property_text}**
- Each correctness property implemented by a SINGLE property-based test

**Example Property Test Structure**:
```javascript
const fc = require('fast-check');

// Feature: subscription-management-chatbot, Property 16: Compression Round-Trip
test('Plan compression round-trip preserves data', () => {
  fc.assert(
    fc.property(
      fc.record({
        name: fc.string(),
        features: fc.array(fc.string()),
        price: fc.float()
      }),
      (planDetails) => {
        const compressed = compressPlanFeatures(planDetails);
        const decompressed = decompressPlanFeatures(compressed);
        expect(decompressed).toEqual(planDetails);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test Organization

```
server/
  tests/
    unit/
      rateLimiter.test.js
      subscriptionManager.test.js
      billingManager.test.js
      recommendationEngine.test.js
      databaseManager.test.js
    property/
      compression.property.test.js
      rateLimiting.property.test.js
      subscriptions.property.test.js
      billing.property.test.js
      recommendations.property.test.js
    integration/
      api.integration.test.js

client/
  tests/
    unit/
      chatInterface.test.js
      apiClient.test.js
    property/
      errorHandling.property.test.js
```

### Testing Tools
- **Test Framework**: Jest
- **Property Testing**: fast-check
- **HTTP Mocking**: nock (for testing API calls)
- **Database Testing**: In-memory SQLite database
- **Coverage**: Aim for 80%+ code coverage

### Key Testing Principles
1. Property tests validate universal correctness across many inputs
2. Unit tests validate specific examples and edge cases
3. Both are necessary and complementary
4. Each property from the design document maps to exactly one property test
5. Test early and often during implementation

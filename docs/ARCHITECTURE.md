# System Architecture

## Overview

The Subscription Management Chatbot follows a three-tier architecture with clear separation of concerns:

1. **Presentation Layer** (Client): HTML/CSS/JavaScript frontend
2. **Business Logic Layer** (Server): Node.js/Express API
3. **Data Layer**: SQLite database

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  index.html  │  │  styles.css  │  │   app.js     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ apiClient.js │  │chatInterface │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/JSON (REST API)
                            │ Rate Limited (10 req/min)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   BUSINESS LOGIC LAYER                       │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    server.js                          │  │
│  │              (Express Application)                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│  ┌─────────────┬──────────┴──────────┬─────────────┐       │
│  │             │                      │             │       │
│  ▼             ▼                      ▼             ▼       │
│  ┌──────┐  ┌──────┐  ┌──────────┐  ┌──────┐  ┌──────┐    │
│  │ Rate │  │ LLM  │  │Subscript.│  │Billing│  │Recomm│    │
│  │Limit │  │Service│  │ Manager  │  │Manager│  │Engine│    │
│  └──────┘  └──────┘  └──────────┘  └──────┘  └──────┘    │
│                │                      │          │          │
│                │                      │          │          │
│                ▼                      ▼          ▼          │
│         ┌──────────┐          ┌──────────────────┐         │
│         │  Groq    │          │  DatabaseManager │         │
│         │   API    │          └──────────────────┘         │
│         └──────────┘                   │                    │
└────────────────────────────────────────┼────────────────────┘
                                         │
                                         │ SQL Queries
                                         ▼
┌─────────────────────────────────────────────────────────────┐
│                        DATA LAYER                            │
│                                                              │
│                   SQLite Database File                       │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │Customers │ │  Plans   │ │Subscript.│ │ Billing  │      │
│  │          │ │(compress)│ │          │ │ History  │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Component Details

### Presentation Layer

#### index.html
- Main HTML structure
- Chat interface container
- Customer selector dropdown
- Quick action buttons
- Loading and error indicators

#### styles.css
- Modern, responsive design
- Chat message styling (user vs bot)
- Animations and transitions
- Mobile-friendly layout

#### app.js
- Application initialization
- Event handler setup
- Customer selection management
- Quick action button handlers

#### apiClient.js
- HTTP communication with server
- Fetch API wrapper
- Error handling
- Rate limit detection

#### chatInterface.js
- Chat UI management
- Message display logic
- Conversation history tracking
- Loading states

### Business Logic Layer

#### server.js
- Express application setup
- Route definitions
- Middleware configuration
- Service initialization
- Error handling

#### RateLimiter
**Purpose**: Protect API from abuse

**Implementation**:
- In-memory Map storage
- Per-IP request tracking
- 60-second sliding window
- Automatic cleanup of expired entries

**Flow**:
```
Request → Check IP → Count < 10? → Allow → Record
                   ↓
                   No → Return 429 with retry-after
```

#### LLMService
**Purpose**: Natural language processing via Groq API

**Capabilities**:
- Chat completion generation
- Intent extraction from user messages
- Recommendation generation
- Retry logic with exponential backoff

**Integration**:
- Uses OpenAI SDK with custom baseURL
- Model: llama-3.3-70b-versatile
- Temperature: 0.7 for balanced responses

#### SubscriptionManager
**Purpose**: Handle all subscription operations

**Methods**:
- `createSubscription()`: Create new subscription
- `updateSubscription()`: Modify existing subscription
- `cancelSubscription()`: Cancel subscription
- `getCustomerSubscriptions()`: Retrieve customer's subscriptions
- `validatePlan()`: Ensure plan exists

**Business Rules**:
- Validates plan existence before creation
- Calculates next billing date (30 days)
- Sets status to 'cancelled' on cancellation
- Joins with plans table for complete data

#### BillingManager
**Purpose**: Manage billing transactions and history

**Methods**:
- `recordTransaction()`: Create billing record
- `getBillingHistory()`: Get customer transactions
- `getTransactionDetails()`: Get specific transaction
- `formatTransaction()`: Format for display

**Features**:
- Automatic timestamp generation
- Transaction status tracking
- Formatted output with plan details

#### RecommendationEngine
**Purpose**: Generate AI-powered subscription recommendations

**Process**:
1. Fetch customer data and subscriptions
2. Retrieve billing history
3. Send to LLM for analysis
4. Calculate potential savings
5. Identify consolidation opportunities
6. Format recommendations

**Special Logic**:
- Multi-subscription consolidation detection
- Savings calculation (monthly normalized)
- Benefit highlighting

#### DatabaseManager
**Purpose**: SQLite database abstraction

**Methods**:
- `initialize()`: Setup database and tables
- `query()`: Execute SELECT queries
- `queryOne()`: Get single result
- `execute()`: Run INSERT/UPDATE/DELETE
- `close()`: Clean shutdown

**Features**:
- Promisified sqlite3 methods
- Automatic directory creation
- Foreign key enforcement
- Connection pooling

### Data Layer

#### Database Schema

**customers**
```sql
id TEXT PRIMARY KEY
name TEXT NOT NULL
email TEXT UNIQUE NOT NULL
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
```

**plans**
```sql
id TEXT PRIMARY KEY
name TEXT NOT NULL
description TEXT
price REAL NOT NULL
billing_cycle TEXT NOT NULL
features_compressed BLOB  -- gzip compressed JSON
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
```

**subscriptions**
```sql
id TEXT PRIMARY KEY
customer_id TEXT NOT NULL → customers(id)
plan_id TEXT NOT NULL → plans(id)
status TEXT NOT NULL CHECK(active|cancelled|paused)
start_date DATETIME NOT NULL
end_date DATETIME
next_billing_date DATETIME
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
```

**billing_history**
```sql
id TEXT PRIMARY KEY
customer_id TEXT NOT NULL → customers(id)
subscription_id TEXT NOT NULL → subscriptions(id)
amount REAL NOT NULL
status TEXT NOT NULL CHECK(success|failed|pending|refunded)
payment_method TEXT
transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP
description TEXT
```

**Indexes**:
- `idx_subscriptions_customer` on subscriptions(customer_id)
- `idx_subscriptions_status` on subscriptions(status)
- `idx_billing_customer` on billing_history(customer_id)
- `idx_billing_subscription` on billing_history(subscription_id)
- `idx_billing_date` on billing_history(transaction_date DESC)

## Data Flow

### Chat Message Flow

```
1. User types message in UI
   ↓
2. chatInterface.sendMessage()
   ↓
3. apiClient.sendChatMessage()
   ↓
4. POST /api/chat (rate limited)
   ↓
5. llmService.extractIntent()
   ↓
6. Execute action (create/update/cancel/view)
   ↓
7. Database operation via manager
   ↓
8. Return response to client
   ↓
9. Display in chat UI
```

### Subscription Creation Flow

```
1. User: "Subscribe to Pro plan"
   ↓
2. LLM extracts intent: { action: "create_subscription", planId: "pro" }
   ↓
3. subscriptionManager.validatePlan("pro")
   ↓
4. subscriptionManager.createSubscription(customerId, "pro")
   ↓
5. Database INSERT into subscriptions
   ↓
6. Return subscription object
   ↓
7. Response: "Great! I've created your Pro subscription..."
```

### Recommendation Flow

```
1. User clicks "Get Recommendations"
   ↓
2. apiClient.getRecommendations(customerId)
   ↓
3. recommendationEngine.generateRecommendations()
   ↓
4. Fetch customer subscriptions + billing history
   ↓
5. llmService.generateRecommendations(data)
   ↓
6. Calculate savings for each recommendation
   ↓
7. Check for consolidation opportunities
   ↓
8. Format and return recommendations
   ↓
9. Display in chat UI
```

## Technology Stack

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with flexbox/grid
- **Vanilla JavaScript (ES6+)**: No framework dependencies
- **Fetch API**: HTTP requests

### Backend
- **Node.js v18+**: Runtime environment
- **Express.js**: Web framework
- **SQLite3**: Database engine
- **OpenAI SDK**: LLM API client
- **dotenv**: Environment configuration
- **cors**: Cross-origin resource sharing

### External Services
- **Groq API**: LLM inference (llama-3.3-70b-versatile)

## Design Patterns

### Singleton Pattern
- DatabaseManager: Single database connection
- RateLimiter: Single instance for all requests

### Factory Pattern
- Message creation in chatInterface
- Transaction formatting in BillingManager

### Strategy Pattern
- Intent-based action execution in chat endpoint
- Different recommendation strategies

### Repository Pattern
- DatabaseManager abstracts data access
- Managers provide domain-specific operations

## Security Considerations

### API Security
- Rate limiting (10 req/min per IP)
- Input validation on all endpoints
- Parameterized SQL queries (injection prevention)
- CORS configuration

### Data Security
- API keys in environment variables
- No sensitive data in client code
- Database file permissions
- Error messages don't leak internals

### Client Security
- XSS prevention via textContent
- HTTPS recommended for production
- No eval() or dangerous functions

## Performance Optimizations

### Database
- Indexes on frequently queried columns
- Compressed plan features (gzip)
- Connection reuse
- Prepared statements

### API
- Rate limiting prevents overload
- Efficient query design
- Minimal data transfer

### Frontend
- Lazy loading of messages
- Debounced input handling
- Efficient DOM updates

## Scalability Considerations

### Current Limitations
- In-memory rate limiting (single server)
- SQLite (single file, no clustering)
- No caching layer

### Future Improvements
- Redis for distributed rate limiting
- PostgreSQL for multi-server support
- Response caching
- Load balancing
- Message queue for async operations

## Error Handling

### Client Errors (4xx)
- 400: Bad Request (validation errors)
- 404: Not Found (resource doesn't exist)
- 429: Too Many Requests (rate limit)

### Server Errors (5xx)
- 500: Internal Server Error (database/LLM failures)
- 503: Service Unavailable (LLM API down)

### Error Response Format
```json
{
  "error": true,
  "message": "Human-readable message",
  "code": "ERROR_CODE",
  "details": {}
}
```

## Monitoring and Logging

### Server Logs
- Request/response logging
- Error stack traces
- Database operation logs
- LLM API call logs

### Metrics to Track
- Request rate per endpoint
- Response times
- Error rates
- Database query performance
- LLM API latency

## Deployment Architecture

### Development
```
localhost:3000 → Express Server → SQLite file
```

### Production (Recommended)
```
Client → CDN → Load Balancer → App Servers → Database
                                    ↓
                                 Groq API
```

## Testing Strategy

### Unit Tests
- Individual component testing
- Mock external dependencies
- Test business logic

### Integration Tests
- API endpoint testing
- Database operations
- End-to-end flows

### Property-Based Tests
- Compression round-trip
- Rate limiting behavior
- Data persistence

---

This architecture provides a solid foundation for a production-ready subscription management system with room for growth and optimization.

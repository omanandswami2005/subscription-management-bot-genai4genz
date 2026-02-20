# API Contract Documentation

## Overview

This document defines the API contract for the Subscription Management Chatbot. All endpoints follow RESTful principles and return JSON responses.

**Base URL**: `http://localhost:3000`

**Content-Type**: `application/json`

---

## Authentication

Currently, the API uses customer IDs for identification. In production, implement proper authentication (JWT, OAuth, etc.).

---

## Endpoints

### 1. Chat Endpoint

Process natural language messages and execute subscription operations using AI function calling.

**Endpoint**: `POST /api/chat`

**Request Body**:
```json
{
  "customerId": "string (required)",
  "message": "string (required)",
  "conversationHistory": "array (optional)"
}
```

**Response**:
```json
{
  "response": "string",
  "action": "string",
  "data": "object"
}
```

**Example Request**:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "customer-1",
    "message": "Show me my subscriptions",
    "conversationHistory": []
  }'
```

**Example Response**:
```json
{
  "response": "You have 1 subscription(s):\n\n📦 Basic Plan\nStatus: active\nPrice: $9.99/monthly\nNext billing: 3/22/2026",
  "action": "view_subscriptions",
  "data": {
    "subscriptions": [
      {
        "id": "sub-1",
        "planName": "Basic Plan",
        "status": "active",
        "price": 9.99,
        "billingCycle": "monthly",
        "nextBillingDate": "2026-03-22"
      }
    ]
  }
}
```

**Supported Intents** (via Function Calling):
- View subscriptions
- View billing history
- Get recommendations
- Create subscription
- Cancel subscription

**Status Codes**:
- `200 OK`: Success
- `400 Bad Request`: Missing required fields
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

### 2. Get Subscriptions

Retrieve all active subscriptions for a customer.

**Endpoint**: `GET /api/subscriptions/:customerId`

**Parameters**:
- `customerId` (path parameter, required): Customer identifier

**Response**:
```json
{
  "subscriptions": [
    {
      "id": "string",
      "customerId": "string",
      "planId": "string",
      "planName": "string",
      "status": "string",
      "startDate": "string (ISO 8601)",
      "nextBillingDate": "string (ISO 8601)",
      "price": "number",
      "billingCycle": "string"
    }
  ]
}
```

**Example Request**:
```bash
curl http://localhost:3000/api/subscriptions/customer-1
```

**Example Response**:
```json
{
  "subscriptions": [
    {
      "id": "sub-1",
      "customerId": "customer-1",
      "planId": "plan-basic",
      "planName": "Basic Plan",
      "status": "active",
      "startDate": "2026-02-22T00:00:00.000Z",
      "nextBillingDate": "2026-03-22T00:00:00.000Z",
      "price": 9.99,
      "billingCycle": "monthly"
    }
  ]
}
```

**Status Codes**:
- `200 OK`: Success
- `404 Not Found`: Customer not found
- `500 Internal Server Error`: Server error

---

### 3. Get Billing History

Retrieve billing transaction history for a customer.

**Endpoint**: `GET /api/billing/:customerId`

**Parameters**:
- `customerId` (path parameter, required): Customer identifier

**Response**:
```json
{
  "billingHistory": [
    {
      "id": "string",
      "customerId": "string",
      "subscriptionId": "string",
      "planName": "string",
      "amount": "number",
      "status": "string",
      "billingDate": "string (ISO 8601)",
      "paymentMethod": "string"
    }
  ]
}
```

**Example Request**:
```bash
curl http://localhost:3000/api/billing/customer-1
```

**Example Response**:
```json
{
  "billingHistory": [
    {
      "id": "bill-1",
      "customerId": "customer-1",
      "subscriptionId": "sub-1",
      "planName": "Basic Plan",
      "amount": 9.99,
      "status": "paid",
      "billingDate": "2026-02-22T00:00:00.000Z",
      "paymentMethod": "credit_card"
    }
  ]
}
```

**Status Codes**:
- `200 OK`: Success
- `404 Not Found`: Customer not found
- `500 Internal Server Error`: Server error

---

### 4. Get Recommendations

Get AI-powered plan recommendations based on customer usage patterns.

**Endpoint**: `GET /api/recommendations/:customerId`

**Parameters**:
- `customerId` (path parameter, required): Customer identifier

**Response**:
```json
{
  "recommendations": [
    {
      "planId": "string",
      "planName": "string",
      "reason": "string",
      "potentialSavings": "number",
      "confidence": "string"
    }
  ]
}
```

**Example Request**:
```bash
curl http://localhost:3000/api/recommendations/customer-1
```

**Example Response**:
```json
{
  "recommendations": [
    {
      "planId": "plan-pro",
      "planName": "Pro Plan",
      "reason": "Based on your usage patterns, upgrading to Pro would give you more features",
      "potentialSavings": 0,
      "confidence": "high"
    }
  ]
}
```

**Status Codes**:
- `200 OK`: Success
- `404 Not Found`: Customer not found
- `500 Internal Server Error`: Server error

---

## Function Calling Schema

The chat endpoint uses OpenAI-style function calling. Here are the available functions:

### view_subscriptions
```json
{
  "name": "view_subscriptions",
  "description": "View all active subscriptions for the customer",
  "parameters": {
    "type": "object",
    "properties": {},
    "required": []
  }
}
```

### view_billing_history
```json
{
  "name": "view_billing_history",
  "description": "View billing history and past transactions",
  "parameters": {
    "type": "object",
    "properties": {},
    "required": []
  }
}
```

### get_recommendations
```json
{
  "name": "get_recommendations",
  "description": "Get AI-powered plan recommendations",
  "parameters": {
    "type": "object",
    "properties": {},
    "required": []
  }
}
```

### create_subscription
```json
{
  "name": "create_subscription",
  "description": "Create a new subscription to a plan",
  "parameters": {
    "type": "object",
    "properties": {
      "planId": {
        "type": "string",
        "description": "The ID of the plan to subscribe to"
      }
    },
    "required": ["planId"]
  }
}
```

### cancel_subscription
```json
{
  "name": "cancel_subscription",
  "description": "Cancel an existing subscription",
  "parameters": {
    "type": "object",
    "properties": {
      "subscriptionId": {
        "type": "string",
        "description": "The ID of the subscription to cancel"
      }
    },
    "required": ["subscriptionId"]
  }
}
```

---

## Rate Limiting

All API endpoints are rate-limited to prevent abuse:

- **Limit**: 10 requests per minute per IP address
- **Window**: 60 seconds (sliding window)
- **Response on Limit Exceeded**:
  - Status Code: `429 Too Many Requests`
  - Headers: `Retry-After: <seconds>`
  - Body: `{ "error": "Too many requests, please try again later" }`

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "string (error message)",
  "details": "string (optional additional details)"
}
```

### Common Error Codes

| Status Code | Meaning | Example |
|------------|---------|---------|
| 400 | Bad Request | Missing required fields |
| 404 | Not Found | Customer or resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Database or LLM service error |

---

## Data Models

### Customer
```typescript
{
  id: string;
  name: string;
  email: string;
  createdAt: string; // ISO 8601
}
```

### Plan
```typescript
{
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: string; // Compressed JSON
}
```

### Subscription
```typescript
{
  id: string;
  customerId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'expired';
  startDate: string; // ISO 8601
  endDate: string | null; // ISO 8601
  nextBillingDate: string; // ISO 8601
}
```

### Billing History
```typescript
{
  id: string;
  customerId: string;
  subscriptionId: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  billingDate: string; // ISO 8601
  paymentMethod: string;
}
```

---

## Versioning

Current API Version: **v1**

Future versions will be accessible via URL path: `/api/v2/...`

---

## CORS Configuration

The API allows cross-origin requests from:
- `http://localhost:3000` (development)
- Configure production origins in `.env`

---

## Security Considerations

1. **API Keys**: Store Groq API key in environment variables
2. **Rate Limiting**: Prevents abuse and DoS attacks
3. **Input Validation**: All inputs are validated before processing
4. **SQL Injection Protection**: Uses parameterized queries
5. **CORS**: Configured to allow only trusted origins

---

## Testing

See [TESTING-GUIDE.md](./TESTING-GUIDE.md) for comprehensive testing instructions.

---

## Support

For API issues or questions:
- Check server logs for detailed error messages
- Review the troubleshooting section in README.md
- Open an issue on GitHub

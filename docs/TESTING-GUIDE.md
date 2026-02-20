# Testing Guide

## Overview

This guide covers all testing approaches for the Subscription Management Chatbot, including manual testing, automated tests, and function calling verification.

---

## Prerequisites

1. Server running on `http://localhost:3000`
2. Database seeded with sample data (`npm run seed`)
3. Valid Groq API key configured in `.env`

---

## Manual Testing

### Using the Web Interface

1. Start the server:
```bash
npm start
```

2. Open browser: `http://localhost:3000`

3. Test these scenarios:

**Scenario 1: View Subscriptions**
- Type: "Show me my subscriptions"
- Expected: List of active subscriptions with emoji, status, price, next billing date

**Scenario 2: View Billing History**
- Type: "Show my billing history"
- Expected: List of past transactions with dates and amounts

**Scenario 3: Get Recommendations**
- Type: "What plans do you recommend?"
- Expected: AI-generated recommendations based on usage

**Scenario 4: Create Subscription**
- Type: "I want to subscribe to the Pro plan"
- Expected: Confirmation of new subscription

**Scenario 5: Cancel Subscription**
- Type: "Cancel my subscription"
- Expected: Confirmation of cancellation

**Scenario 6: Quick Actions**
- Click sidebar buttons (📋 View Subscriptions, 💳 Billing History, ✨ Get Recommendations)
- Expected: Same formatting as chat responses

---

## Testing with curl

### Test Chat Endpoint

**View Subscriptions**:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "customer-1",
    "message": "Show me my subscriptions",
    "conversationHistory": []
  }'
```

**View Billing History**:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "customer-1",
    "message": "Show my billing history",
    "conversationHistory": []
  }'
```

**Get Recommendations**:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "customer-1",
    "message": "What plans do you recommend?",
    "conversationHistory": []
  }'
```

### Test Direct API Endpoints

**Get Subscriptions**:
```bash
curl http://localhost:3000/api/subscriptions/customer-1
```

**Get Billing History**:
```bash
curl http://localhost:3000/api/billing/customer-1
```

**Get Recommendations**:
```bash
curl http://localhost:3000/api/recommendations/customer-1
```

---

## Verifying Function Calling

Function calling is the core feature that enables reliable intent detection. Here's how to verify it's working:

### Check Server Logs

When function calling works correctly, you'll see logs like this:

```
LLM Response: {
  message: '',
  toolCalls: [ { id: 'ptcz76x9v', type: 'function', function: [Object] } ],
  finishReason: 'tool_calls'
}
Function call: view_subscriptions {}
```

**Key Indicators**:
- `toolCalls` array is present and not empty
- `finishReason` is `'tool_calls'`
- `Function call:` log shows which function was invoked

### What to Look For

✅ **Working Correctly**:
```
LLM Response: { message: '', toolCalls: [...], finishReason: 'tool_calls' }
Function call: view_subscriptions {}
```

❌ **Not Working** (LLM returning text instead):
```
LLM Response: { message: 'I can help you...', toolCalls: [], finishReason: 'stop' }
```

### Test All Functions

1. **view_subscriptions**: "Show my subscriptions"
2. **view_billing_history**: "Show billing history"
3. **get_recommendations**: "Recommend plans"
4. **create_subscription**: "Subscribe to Pro plan"
5. **cancel_subscription**: "Cancel my subscription"

---

## Automated Testing

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Test Coverage

Current test coverage includes:
- Database operations (CRUD)
- Subscription management
- Billing history
- Rate limiting
- Compression utilities
- LLM service integration

---

## Rate Limiting Tests

### Test Rate Limit

Send 11 requests rapidly (limit is 10/minute):

```bash
for i in {1..11}; do
  curl -X POST http://localhost:3000/api/chat \
    -H "Content-Type: application/json" \
    -d '{
      "customerId": "customer-1",
      "message": "test",
      "conversationHistory": []
    }'
  echo ""
done
```

**Expected**: First 10 succeed, 11th returns `429 Too Many Requests`

---

## Testing Different Customer Scenarios

### Customer 1 (Has Basic Plan)
```bash
curl http://localhost:3000/api/subscriptions/customer-1
```
Expected: 1 subscription (Basic Plan)

### Customer 2 (Has Multiple Plans)
```bash
curl http://localhost:3000/api/subscriptions/customer-2
```
Expected: 2 subscriptions (Pro + Basic)

### Customer 3 (No Subscriptions)
```bash
curl http://localhost:3000/api/subscriptions/customer-3
```
Expected: Empty array

---

## Testing Recommendations

### Test Recommendation Generation

```bash
curl http://localhost:3000/api/recommendations/customer-1
```

**What to Check**:
1. Response is valid JSON
2. Contains array of recommendations
3. Each recommendation has: planId, planName, reason, confidence
4. Server logs show successful LLM call

### Common Issues

**Issue**: JSON parsing error
```
Failed to parse recommendations: SyntaxError
```

**Solution**: System automatically handles markdown code blocks. Check server logs for raw LLM response.

---

## Testing Compression

### Verify Plan Features Compression

```bash
# Check database directly
sqlite3 data/subscriptions.db "SELECT id, name, length(features) as compressed_size FROM plans;"
```

**Expected**: Features column shows compressed size (much smaller than original JSON)

---

## Performance Testing

### Response Time Test

```bash
time curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "customer-1",
    "message": "Show subscriptions",
    "conversationHistory": []
  }'
```

**Expected**: Response time < 2 seconds (depends on Groq API latency)

---

## Error Handling Tests

### Test Missing Required Fields

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "test"
  }'
```
Expected: `400 Bad Request`

### Test Invalid Customer ID

```bash
curl http://localhost:3000/api/subscriptions/invalid-customer
```
Expected: Empty subscriptions array or 404

### Test Invalid Endpoint

```bash
curl http://localhost:3000/api/invalid
```
Expected: `404 Not Found`

---

## Database Testing

### Verify Database Schema

```bash
sqlite3 data/subscriptions.db ".schema"
```

**Expected Tables**:
- customers
- plans
- subscriptions
- billing_history

### Check Sample Data

```bash
sqlite3 data/subscriptions.db "SELECT * FROM customers;"
sqlite3 data/subscriptions.db "SELECT * FROM plans;"
sqlite3 data/subscriptions.db "SELECT * FROM subscriptions;"
sqlite3 data/subscriptions.db "SELECT * FROM billing_history;"
```

---

## Frontend Testing

### Test Chat Interface

1. **Typing Animation**: Verify three-dot animation appears while waiting for response
2. **Message Display**: Check messages appear in correct order
3. **Quick Actions**: Test all sidebar buttons
4. **Formatting**: Verify emoji, status, price, and dates display correctly
5. **Error Handling**: Test with invalid inputs

### Browser Console Testing

Open browser console and test API client:

```javascript
// Test chat
fetch('http://localhost:3000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customerId: 'customer-1',
    message: 'Show subscriptions',
    conversationHistory: []
  })
}).then(r => r.json()).then(console.log);
```

---

## Troubleshooting Tests

### Function Calling Not Working

1. Check model name in `server/LLMService.js`:
```javascript
model: 'llama-3.3-70b-versatile'  // Must support function calling
```

2. Verify tools are defined in `generateResponseWithTools()`

3. Check server logs for `toolCalls` array

### Recommendations Failing

1. Check server logs for raw LLM response
2. Verify markdown code block extraction is working
3. Test with fallback recommendations

### Rate Limiting Issues

1. Wait 60 seconds between test runs
2. Check `RATE_LIMIT_MAX_REQUESTS` in `.env`
3. Restart server to reset rate limit counters

---

## CI/CD Testing

### GitHub Actions Example

```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run seed
      - run: npm test
```

---

## Test Checklist

Before submitting or deploying:

- [ ] All automated tests pass (`npm test`)
- [ ] Function calling verified in server logs
- [ ] All curl commands return expected results
- [ ] Rate limiting works correctly
- [ ] Frontend displays messages properly
- [ ] Typing animation works
- [ ] Quick action buttons work
- [ ] Recommendations generate successfully
- [ ] Database operations work correctly
- [ ] Error handling works as expected

---

## Support

For testing issues:
- Review server logs for detailed error messages
- Check the troubleshooting section in README.md
- Verify environment variables are set correctly
- Ensure database is seeded with sample data

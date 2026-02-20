# Testing Guide - Function Calling Implementation

## What Changed

I've implemented **OpenAI Function Calling** (also called Tool Use) for the LLM. This is much more reliable than trying to parse JSON responses.

### How Function Calling Works:

1. We define available functions (tools) with descriptions
2. LLM decides which function to call based on user message
3. LLM returns function name + parameters
4. We execute the function and return results

This is the **standard way** to integrate LLMs with external systems!

## Testing with cURL

### Step 1: Start the Server

In one terminal:
```bash
npm start
```

Wait for: `Server running on http://localhost:3000`

### Step 2: Run Tests

In another terminal (Windows):
```cmd
test-api.cmd
```

Or manually test:

#### Test 1: View Subscriptions
```bash
curl -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d "{\"customerId\":\"customer-1\",\"message\":\"show me my subscriptions\",\"conversationHistory\":[]}"
```

Expected response:
```json
{
  "response": "You have 1 subscription(s):\n- Basic Plan: $9.99/monthly, Status: active",
  "action": "none",
  "data": {
    "subscriptions": [...]
  }
}
```

#### Test 2: View Billing
```bash
curl -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d "{\"customerId\":\"customer-1\",\"message\":\"show my billing history\",\"conversationHistory\":[]}"
```

#### Test 3: Get Recommendations
```bash
curl -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d "{\"customerId\":\"customer-2\",\"message\":\"recommend a better plan\",\"conversationHistory\":[]}"
```

## Available Functions (Tools)

The LLM can now call these functions:

1. **view_subscriptions** - Get customer subscriptions
2. **view_billing_history** - Get billing transactions
3. **get_recommendations** - Get AI recommendations
4. **create_subscription** - Subscribe to a plan
5. **cancel_subscription** - Cancel a subscription

## Testing in Browser

1. Start server: `npm start`
2. Open: http://localhost:3000
3. Try these messages:
   - "show me my subscriptions"
   - "what's my billing history"
   - "recommend a plan"
   - "subscribe to pro plan"

## Debugging

Check server console for:
```
LLM Response: { message: '...', toolCalls: [...], finishReason: 'tool_calls' }
Function call: view_subscriptions {}
```

This shows:
- What the LLM returned
- Which function it wants to call
- What parameters it provided

## Why This Works Better

**Before (JSON parsing):**
- LLM returns conversational text
- We try to parse JSON (often fails)
- Fallback to keywords (unreliable)

**After (Function calling):**
- LLM returns structured function call
- We execute the exact function
- Always works correctly

This is the **industry standard** for LLM integrations! 🎯

## Troubleshooting

### "AI service temporarily unavailable"
- Check GROQ_API_KEY in .env
- Verify API key is valid
- Check internet connection

### "Database not initialized"
- Run: `npm run seed`
- Check data/subscriptions.db exists

### Function not being called
- Check server console logs
- Verify LLM response shows toolCalls
- Ensure Groq API supports function calling

## Next Steps

The system now uses proper function calling. Test it with various queries and it should work reliably!

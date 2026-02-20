@echo off
echo Testing Subscription Management API with Function Calling
echo ==========================================================
echo.

echo Test 1: View subscriptions
echo Request: "show me my subscriptions"
curl -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d "{\"customerId\":\"customer-1\",\"message\":\"show me my subscriptions\",\"conversationHistory\":[]}"
echo.
echo ---
echo.

echo Test 2: View billing history
echo Request: "show my billing history"
curl -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d "{\"customerId\":\"customer-1\",\"message\":\"show my billing history\",\"conversationHistory\":[]}"
echo.
echo ---
echo.

echo Test 3: Get recommendations
echo Request: "recommend a better plan"
curl -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d "{\"customerId\":\"customer-2\",\"message\":\"recommend a better plan\",\"conversationHistory\":[]}"
echo.
echo ==========================================================
echo Tests complete!

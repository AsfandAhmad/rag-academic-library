#!/bin/bash

# Test login
echo "🔐 Testing login..."
LOGIN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=password")

echo "$LOGIN" | jq . 2>/dev/null || echo "$LOGIN"

TOKEN=$(echo "$LOGIN" | jq -r '.access_token' 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Login failed - no token received"
  exit 1
fi

echo "✅ Token: ${TOKEN:0:30}..."

# Test chat
echo -e "\n💬 Testing chat..."
curl -s -X POST http://localhost:8000/query/ask \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"question": "What is machine learning?"}' | jq . 2>/dev/null || echo "Error in chat request"

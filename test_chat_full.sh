#!/bin/bash

# Register test user
echo "📝 Registering test user..."
REGISTER=$(curl -s -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "chattest@example.com",
    "name": "Chat Test",
    "password": "testpass123",
    "role": "student"
  }')

echo "$REGISTER" | jq . 2>/dev/null || echo "$REGISTER"

TOKEN=$(echo "$REGISTER" | jq -r '.access_token' 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Registration failed"
  exit 1
fi

echo "✅ Token received: ${TOKEN:0:40}..."

# Test chat
echo -e "\n💬 Testing chat..."
curl -s -X POST http://localhost:8000/query/ask \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"question": "What is machine learning?"}' | jq . 2>/dev/null || echo "Error"

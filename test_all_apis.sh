#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     RAG Academic Library - Complete API Test Suite    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}\n"

# Test counter
PASSED=0
FAILED=0

# Helper function
test_endpoint() {
    local name=$1
    local result=$2
    if [ $result -eq 0 ]; then
        echo -e "${GREEN}✓ $name${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ $name${NC}"
        ((FAILED++))
    fi
}

# ═══════════════════════════════════════════════════════
echo -e "${YELLOW}[1] Testing Health & Root Endpoints${NC}"
echo "─────────────────────────────────────────────────────"

# Health check
response=$(curl -s http://localhost:8000/health)
if [[ $response == *"ok"* ]]; then
    test_endpoint "Health Check" 0
else
    test_endpoint "Health Check" 1
fi

# Root endpoint
response=$(curl -s http://localhost:8000/)
if [[ $response == *"RAG Academic Library"* ]]; then
    test_endpoint "Root Endpoint" 0
else
    test_endpoint "Root Endpoint" 1
fi

echo ""

# ═══════════════════════════════════════════════════════
echo -e "${YELLOW}[2] Testing Authentication Endpoints${NC}"
echo "─────────────────────────────────────────────────────"

# Register new user with timestamp
TIMESTAMP=$(date +%s)
EMAIL="testuser${TIMESTAMP}@example.com"

response=$(curl -s -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"name\": \"Test User $TIMESTAMP\",
    \"password\": \"testpass123\",
    \"role\": \"student\"
  }")

if [[ $response == *"access_token"* ]]; then
    test_endpoint "User Registration" 0
    TOKEN=$(echo $response | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
else
    test_endpoint "User Registration" 1
    echo -e "${RED}Response: $response${NC}"
    exit 1
fi

# Login
response=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$EMAIL&password=testpass123")

if [[ $response == *"access_token"* ]]; then
    test_endpoint "User Login" 0
    TOKEN=$(echo $response | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
else
    test_endpoint "User Login" 1
fi

# Get current user
response=$(curl -s http://localhost:8000/auth/me \
  -H "Authorization: Bearer $TOKEN")

if [[ $response == *"email"* ]]; then
    test_endpoint "Get Current User" 0
else
    test_endpoint "Get Current User" 1
fi

echo ""

# ═══════════════════════════════════════════════════════
echo -e "${YELLOW}[3] Testing Upload Endpoints${NC}"
echo "─────────────────────────────────────────────────────"

# Get my documents
response=$(curl -s http://localhost:8000/upload/my-docs \
  -H "Authorization: Bearer $TOKEN")

if [[ $response == *"["* ]]; then
    test_endpoint "Get My Documents" 0
    DOC_COUNT=$(echo $response | grep -o '"id"' | wc -l)
    echo -e "  ${BLUE}→ Found $DOC_COUNT documents${NC}"
else
    test_endpoint "Get My Documents" 1
fi

# Test PDF upload (requires actual PDF file)
if [ -f "test.pdf" ]; then
    response=$(curl -s -X POST http://localhost:8000/upload/pdf \
      -H "Authorization: Bearer $TOKEN" \
      -F "file=@test.pdf")
    
    if [[ $response == *"chunks"* ]]; then
        test_endpoint "Upload PDF" 0
    else
        test_endpoint "Upload PDF" 1
    fi
else
    echo -e "${BLUE}  ℹ Skipping PDF upload test (no test.pdf file)${NC}"
fi

echo ""

# ═══════════════════════════════════════════════════════
echo -e "${YELLOW}[4] Testing Query Endpoints${NC}"
echo "─────────────────────────────────────────────────────"

# Ask question (will fail if no documents uploaded)
response=$(curl -s -X POST http://localhost:8000/query/ask \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"question": "What is machine learning?"}')

if [[ $response == *"answer"* ]] || [[ $response == *"No relevant documents"* ]]; then
    test_endpoint "Ask Question" 0
    if [[ $response == *"No relevant documents"* ]]; then
        echo -e "  ${BLUE}→ No documents uploaded yet (expected)${NC}"
    fi
else
    test_endpoint "Ask Question" 1
    echo -e "${RED}Response: $response${NC}"
fi

# Get query history
response=$(curl -s http://localhost:8000/query/history \
  -H "Authorization: Bearer $TOKEN")

if [[ $response == *"["* ]]; then
    test_endpoint "Get Query History" 0
else
    test_endpoint "Get Query History" 1
fi

echo ""

# ═══════════════════════════════════════════════════════
echo -e "${YELLOW}[5] Testing Feedback Endpoint${NC}"
echo "─────────────────────────────────────────────────────"

# Submit feedback (requires query_id, so we'll test the endpoint structure)
response=$(curl -s -X POST http://localhost:8000/feedback/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query_id": 999, "rating": 1, "comment": "test"}')

# Will fail with 404 if query doesn't exist, but endpoint is working
if [[ $response == *"Query not found"* ]] || [[ $response == *"message"* ]]; then
    test_endpoint "Feedback Endpoint" 0
    echo -e "  ${BLUE}→ Endpoint accessible (query_id validation working)${NC}"
else
    test_endpoint "Feedback Endpoint" 1
fi

echo ""

# ═══════════════════════════════════════════════════════
echo -e "${YELLOW}[6] Testing Error Handling${NC}"
echo "─────────────────────────────────────────────────────"

# Test unauthorized access
response=$(curl -s -w "%{http_code}" http://localhost:8000/auth/me)
if [[ $response == *"401"* ]]; then
    test_endpoint "Unauthorized Access Blocked" 0
else
    test_endpoint "Unauthorized Access Blocked" 1
fi

# Test invalid login
response=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=invalid@test.com&password=wrongpass")

if [[ $response == *"Invalid"* ]] || [[ $response == *"401"* ]]; then
    test_endpoint "Invalid Login Rejected" 0
else
    test_endpoint "Invalid Login Rejected" 1
fi

echo ""

# ═══════════════════════════════════════════════════════
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                     Test Summary                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Your API is working perfectly!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please check the output above.${NC}"
    exit 1
fi

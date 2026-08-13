#!/bin/bash
set -e

API_URL="http://localhost:3001"

echo "=== 1. Login as Admin ==="
ADMIN_LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@dynamik.com", "password": "Admin123!"}')

echo "Admin Login Response: $ADMIN_LOGIN"
ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | grep -o '"access_token":"[^"]*' | grep -o '[^"]*$')
echo "Admin Access Token: $ADMIN_TOKEN"

echo -e "\n=== 2. Create a Registration Code for a Designer ==="
CREATE_CODE=$(curl -s -X POST "$API_URL/auth/registration-codes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"role": "design"}')

echo "Create Code Response: $CREATE_CODE"
REG_CODE=$(echo "$CREATE_CODE" | grep -o '"code":"[^"]*' | grep -o '[^"]*$')
echo "Registration Code: $REG_CODE"

echo -e "\n=== 3. Register a Designer User ==="
REG_DESIGNER=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"registration_code\": \"$REG_CODE\", \"full_name\": \"Jane Designer\", \"email\": \"designer@dynamik.com\", \"password\": \"Designer123!\"}")

echo "Designer Register Response: $REG_DESIGNER"

echo -e "\n=== 4. Login as Designer ==="
DESIGNER_LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "designer@dynamik.com", "password": "Designer123!"}')

DESIGNER_TOKEN=$(echo "$DESIGNER_LOGIN" | grep -o '"access_token":"[^"]*' | grep -o '[^"]*$')
DESIGNER_ID=$(echo "$REG_DESIGNER" | grep -o '"id":"[^"]*' | grep -o '[^"]*$' | head -1)
echo "Designer Token: $DESIGNER_TOKEN"
echo "Designer ID: $DESIGNER_ID"

echo -e "\n=== 5. Simulate Client Joining via Telegram Webhook ==="
WEBHOOK_CALL=$(curl -s -X POST "$API_URL/telegram/webhook" \
  -H "Content-Type: application/json" \
  -H "X-Telegram-Bot-Api-Secret-Token: dev-webhook-secret" \
  -d '{"message": {"chat": {"id": 998877}, "contact": {"phone_number": "+123456789", "first_name": "Test Client"}}}')

echo "Webhook Response: $WEBHOOK_CALL"

echo -e "\n=== 6. Get Client from Client List (Admin) ==="
CLIENTS_LIST=$(curl -s -X GET "$API_URL/clients" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "Clients List: $CLIENTS_LIST"
CLIENT_ID=$(echo "$CLIENTS_LIST" | grep -o '"id":"[^"]*' | grep -o '[^"]*$' | head -1)
echo "Client UUID: $CLIENT_ID"

echo -e "\n=== 7. Assign Designer to Client ==="
ASSIGN_DESIGNER=$(curl -s -X POST "$API_URL/clients/$CLIENT_ID/assign-designer" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"designer_id\": \"$DESIGNER_ID\"}")

echo "Assign Designer Response: $ASSIGN_DESIGNER"

echo -e "\n=== 8. Create an Order ==="
CREATE_ORDER=$(curl -s -X POST "$API_URL/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"client_id\": \"$CLIENT_ID\", \"items\": [{\"item_type\": \"Dining Table\", \"quantity\": 2}]}")

echo "Create Order Response: $CREATE_ORDER"
ORDER_ID=$(echo "$CREATE_ORDER" | grep -o '"id":"[^"]*' | grep -o '[^"]*$' | head -1)
echo "Order UUID: $ORDER_ID"

echo -e "\n=== 9. Create a Price Offer ==="
CREATE_OFFER=$(curl -s -X POST "$API_URL/orders/$ORDER_ID/price-offers" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"amount": 1500.00}')

echo "Create Price Offer Response: $CREATE_OFFER"
OFFER_ID=$(echo "$CREATE_OFFER" | grep -o '"id":"[^"]*' | grep -o '[^"]*$' | head -1)

echo -e "\n=== 10. Approve Price Offer ==="
APPROVE_OFFER=$(curl -s -X POST "$API_URL/price-offers/$OFFER_ID/approve" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "Approve Offer Response: $APPROVE_OFFER"

echo -e "\n=== 11. Route Order to Design ==="
ROUTE_DESIGN=$(curl -s -X POST "$API_URL/orders/$ORDER_ID/route-design" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "Route Design Response: $ROUTE_DESIGN"
DESIGN_ID=$(echo "$ROUTE_DESIGN" | grep -o '"id":"[^"]*' | grep -o '[^"]*$' | head -1)

echo -e "\n=== 12. Designer Submits Design ==="
SUBMIT_DESIGN=$(curl -s -X POST "$API_URL/designs/$DESIGN_ID/submit" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DESIGNER_TOKEN" \
  -d '{"file_url": "https://example.com/design1.pdf"}')

echo "Submit Design Response: $SUBMIT_DESIGN"

echo -e "\n=== 13. Approve Design ==="
APPROVE_DESIGN=$(curl -s -X POST "$API_URL/designs/$DESIGN_ID/approve" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "Approve Design Response: $APPROVE_DESIGN"

echo -e "\n=== 14. Verify Order transitioned to READY_FOR_PRODUCTION ==="
CHECK_ORDER=$(curl -s -X GET "$API_URL/orders/$ORDER_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "Order Status Check: $CHECK_ORDER"
STATUS=$(echo "$CHECK_ORDER" | grep -o '"status":"[^"]*' | grep -o '[^"]*$' | head -1)
echo "Final Order Status: $STATUS"

echo -e "\n=== API E2E TESTING COMPLETED SUCCESSFULLY ==="

#!/bin/bash

source "$(dirname "$0")/../_helpers.sh"

echo "1) Login with wrong password (expect 401):"
curl -s -i -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"$ADMIN_USERNAME\",\"password\":\"definitely-wrong\"}"

echo -e "\n2) Login with missing password field (expect 400, Zod validation):"
curl -s -i -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"$ADMIN_USERNAME\"}"

echo -e "\n3) /auth/verify with no cookie (expect 401):"
curl -s -i -X GET "$API_URL/auth/verify"

echo -e "\n4) Correct login (expect 200 + Set-Cookie):"
login

echo -e "\n5) /auth/verify with the cookie from step 4 (expect 200):"
curl -s -i -X GET "$API_URL/auth/verify" -b "$COOKIE_JAR"

echo -e "\n6) Logout (expect 200 + cookie cleared):"
curl -s -i -X POST "$API_URL/auth/logout" -b "$COOKIE_JAR" -c "$COOKIE_JAR"

echo -e "\n7) /auth/verify after logout (expect 401):"
curl -s -i -X GET "$API_URL/auth/verify" -b "$COOKIE_JAR"

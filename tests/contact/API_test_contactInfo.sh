#!/bin/bash
source "$(dirname "$0")/../_helpers.sh"

echo "1) Get contact info (public):"
curl -s -i -X GET "$API_URL/contact-info"

echo -e "\n2) Update without auth (expect 401):"
curl -s -i -X PUT "$API_URL/contact-info" -H "Content-Type: application/json" -d '{"email":"nope@example.com"}'

login
echo -e "\n3) Update with an invalid email (expect 400, Zod):"
curl -s -i -X PUT "$API_URL/contact-info" -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d '{"email":"not-an-email"}'

echo -e "\n4) Update with an unrecognized field (expect 400, strict schema):"
curl -s -i -X PUT "$API_URL/contact-info" -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d '{"tagline":"nope"}'

echo -e "\n5) Valid partial update as admin:"
curl -s -i -X PUT "$API_URL/contact-info" -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d '{"email":"club@example.com","phone":"+91 9876543210","github":{"url":"https://github.com/codingclub-sati","showOnFooter":true}}'

echo -e "\n6) Confirm it persisted:"
curl -s -i -X GET "$API_URL/contact-info"

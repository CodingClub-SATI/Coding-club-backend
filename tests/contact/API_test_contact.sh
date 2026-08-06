#!/bin/bash

source "$(dirname "$0")/../_helpers.sh"

echo "1) Public submission (no auth required):"
create_response=$(curl -s -X POST "$API_URL/contacts" -H "Content-Type: application/json" \
    -d '{"name":"Test User","email":"test@example.com","requestType":"General Inquiry","message":"Hello, this is a test."}')
echo "$create_response"
contact_id=$(echo "$create_response" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{process.stdout.write(String(JSON.parse(d).id))}catch{}})")
echo "Using contact id: $contact_id"

echo -e "\n2) Submission with an invalid requestType (expect 400, Zod enum):"
curl -s -i -X POST "$API_URL/contacts" -H "Content-Type: application/json" \
    -d '{"name":"Test User","email":"test@example.com","requestType":"Not A Real Type","message":"Hello"}'

echo -e "\n2b) Submission with the honeypot field filled in, i.e. a bot (expect 400):"
curl -s -i -X POST "$API_URL/contacts" -H "Content-Type: application/json" \
    -d '{"name":"Bot User","email":"bot@example.com","requestType":"General Inquiry","message":"Hello","honeypot":"I am a bot"}'

echo -e "\n3) GET /api/contacts with no auth (expect 401, hard-gated):"
curl -s -i -X GET "$API_URL/contacts"

login
echo -e "\n4) GET /api/contacts as admin:"
curl -s -i -X GET "$API_URL/contacts" -b "$COOKIE_JAR"

echo -e "\n5) Filtered by status=New (our contact defaults to New, should appear):"
curl -s -i -X GET "$API_URL/contacts?status=New" -b "$COOKIE_JAR"

echo -e "\n6) Filtered by requestType=General%20Inquiry (should include our contact):"
curl -s -i -X GET "$API_URL/contacts?requestType=General%20Inquiry" -b "$COOKIE_JAR"

echo -e "\n7) Invalid 'status' value (expect 400):"
curl -s -i -X GET "$API_URL/contacts?status=not-a-real-status" -b "$COOKIE_JAR"

echo -e "\n8) Invalid 'requestType' value (expect 400):"
curl -s -i -X GET "$API_URL/contacts?requestType=not-a-real-type" -b "$COOKIE_JAR"

echo -e "\n9) Archive the contact:"
curl -s -i -X PUT "$API_URL/contacts/$contact_id" -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d '{"archived":true}'

echo -e "\n10) Default GET (archived excluded — our contact should be gone):"
curl -s -i -X GET "$API_URL/contacts?requestType=General%20Inquiry" -b "$COOKIE_JAR"

echo -e "\n11) includeArchived=true (our contact should reappear):"
curl -s -i -X GET "$API_URL/contacts?includeArchived=true&requestType=General%20Inquiry" -b "$COOKIE_JAR"

echo -e "\n12) Filters combined with pagination (expect {data, page, pageSize, total, totalPages} where total reflects the filter, not the whole collection):"
curl -s -i -X GET "$API_URL/contacts?includeArchived=true&page=1&pageSize=5" -b "$COOKIE_JAR"

echo -e "\n13) Update status:"
curl -s -i -X PUT "$API_URL/contacts/$contact_id" -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d '{"status":"Read"}'

echo -e "\n14) Delete:"
curl -s -i -X DELETE "$API_URL/contacts/$contact_id" -b "$COOKIE_JAR"
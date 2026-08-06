#!/bin/bash
source "$(dirname "$0")/../_helpers.sh"

echo "0) Create without auth (expect 401):"
curl -s -i -X POST "$API_URL/updates" -H "Content-Type: application/json" \
    -d '{"message":"Should not be created"}'

login

echo -e "\n0b) Create with missing required field (expect 400, Zod):"
curl -s -i -X POST "$API_URL/updates" -b "$COOKIE_JAR" -H "Content-Type: application/json" -d '{}'

echo -e "\n0c) Create with an unrecognized field (expect 400, strict schema):"
curl -s -i -X POST "$API_URL/updates" -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d '{"message":"x","notAField":true}'

echo -e "\n1) Create:"
create_response=$(curl -s -X POST "$API_URL/updates" -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d '{"message":"Test update message"}')
echo "$create_response"
update_id=$(echo "$create_response" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{process.stdout.write(String(JSON.parse(d).id))}catch{}})")
echo "Using update id: $update_id"

echo -e "\n2) Fetch all (public, newest first, capped at 20):"
curl -s -i -X GET "$API_URL/updates"

echo -e "\n3) Update it:"
curl -s -i -X PUT "$API_URL/updates/$update_id" -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d '{"message":"Edited test update message"}'

echo -e "\n3b) Update a nonexistent id (expect 404):"
curl -s -i -X PUT "$API_URL/updates/999999999999999" -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d '{"message":"nope"}'

echo -e "\n4) Delete it:"
curl -s -i -X DELETE "$API_URL/updates/$update_id" -b "$COOKIE_JAR"

echo -e "\n5) Delete it again (expect 404):"
curl -s -i -X DELETE "$API_URL/updates/$update_id" -b "$COOKIE_JAR"

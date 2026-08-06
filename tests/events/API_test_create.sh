#!/bin/bash

source "$(dirname "$0")/../_helpers.sh"

run_id="$$-$(date +%s%N)"

echo "0) No auth (expect 401):"
curl -s -i -X POST "$API_URL/events" \
    -H "Content-Type: application/json" \
    -d "{\"title\":\"Should not be created $run_id\",\"type\":\"Workshop\",\"status\":\"upcoming\"}"
echo

login

echo -e "\n0b) Missing required field 'status' (expect 400, Zod):"
curl -s -i -X POST "$API_URL/events" \
    -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d "{\"title\":\"Missing status $run_id\",\"type\":\"Workshop\"}"

echo -e "\n0c) Invalid 'type' enum value (expect 400, Zod):"
curl -s -i -X POST "$API_URL/events" \
    -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d "{\"title\":\"Bad type $run_id\",\"type\":\"NotAType\",\"status\":\"upcoming\"}"

echo -e "\n0d) Unrecognized field (expect 400, strict schema):"
curl -s -i -X POST "$API_URL/events" \
    -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d "{\"title\":\"Extra field $run_id\",\"type\":\"Workshop\",\"status\":\"upcoming\",\"notAField\":true}"

echo -e "\n0e) Duplicate title+date (expect 409 the second time):"
curl -s -i -X POST "$API_URL/events" \
    -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d "{\"title\":\"Dup Event $run_id\",\"type\":\"Workshop\",\"status\":\"upcoming\",\"date\":\"2026-09-01\"}"
echo -e "\n   -> repeating the same title+date:"
curl -s -i -X POST "$API_URL/events" \
    -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d "{\"title\":\"Dup Event $run_id\",\"type\":\"Workshop\",\"status\":\"upcoming\",\"date\":\"2026-09-01\"}"

echo -e "\nRunning tests on $API_URL/events"
start_time=$SECONDS
for i in {0..5}; do
	curl -s -i -X POST "$API_URL/events" \
		-b "$COOKIE_JAR" \
		-H "Content-Type: application/json" \
		-d "{
            \"title\":\"Test Event $i-$run_id\",
            \"type\":\"Workshop\",
            \"status\":\"upcoming\",
            \"featured\":true,
            \"archived\":false,
            \"date\":\"2026-08-10\",
            \"time\":\"10:00:00\",
            \"reportingTime\":\"2026-08-10\",
            \"venue\":\"Main Auditorium\",
            \"description\":\"Dummy event for testing\",
            \"logoUrl\":\"https://example.com/logo.png\",
            \"bannerUrl\":\"https://example.com/banner.png\",
            \"tags\":[\"tech\",\"workshop\"],
            \"registrationLink\":\"https://example.com/register\",
            \"viewCount\":0,
            \"registerClickCount\":0
        }"
	echo -e "\nTried creating dummy event: $i"
done

elapsed_time=$(( SECONDS - start_time ))
echo "Elapsed Time: $elapsed_time seconds"

echo -e "\nNote: the 'Dup Event $run_id' and 'Test Event <i>-$run_id' events created"
echo "above are throwaways scoped to this run (unique run_id) but are NOT cleaned"
echo "up automatically. Fetch their ids (GET /events) and pass them to"
echo "events/API_test_remove.sh if you want to remove them."

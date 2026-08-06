#!/bin/bash
source "$(dirname "$0")/../_helpers.sh"
login

echo "Creating a throwaway event..."
event_id=$(create_test_event)
echo "Using event id: $event_id"

echo -e "\n1) Public fetch of a non-archived event (should 200, viewCount should increment):"
curl -s -i -X GET "$API_URL/events/$event_id"
echo

echo -e "\n2) Fetch again to confirm viewCount incremented a second time:"
curl -s -i -X GET "$API_URL/events/$event_id"
echo

echo -e "\n3) Archive it as admin..."
curl -s -o /dev/null -X PUT "$API_URL/events/$event_id" -b "$COOKIE_JAR" \
    -H "Content-Type: application/json" \
    -d '{"archived":true}'

echo -e "\n4) Public fetch of the now-archived event (should 404):"
curl -s -i -X GET "$API_URL/events/$event_id"
echo

echo -e "\n5) Admin fetch of the same archived event (should 200, and viewCount should NOT have moved):"
curl -s -i -X GET "$API_URL/events/$event_id" -b "$COOKIE_JAR"
echo

echo -e "\n6) Fetch of a nonexistent id (should 404):"
curl -s -i -X GET "$API_URL/events/999999999999"
echo

echo -e "\nCleaning up throwaway event $event_id..."
delete_test_event "$event_id"

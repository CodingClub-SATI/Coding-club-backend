#!/bin/bash
source "$(dirname "$0")/../_helpers.sh"
login

echo "Creating a throwaway event..."
event_id=$(create_test_event)
echo "Using event id: $event_id"

echo -e "\n1) No auth required - click on an existing event (should 200, registerClickCount: 1):"
curl -s -i -X POST "$API_URL/events/$event_id/register-click"
echo

echo -e "\n2) Click again (should 200, registerClickCount: 2):"
curl -s -i -X POST "$API_URL/events/$event_id/register-click"
echo

echo -e "\n3) Archive it as admin..."
curl -s -o /dev/null -X PUT "$API_URL/events/$event_id" -b "$COOKIE_JAR" \
    -H "Content-Type: application/json" \
    -d '{"archived":true}'

echo -e "\n4) Click on the now-archived event (should 404, not counted):"
curl -s -i -X POST "$API_URL/events/$event_id/register-click"
echo

echo -e "\n5) Click on a nonexistent event (should 404):"
curl -s -i -X POST "$API_URL/events/999999999999/register-click"
echo

echo -e "\nCleaning up throwaway event $event_id..."
delete_test_event "$event_id"

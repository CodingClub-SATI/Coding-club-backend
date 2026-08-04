#!/bin/bash
source "$(dirname "$0")/../_helpers.sh"
login

echo "Creating a throwaway event with a logo already attached..."
event_id=$(create_test_event)
curl -s -o /dev/null -X POST -b "$COOKIE_JAR" -F "image=@$FIXTURE_IMAGE" "$API_URL/upload/event/$event_id/logoURL"
echo "Using event id: $event_id"

echo "Running tests on $API_URL/upload/event/$event_id/logoURL"
start_time=$SECONDS
curl -s -i -X DELETE -b "$COOKIE_JAR" "$API_URL/upload/event/$event_id/logoURL"
echo -e "\nTried deleting event logo"

echo -e "\nSecond delete on an event with no logo left (should 404):"
curl -s -i -X DELETE -b "$COOKIE_JAR" "$API_URL/upload/event/$event_id/logoURL"
elapsed_time=$(( SECONDS - start_time ))
echo -e "\nElapsed Time: $elapsed_time seconds"

echo "Cleaning up throwaway event $event_id..."
delete_test_event "$event_id"

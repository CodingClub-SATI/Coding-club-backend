#!/bin/bash
source "$(dirname "$0")/../_helpers.sh"
login

echo "Creating a throwaway event to attach uploads to..."
event_id=$(create_test_event)
echo "Using event id: $event_id"

echo "Running tests on $API_URL/upload/event/$event_id/logoURL"
start_time=$SECONDS
for i in {0..3}; do
    curl -s -i -X POST \
        -b "$COOKIE_JAR" \
        -F "image=@$FIXTURE_IMAGE" \
        "$API_URL/upload/event/$event_id/logoURL"
    echo -e "\nTried uploading event logo (attempt $i)"
done
elapsed_time=$(( SECONDS - start_time ))
echo "Elapsed Time: $elapsed_time seconds"

echo "Cleaning up throwaway event $event_id..."
delete_test_event "$event_id"

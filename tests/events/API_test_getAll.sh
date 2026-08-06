#!/bin/bash

source "$(dirname "$0")/../_helpers.sh"

echo "Running tests on $API_URL/events"
start_time=$SECONDS
curl -s -i -X GET "$API_URL/events"
elapsed_time=$(( SECONDS - start_time ))
echo "Elapsed Time: $elapsed_time seconds"

echo -e "\n2) Filtered by a valid status:"
curl -s -i -X GET "$API_URL/events?status=upcoming"

echo -e "\n3) Filtered by a valid type:"
curl -s -i -X GET "$API_URL/events?type=Workshop"

echo -e "\n4) Filtered by featured=true:"
curl -s -i -X GET "$API_URL/events?featured=true"

echo -e "\n5) Invalid 'status' value (expect 400):"
curl -s -i -X GET "$API_URL/events?status=not-a-real-status"

echo -e "\n6) Invalid 'type' value (expect 400):"
curl -s -i -X GET "$API_URL/events?type=not-a-real-type"

echo -e "\n7) Page-based pagination (expect {data, page, pageSize, total, totalPages}):"
curl -s -i -X GET "$API_URL/events?page=1&pageSize=2"

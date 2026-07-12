#!/bin/bash
# Use this script to benchmark "/api/events" creation handling.
API_URL="http://localhost:3000/api/events"
echo "Running tests on $API_URL"
start_time=$SECONDS
for i in {0..5}; do
	curl -s -i -X POST $API_URL \
		-H "Content-Type: application/json" \
		-d "{
            \"id\":$i,
            \"name\":\"Test Event $i\",
            \"type\":\"Workshop\",
            \"status\":\"Upcoming\",
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
            \"registrationUrl\":\"https://example.com/register\",
            \"viewCount\":0,
            \"registerClickCount\":0
        }"
	echo -e "\nTried creating dummy event: $i"
	sleep 0
done

elapsed_time=$(( SECONDS - start_time ))
echo "Elapsed Time: $elapsed_time seconds"
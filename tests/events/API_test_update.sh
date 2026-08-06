#!/bin/bash

source "$(dirname "$0")/../_helpers.sh"
login

if [ "$#" -eq 0 ]; then
    echo "Usage: $0 <eventId> [eventId ...]" >&2
    exit 1
fi

echo "Running tests on $API_URL/events/:id"
start_time=$SECONDS
for id in "$@"; do
	curl -s -i -X PUT "$API_URL/events/$id" \
		-b "$COOKIE_JAR" \
		-H "Content-Type: application/json" \
		-d "{
            \"title\":\"Updated Event $id\",
            \"type\":\"Hackathon\",
            \"status\":\"completed\",
            \"featured\":false,
            \"archived\":false,
            \"venue\":\"Updated Auditorium\",
            \"description\":\"Updated dummy event\",
            \"tags\":[\"coding\",\"competition\"],
            \"viewCount\":10,
            \"registerClickCount\":5
        }"
	echo -e "\nTried updating event: $id"
done
elapsed_time=$(( SECONDS - start_time ))
echo "Elapsed Time: $elapsed_time seconds"

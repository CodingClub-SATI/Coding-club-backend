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
	curl -s -i -X DELETE "$API_URL/events/$id" \
		-b "$COOKIE_JAR" \
		-H "Content-Type: application/json"
	echo -e "\nTried removing event: $id"
done
elapsed_time=$(( SECONDS - start_time ))
echo "Elapsed Time: $elapsed_time seconds"

#!/bin/bash
# Use this script to benchmark "/api/events/:id" deletion handling.
API_URL="http://localhost:3000/api/events/"
echo "Running tests on $API_URL"
start_time=$SECONDS
for i in {0..5}; do
	curl -s -i -X DELETE ${API_URL}${i} \
		-H "Content-Type: application/json" \
		-d '{}'

	echo -e "\nTried removing dummy event: $i"
	sleep 0
done
elapsed_time=$(( SECONDS - start_time ))
echo "Elapsed Time: $elapsed_time seconds"
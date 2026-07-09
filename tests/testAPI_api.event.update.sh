#!/bin/bash
# Use this script to benchmark "/api/events/:id" update handling.
API_URL="http://localhost:3000/api/events/"
echo "Running tests on $API_URL"
start_time=$SECONDS
for i in {0..5}; do
	curl -s -i -X PUT ${API_URL}${i} \
		-H "Content-Type: application/json" \
		-d "{
            \"name\":\"Updated Event $i\",
            \"type\":\"Hackathon\",
            \"status\":\"Live\",
            \"featured\":false,
            \"archived\":false,
            \"venue\":\"Updated Auditorium\",
            \"description\":\"Updated dummy event\",
            \"tags\":[\"coding\",\"competition\"],
            \"viewCount\":10,
            \"registerClickCount\":5
        }"

	echo -e "\nTried updating dummy event: $i"
	sleep 0
done
elapsed_time=$(( SECONDS - start_time ))
echo "Elapsed Time: $elapsed_time seconds"
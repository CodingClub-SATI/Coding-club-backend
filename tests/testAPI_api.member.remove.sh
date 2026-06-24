#!/bin/bash
# Use this script to benchmark "/api/member/create" creation handling.
API_URL="http://localhost:8000/api/member/remove"
echo "Running tests on $API_URL"
start_time=$SECONDS
for i in {0..5}; do
	curl -s -i -X DELETE $API_URL \
		-H "Content-Type: application/json" \
		-d "{
            \"socials\":{
                \"email\":\"test${i}_$(date +%s%N)@example.com\",
            } \
        }"
		echo -e "\n Tried registering dummy member: $i"
	sleep 0
done
elapsed_time=$(( SECONDS - start_time ))
echo "Elapsed Time: $elapsed_time seconds"
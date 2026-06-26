#!/bin/bash
# Use this script to benchmark "/api/member/fetchall".
API_URL="http://localhost:3000/api/members"
echo "Running tests on $API_URL"
start_time=$SECONDS
for i in {0..0}; do
	curl -s -i -X GET $API_URL
		#echo "Tried registering dummy member: $i"
	sleep 0
done
elapsed_time=$(( SECONDS - start_time ))
echo "Elapsed Time: $elapsed_time seconds"
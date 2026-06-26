#!/bin/bash
# Use this script to benchmark "/api/member/create" creation handling.
API_URL="http://localhost:3000/api/members/"
echo "Running tests on $API_URL"
start_time=$SECONDS
for i in {0..9}; do
	email="testmember${i}@example.com"
	curl -s -i -X DELETE ${API_URL}${email} \
		-H "Content-Type: application/json" \
		-d '{
        }'
		echo -e "\n Tried removing dummy member: $i"
	sleep 0
done
elapsed_time=$(( SECONDS - start_time ))
echo "Elapsed Time: $elapsed_time seconds"

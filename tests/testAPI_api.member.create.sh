#!/bin/bash
# Use this script to benchmark "/api/member/create" creation handling.
API_URL="http://localhost:3000/api/members/"
echo "Running tests on $API_URL"
start_time=$SECONDS
for i in {0..5}; do
    email="testmember${i}@example.com"
	curl -s -i -X POST $API_URL \
		-H "Content-Type: application/json" \
		-d "{
            \"name\":\"testuser\",
            \"email\":\"$email\",
            \"branch\":\"CSE\",
            \"year\":2029,
            \"clubPost\":\"tech team member\",
            \"socials\":{
                \"github\":\"sdadS\",
                \"linkedin\":\"asdasd\"
            },
            \"tags\":[\"ui\",\"ux\"]
        }"
		echo -e "\nTried registering dummy member: $i"
	sleep 0
done
elapsed_time=$(( SECONDS - start_time ))
echo "Elapsed Time: $elapsed_time seconds"
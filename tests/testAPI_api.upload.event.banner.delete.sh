#!/bin/bash
# Use this script to benchmark "/api/upload/event/:id/bannerURL" deletion handling.
API_URL="http://localhost:3000/api/upload/event/"
echo "Running tests on $API_URL"
start_time=$SECONDS
for i in {0..8}; do
    id=$i
    curl -s -i -X DELETE \
        "${API_URL}${id}/bannerURL"
    echo -e "\nTried deleting dummy event banner: $i"
    sleep 0
done
elapsed_time=$((SECONDS - start_time))
echo "Elapsed Time: $elapsed_time seconds"
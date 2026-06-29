#!/bin/bash
# Use this script to benchmark "/api/upload" creation handling.
API_URL="http://localhost:3000/api/upload/"
echo "Running tests on $API_URL"
start_time=$SECONDS
for i in {0..5}; do
    email="testmember${i}@example.com"
	curl -s -i -X POST -F "image=@./kot.jpeg" ${API_URL}${email} \
		-H "Content-Type: application/json" \
		-d "{}"
		echo -e "\nTried uploading dummy user image: $i"
	sleep 0
done
elapsed_time=$(( SECONDS - start_time ))
echo "Elapsed Time: $elapsed_time seconds"
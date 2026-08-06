#!/bin/bash
source "$(dirname "$0")/../_helpers.sh"
login

echo "1) Upload a valid JPEG:"
response=$(curl -s -i -X POST -b "$COOKIE_JAR" -F "image=@$FIXTURE_IMAGE" "$API_URL/upload")
echo "$response"
url=$(echo "$response" | tail -1 | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{process.stdout.write(JSON.parse(d).url||'')}catch{}})")

echo -e "\n2) Reject a disguised non-image (magic-byte check):"
echo "this is not actually an image" > /tmp/fake.jpg
curl -s -i -X POST -b "$COOKIE_JAR" -F "image=@/tmp/fake.jpg;type=image/jpeg" "$API_URL/upload"
rm -f /tmp/fake.jpg

echo -e "\n3) Reject a file over the 2MB limit:"
head -c 3000000 /dev/urandom > /tmp/big.jpg
curl -s -i -X POST -b "$COOKIE_JAR" -F "image=@/tmp/big.jpg;type=image/jpeg" "$API_URL/upload"
rm -f /tmp/big.jpg

echo -e "\n4) Reject when unauthenticated:"
curl -s -i -X POST -F "image=@$FIXTURE_IMAGE" "$API_URL/upload"

if [ -n "$url" ]; then
    echo -e "\n5) Delete the image uploaded in step 1: $url"
    curl -s -i -X DELETE -b "$COOKIE_JAR" -H "Content-Type: application/json" -d "{\"url\":\"$url\"}" "$API_URL/upload"
fi

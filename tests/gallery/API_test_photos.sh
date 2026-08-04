#!/bin/bash
source "$(dirname "$0")/../_helpers.sh"
login

echo "Creating a throwaway album..."
album_id=$(curl -s -X POST "$API_URL/gallery" -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d '{"title":"Photo test album"}' \
    | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>process.stdout.write(String(JSON.parse(d).id)))")
echo "Using album id: $album_id"

echo -e "\n1) Bulk add photos:"
add_response=$(curl -s -X POST "$API_URL/gallery/$album_id/photos" \
    -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d '{"photos":[{"src":"https://example.com/1.jpg","caption":"One","featured":true},{"src":"https://example.com/2.jpg","caption":"Two"}]}')
echo "$add_response"
photo_id=$(echo "$add_response" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{process.stdout.write(String(JSON.parse(d).images[0].id))}catch{}})")
echo "Using photo id: $photo_id"

echo -e "\n2) Update a photo:"
curl -s -i -X PUT "$API_URL/gallery/$album_id/photos/$photo_id" \
    -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d '{"caption":"Updated caption"}'

echo -e "\n2b) Fetch the single album (expect the 2 photos above):"
curl -s -i -X GET "$API_URL/gallery/$album_id"

echo -e "\n2c) Fetch a non-existent album (expect 404):"
curl -s -i -X GET "$API_URL/gallery/999999999999999"

echo -e "\n3) Bulk-add 9 more featured photos (total 10 featured, right at the cap):"
curl -s -o /dev/null -X POST "$API_URL/gallery/$album_id/photos" \
    -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d '{"photos":[{"src":"https://example.com/extra1.jpg","featured":true},{"src":"https://example.com/extra2.jpg","featured":true},{"src":"https://example.com/extra3.jpg","featured":true},{"src":"https://example.com/extra4.jpg","featured":true},{"src":"https://example.com/extra5.jpg","featured":true},{"src":"https://example.com/extra6.jpg","featured":true},{"src":"https://example.com/extra7.jpg","featured":true},{"src":"https://example.com/extra8.jpg","featured":true},{"src":"https://example.com/extra9.jpg","featured":true}]}'

echo -e "\n3b) One more featured photo via bulk add (expect 409 — cap of 10 already reached):"
curl -s -i -X POST "$API_URL/gallery/$album_id/photos" \
    -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d '{"photos":[{"src":"https://example.com/extra10.jpg","featured":true}]}'

echo -e "\n3c) Add one more, unfeatured photo, then try to feature it via single update (expect 409 — cap still at 10):"
extra_response=$(curl -s -X POST "$API_URL/gallery/$album_id/photos" -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d '{"photos":[{"src":"https://example.com/extra11.jpg"}]}')
extra_photo_id=$(echo "$extra_response" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{process.stdout.write(String(JSON.parse(d).images.at(-1).id))}catch{}})")
curl -s -i -X PUT "$API_URL/gallery/$album_id/photos/$extra_photo_id" \
    -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d '{"featured":true}'

echo -e "\n4) Remove a photo:"
curl -s -i -X DELETE "$API_URL/gallery/$album_id/photos/$photo_id" -b "$COOKIE_JAR"

echo -e "\n5) Remove the same photo again (expect 404):"
curl -s -i -X DELETE "$API_URL/gallery/$album_id/photos/$photo_id" -b "$COOKIE_JAR"

echo -e "\nCleaning up throwaway album $album_id..."
curl -s -o /dev/null -X DELETE "$API_URL/gallery/$album_id" -b "$COOKIE_JAR"

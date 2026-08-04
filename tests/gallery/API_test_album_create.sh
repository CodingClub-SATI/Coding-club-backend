#!/bin/bash

source "$(dirname "$0")/../_helpers.sh"

run_id="$$-$(date +%s%N)"

echo "0) No auth (expect 401):"
curl -s -i -X POST "$API_URL/gallery" \
    -H "Content-Type: application/json" \
    -d "{\"title\":\"Should not be created $run_id\"}"
echo

login

echo -e "\n0b) Missing required field 'title' (expect 400, Zod):"
curl -s -i -X POST "$API_URL/gallery" -b "$COOKIE_JAR" -H "Content-Type: application/json" -d '{}'

echo -e "\n0c) Unrecognized field (expect 400, strict schema):"
curl -s -i -X POST "$API_URL/gallery" -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d "{\"title\":\"Extra field $run_id\",\"notAField\":true}"

echo -e "\n0d) A cover on creation (expect 400 — cover must reference a photo"
echo "   already in the album, and a brand-new album has none yet):"
curl -s -i -X POST "$API_URL/gallery" -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d "{\"title\":\"Album with cover $run_id\",\"cover\":\"https://example.com/cover.jpg\"}"

echo -e "\n0e) Duplicate title+date (expect 409 the second time):"
curl -s -i -X POST "$API_URL/gallery" -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d "{\"title\":\"Dup Album $run_id\",\"date\":\"2026-09-01\"}"
echo -e "\n   -> repeating the same title+date:"
curl -s -i -X POST "$API_URL/gallery" -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d "{\"title\":\"Dup Album $run_id\",\"date\":\"2026-09-01\"}"

echo -e "\nRunning create tests on $API_URL/gallery"
for i in {0..3}; do
    curl -s -i -X POST "$API_URL/gallery" \
        -b "$COOKIE_JAR" \
        -H "Content-Type: application/json" \
        -d "{\"title\":\"Test Album $i-$run_id\",\"date\":\"2026-08-10\"}"
    echo -e "\nTried creating dummy album: $i"
done

echo -e "\nNote: 'cover' is deliberately omitted from the valid creates above —"
echo "createAlbum rejects any cover on creation (see step 0d above for proof)."
echo "Set it afterwards via album.update once photos exist."

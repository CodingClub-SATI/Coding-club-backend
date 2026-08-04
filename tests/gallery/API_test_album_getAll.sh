#!/bin/bash
source "$(dirname "$0")/../_helpers.sh"

echo "1) All albums:"
curl -s -i -X GET "$API_URL/gallery"

echo -e "\n2) Highlights (up to 12 featured photos across all albums):"
curl -s -i -X GET "$API_URL/gallery/highlights"

echo -e "\n3) Search by title:"
curl -s -i -X GET "$API_URL/gallery?search=Test"

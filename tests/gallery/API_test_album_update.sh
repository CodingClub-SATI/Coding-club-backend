#!/bin/bash
source "$(dirname "$0")/../_helpers.sh"
login

if [ "$#" -eq 0 ]; then
    echo "Usage: $0 <albumId> [albumId ...]" >&2
    exit 1
fi

for id in "$@"; do
    curl -s -i -X PUT "$API_URL/gallery/$id" \
        -b "$COOKIE_JAR" \
        -H "Content-Type: application/json" \
        -d "{\"title\":\"Updated Album $id\"}"
    echo -e "\nTried updating album: $id"
done

echo -e "\nUpdating a non-existent album (expect 404):"
curl -s -i -X PUT "$API_URL/gallery/999999999999999" -b "$COOKIE_JAR" -H "Content-Type: application/json" -d "{\"title\":\"nope\"}"

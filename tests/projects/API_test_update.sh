#!/bin/bash
source "$(dirname "$0")/../_helpers.sh"
login

if [ "$#" -eq 0 ]; then
    echo "Usage: $0 <projectId> [projectId ...]" >&2
    exit 1
fi

for id in "$@"; do
	curl -s -i -X PUT "$API_URL/projects/$id" \
		-b "$COOKIE_JAR" \
		-H "Content-Type: application/json" \
		-d "{\"description\":\"Updated dummy project $id\",\"demo\":\"https://example.com/updated-demo\"}"
	echo -e "\nTried updating project: $id"
done

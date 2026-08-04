#!/bin/bash
source "$(dirname "$0")/../_helpers.sh"
login

if [ "$#" -eq 0 ]; then
    echo "Usage: $0 <projectId> [projectId ...]" >&2
    exit 1
fi

for id in "$@"; do
	curl -s -i -X DELETE "$API_URL/projects/$id" -b "$COOKIE_JAR"
	echo -e "\nTried removing project: $id"
done

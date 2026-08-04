#!/bin/bash
source "$(dirname "$0")/../_helpers.sh"

echo "1) All projects:"
curl -s -i -X GET "$API_URL/projects"

echo -e "\n2) Filtered by category:"
curl -s -i -X GET "$API_URL/projects?category=Web"

echo -e "\n3) Sorted by stars:"
curl -s -i -X GET "$API_URL/projects?sort=stars"

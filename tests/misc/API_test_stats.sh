#!/bin/bash
source "$(dirname "$0")/../_helpers.sh"

echo "1) Public stats:"
curl -s -i -X GET "$API_URL/stats"

echo -e "\n2) Admin stats without auth (expect 401):"
curl -s -i -X GET "$API_URL/admin/stats"

login
echo -e "\n3) Admin stats:"
curl -s -i -X GET "$API_URL/admin/stats" -b "$COOKIE_JAR"

#!/bin/bash

set -uo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
API_URL="$BASE_URL/api"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COOKIE_JAR="$SCRIPT_DIR/cookies.txt"
# shellcheck disable=SC2034  # used by scripts that source this file (uploads/*)
FIXTURE_IMAGE="$SCRIPT_DIR/kot.jpeg"

: "${ADMIN_USERNAME:=admin}"
: "${ADMIN_PASSWORD:=password123}"

login() {
    local status
    status=$(curl -s -o /dev/null -w "%{http_code}" -c "$COOKIE_JAR" -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$ADMIN_USERNAME\",\"password\":\"$ADMIN_PASSWORD\"}")
    echo "Login status: $status"
    if [ "$status" != "200" ]; then
        echo "Login failed — aborting. Check ADMIN_USERNAME/ADMIN_PASSWORD and that the server is running at $BASE_URL." >&2
        exit 1
    fi
}

create_test_event() {
    curl -s -X POST "$API_URL/events" \
        -b "$COOKIE_JAR" \
        -H "Content-Type: application/json" \
        -d "{\"title\":\"Upload test fixture event $$-$(date +%s%N)\",\"type\":\"Workshop\",\"status\":\"upcoming\"}" \
    | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>process.stdout.write(String(JSON.parse(d).id)))"
}

delete_test_event() {
    curl -s -o /dev/null -X DELETE "$API_URL/events/$1" -b "$COOKIE_JAR"
}
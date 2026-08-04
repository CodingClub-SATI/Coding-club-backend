#!/bin/bash

source "$(dirname "$0")/../_helpers.sh"

echo "1) No auth, default (should exclude archived events):"
curl -s -i -X GET "$API_URL/events"
echo

echo "2) No auth, includeArchived=true (param must be IGNORED, still no archived events):"
curl -s -i -X GET "$API_URL/events?includeArchived=true"
echo

echo "3) Invalid/expired cookie, includeArchived=true (must be IGNORED, still no archived events):"
curl -s -i -X GET "$API_URL/events?includeArchived=true" -H "Cookie: admin_token=not-a-real-token"
echo

login
echo "4) Valid admin session, includeArchived=true (should include archived events):"
curl -s -i -X GET "$API_URL/events?includeArchived=true" -b "$COOKIE_JAR"
echo

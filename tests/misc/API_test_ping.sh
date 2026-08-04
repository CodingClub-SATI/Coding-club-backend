#!/bin/bash
source "$(dirname "$0")/../_helpers.sh"
curl -s -i "$BASE_URL/ping"

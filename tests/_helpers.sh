#!/bin/bash

set -uo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
API_URL="$BASE_URL/api"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
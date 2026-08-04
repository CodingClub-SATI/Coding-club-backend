#!/bin/bash
# Runs every self-contained API_test_*.sh script and prints a summary.
#
# Note: every script here just prints raw HTTP responses for you to read

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "======================================================================"
echo "Running tests/unit/utils_and_schemas.test.mjs (no server required)"
echo "======================================================================"
unit_failed=0
if ! (cd "$SCRIPT_DIR/.." && node tests/unit/utils_and_schemas.test.mjs); then
    unit_failed=1
fi

echo
echo "Checking server at $BASE_URL..."
if ! curl -s -o /dev/null -w "" --fail "$BASE_URL/ping"; then
    echo "Server is not reachable at $BASE_URL/ping — start it first." >&2
    exit 1
fi

NEEDS_ARGS=(
    "events/API_test_update.sh"
    "events/API_test_remove.sh"
    "gallery/API_test_album_update.sh"
    "gallery/API_test_album_remove.sh"
    "projects/API_test_update.sh"
    "projects/API_test_remove.sh"
)

is_skipped() {
    local candidate="$1"
    for skip in "${NEEDS_ARGS[@]}"; do
        [[ "$candidate" == "$skip" ]] && return 0
    done
    return 1
}

declare -a passed=()
declare -a failed=()

cd "$SCRIPT_DIR" || exit 1
for script in */API_test_*.sh; do
    if is_skipped "$script"; then
        continue
    fi
    echo
    echo "======================================================================"
    echo "Running $script"
    echo "======================================================================"
    if bash "$script"; then
        passed+=("$script")
    else
        failed+=("$script")
    fi
done

echo
echo "======================================================================"
echo "Summary"
echo "======================================================================"
echo "Unit tests (tests/unit/): $([ "$unit_failed" -eq 0 ] && echo OK || echo FAILED)"
echo "API scripts: ${#passed[@]} ok, ${#failed[@]} failed"
if [ "${#failed[@]}" -gt 0 ]; then
    printf 'FAILED: %s\n' "${failed[@]}"
fi

echo
echo "Not run automatically (need ids from their paired create.sh — run e.g.:"
echo "  events/API_test_create.sh, note the ids, then"
echo "  events/API_test_update.sh <id...> and events/API_test_remove.sh <id...>):"
printf '  %s\n' "${NEEDS_ARGS[@]}"

[ "${#failed[@]}" -eq 0 ] && [ "$unit_failed" -eq 0 ]
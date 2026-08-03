#!/bin/bash
# Runs every self-contained *.sh script and prints a summary.
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

[ "${#failed[@]}" -eq 0 ] && [ "$unit_failed" -eq 0 ]
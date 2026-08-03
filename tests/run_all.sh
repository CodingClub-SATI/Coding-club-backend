#!/bin/bash
# Runs every self-contained API_test_*.sh script and prints a summary.
#
# Note: every script here just prints raw HTTP responses for you to read

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_URL="${BASE_URL:-http://localhost:3000}"
shopt -s nullglob

echo "======================================================================"
echo "Running tests/unit/utils_and_schemas.test.mjs (no server required)"
echo "======================================================================"
declare -a unit_passed=()
declare -a unit_failed=()
for unit_test in "$SCRIPT_DIR"/unit/*.test.mjs; do
    name="$(basename "$unit_test")"
    if (cd "$SCRIPT_DIR/.." && node "$unit_test"); then
        unit_passed+=("$name")
    else
        unit_failed+=("$name")
    fi
done

echo
echo "Checking server at $BASE_URL..."
if ! curl -s -o /dev/null -w "" --fail "$BASE_URL/ping"; then
    echo "Server is not reachable at $BASE_URL/ping — start it first." >&2
    exit 1
fi

# Scripts that need ids passed as arguments (from their paired create.sh) — skipped below.
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
echo "Unit tests (tests/unit/): ${#unit_passed[@]} ok, ${#unit_failed[@]} failed"
if [ "${#unit_failed[@]}" -gt 0 ]; then
    printf 'FAILED (unit): %s\n' "${unit_failed[@]}"
fi

echo "API scripts: ${#passed[@]} ok, ${#failed[@]} failed"
if [ "${#failed[@]}" -gt 0 ]; then
     printf 'FAILED: %s\n' "${failed[@]}"
fi

[ "${#failed[@]}" -eq 0 ] && [ "${#unit_failed[@]}" -eq 0 ]
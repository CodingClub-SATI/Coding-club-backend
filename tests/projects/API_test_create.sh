#!/bin/bash
source "$(dirname "$0")/../_helpers.sh"

run_id="$$-$(date +%s%N)"

echo "0) No auth (expect 401):"
curl -s -i -X POST "$API_URL/projects" \
    -H "Content-Type: application/json" \
    -d "{\"title\":\"Should not be created $run_id\",\"team\":\"Team X\",\"members\":2,\"description\":\"x\",\"github\":\"https://github.com/octocat/Hello-World\",\"category\":\"Web\"}"
echo

login

echo -e "\n0b) Missing required field 'github' (expect 400, Zod):"
curl -s -i -X POST "$API_URL/projects" \
    -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d "{\"title\":\"Missing github $run_id\",\"team\":\"Team X\",\"members\":2,\"description\":\"x\",\"category\":\"Web\"}"

echo -e "\n0c) Invalid 'members' (must be a positive integer, expect 400, Zod):"
curl -s -i -X POST "$API_URL/projects" \
    -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d "{\"title\":\"Bad members $run_id\",\"team\":\"Team X\",\"members\":0,\"description\":\"x\",\"github\":\"https://github.com/octocat/Hello-World\",\"category\":\"Web\"}"

echo -e "\n0d) Non-URL 'github' value (expect 400, Zod):"
curl -s -i -X POST "$API_URL/projects" \
    -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d "{\"title\":\"Bad github $run_id\",\"team\":\"Team X\",\"members\":2,\"description\":\"x\",\"github\":\"not-a-url\",\"category\":\"Web\"}"

echo -e "\n0e) Unrecognized field (expect 400, strict schema):"
curl -s -i -X POST "$API_URL/projects" \
    -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d "{\"title\":\"Extra field $run_id\",\"team\":\"Team X\",\"members\":2,\"description\":\"x\",\"github\":\"https://github.com/octocat/Hello-World\",\"category\":\"Web\",\"notAField\":true}"

echo -e "\n0f) Duplicate title+team (expect 409 the second time):"
curl -s -i -X POST "$API_URL/projects" \
    -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d "{\"title\":\"Dup Project $run_id\",\"team\":\"Team Dup\",\"members\":2,\"description\":\"x\",\"github\":\"https://github.com/octocat/Hello-World\",\"category\":\"Web\"}"
echo -e "\n   -> repeating the same title+team:"
curl -s -i -X POST "$API_URL/projects" \
    -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d "{\"title\":\"Dup Project $run_id\",\"team\":\"Team Dup\",\"members\":2,\"description\":\"x\",\"github\":\"https://github.com/octocat/Hello-World\",\"category\":\"Web\"}"

echo -e "\nRunning tests on $API_URL/projects"
start_time=$SECONDS
for i in {0..5}; do
	curl -s -i -X POST "$API_URL/projects" \
		-b "$COOKIE_JAR" \
		-H "Content-Type: application/json" \
		-d "{
            \"title\":\"Test Project $i-$run_id\",
            \"team\":\"Team $i\",
            \"members\":4,
            \"description\":\"Dummy project for testing\",
            \"github\":\"https://github.com/octocat/Hello-World\",
            \"category\":\"Web\",
            \"tech\":[\"React\",\"Node.js\"],
            \"demo\":\"https://example.com/demo\"
        }"
	echo -e "\nTried creating dummy project: $i"
done
elapsed_time=$(( SECONDS - start_time ))
echo "Elapsed Time: $elapsed_time seconds"

echo -e "\nNote: 'github' points at a real public repo (octocat/Hello-World) so"
echo "syncProjectGithubStats has something to fetch (stars/forks get populated"
echo "from the live GitHub API, best-effort, non-fatal if it fails/rate-limits)."

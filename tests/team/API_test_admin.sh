#!/bin/bash
source "$(dirname "$0")/../_helpers.sh"

batch_name="Test-Batch-$$"
enrollment_number="TEST-ENR-$$"

echo "0) Create a batch without auth (expect 401):"
curl -s -i -X POST "$API_URL/team/admin/batches" -H "Content-Type: application/json" \
    -d "{\"batch\":\"$batch_name\"}"

login

echo -e "\n1) Create a batch:"
curl -s -i -X POST "$API_URL/team/admin/batches" -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d "{\"batch\":\"$batch_name\"}"

echo -e "\n2) Create the same batch again (expect 409, duplicate):"
curl -s -i -X POST "$API_URL/team/admin/batches" -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d "{\"batch\":\"$batch_name\"}"

echo -e "\n2b) Add a member to a batch that does not exist (expect 400):"
curl -s -i -X POST "$API_URL/team/admin/members" -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d "{\"fullName\":\"Ghost Member\",\"enrollmentNumber\":\"GHOST-$$\",\"batch\":\"No-Such-Batch-$$\"}"

echo -e "\n3) Add a member to that batch:"
add_response=$(curl -s -X POST "$API_URL/team/admin/members" -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d "{\"fullName\":\"Test Member\",\"enrollmentNumber\":\"$enrollment_number\",\"batch\":\"$batch_name\",\"specialization\":\"Backend\",\"skills\":[\"Node.js\"]}")
echo "$add_response"
member_id=$(echo "$add_response" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{process.stdout.write(String(JSON.parse(d).id))}catch{}})")
echo "Using member id: $member_id"

echo -e "\n3b) Add another member with the same enrollment number (expect 409, duplicate):"
curl -s -i -X POST "$API_URL/team/admin/members" -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d "{\"fullName\":\"Other Member\",\"enrollmentNumber\":\"$enrollment_number\",\"batch\":\"$batch_name\"}"

echo -e "\n4) Update that member:"
curl -s -i -X PATCH "$API_URL/team/admin/members/$member_id" -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d '{"specialization":"Full Stack"}'

echo -e "\n4b) Update that member onto a batch that does not exist (expect 400):"
curl -s -i -X PATCH "$API_URL/team/admin/members/$member_id" -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d "{\"batch\":\"No-Such-Batch-$$\"}"

echo -e "\n5) List admin batches (should include the new batch + member):"
curl -s -i -X GET "$API_URL/team/admin/batches" -b "$COOKIE_JAR"

echo -e "\n6) Set the batch's leadership (convenor = our test member):"
curl -s -i -X PUT "$API_URL/team/admin/leadership" -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d "{\"convenors\":[$member_id],\"coConvenors\":[],\"departmentHeads\":{}}"

echo -e "\n6b) Set leadership referencing a member id that does not exist (expect 400):"
curl -s -i -X PUT "$API_URL/team/admin/leadership" -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d '{"convenors":[999999999999999],"coConvenors":[],"departmentHeads":{}}'

echo -e "\n7) Get leadership (should still show step 6's convenor, unaffected by the rejected 6b):"
curl -s -i -X GET "$API_URL/team/admin/leadership" -b "$COOKIE_JAR"

echo -e "\n8) Archive the batch:"
curl -s -i -X PATCH "$API_URL/team/admin/batches/$batch_name" -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d '{"archived":true}'

echo -e "\n9) Try to delete the batch while it still has a member (expect 400):"
curl -s -i -X DELETE "$API_URL/team/admin/batches/$batch_name" -b "$COOKIE_JAR"

echo -e "\n10) Remove the member:"
curl -s -i -X DELETE "$API_URL/team/admin/members/$member_id" -b "$COOKIE_JAR"

echo -e "\n11) Verdict — removing a member should auto-clean them out of leadership"
echo "    (cleanupLeadershipReferences), with NO manual leadership reset in between:"
leadership_after_removal=$(curl -s -X GET "$API_URL/team/admin/leadership" -b "$COOKIE_JAR")
echo "$leadership_after_removal"
verdict=$(node -e "
let body;
try { body = JSON.parse(process.argv[2]); } catch { console.log('FAIL: leadership response was not valid JSON'); process.exit(0); }
const memberId = Number(process.argv[1]);
const stillThere = (body.convenors || []).includes(memberId)
    || (body.coConvenors || []).includes(memberId)
    || Object.values(body.departmentHeads || {}).includes(memberId);
console.log(stillThere
    ? 'FAIL: removed member id is still referenced in leadership'
    : 'PASS: removed member was auto-cleaned from leadership');
" "$member_id" "$leadership_after_removal")
echo "$verdict"

echo -e "\n12) Clean up — remove the batch, then reset leadership to a known-empty state:"
curl -s -i -X DELETE "$API_URL/team/admin/batches/$batch_name" -b "$COOKIE_JAR"
curl -s -o /dev/null -X PUT "$API_URL/team/admin/leadership" -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d '{"convenors":[],"coConvenors":[],"departmentHeads":{}}'

[[ "$verdict" == FAIL* ]] && exit 1
exit 0

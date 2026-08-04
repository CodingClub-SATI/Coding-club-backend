#!/bin/bash
source "$(dirname "$0")/../_helpers.sh"
login

batch_name="Test-Batch-Public-$$"
enrollment_number="TEST-ENR-PUB-$$"

echo "Creating a throwaway batch + member (with an enrollmentNumber) as admin..."
curl -s -o /dev/null -X POST "$API_URL/team/admin/batches" -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d "{\"batch\":\"$batch_name\"}"

add_response=$(curl -s -X POST "$API_URL/team/admin/members" -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d "{\"fullName\":\"Public Test Member\",\"enrollmentNumber\":\"$enrollment_number\",\"batch\":\"$batch_name\"}")
member_id=$(echo "$add_response" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{process.stdout.write(String(JSON.parse(d).id))}catch{}})")
echo "Using member id: $member_id"

echo -e "\n1) GET /team/public (full response, for review):"
public_response=$(curl -s -X GET "$API_URL/team/public")
echo "$public_response"

echo -e "\n2) Confirm enrollmentNumber is never present anywhere in that response:"
leak_check=$(node -e "
let d = '';
process.stdin.on('data', c => d += c);
process.stdin.on('end', () => {
    let body;
    try { body = JSON.parse(d); } catch { console.log('FAIL: response was not valid JSON'); return; }
    const hasLeak = (value) => Array.isArray(value)
        ? value.some(hasLeak)
        : (value && typeof value === 'object')
            ? Object.prototype.hasOwnProperty.call(value, 'enrollmentNumber') || Object.values(value).some(hasLeak)
            : false;
    console.log(hasLeak(body)
        ? 'FAIL: enrollmentNumber is exposed in the public roster response'
        : 'PASS: enrollmentNumber is not exposed in the public roster response');
});
" <<< "$public_response")
echo "$leak_check"

echo -e "\nCleaning up throwaway member $member_id and batch $batch_name..."
curl -s -o /dev/null -X DELETE "$API_URL/team/admin/members/$member_id" -b "$COOKIE_JAR"
curl -s -o /dev/null -X DELETE "$API_URL/team/admin/batches/$batch_name" -b "$COOKIE_JAR"

[[ "$leak_check" == FAIL* ]] && exit 1
exit 0

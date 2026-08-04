#!/bin/bash
source "$(dirname "$0")/../_helpers.sh"
login

album_title="Archived Test Album $$-$(date +%s%N)"

echo "Creating a throwaway album..."
album_id=$(curl -s -X POST "$API_URL/gallery" -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d "{\"title\":\"$album_title\"}" \
    | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>process.stdout.write(String(JSON.parse(d).id)))")
echo "Using album id: $album_id"

echo "Adding a featured photo to it..."
curl -s -o /dev/null -X POST "$API_URL/gallery/$album_id/photos" -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d '{"photos":[{"src":"https://example.com/archived-highlight.jpg","featured":true}]}'

echo "Archiving it..."
curl -s -o /dev/null -X PUT "$API_URL/gallery/$album_id" -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d '{"archived":true}'

echo -e "\n1) Public search (no auth) should NOT include the archived album:"
search_no_auth=$(curl -s -X GET "$API_URL/gallery?search=$(node -e "process.stdout.write(encodeURIComponent(process.argv[1]))" "$album_title")")
echo "$search_no_auth"

echo -e "\n2) Public search with includeArchived=true (no auth) — param must be IGNORED, still absent:"
search_no_auth_flag=$(curl -s -X GET "$API_URL/gallery?includeArchived=true&search=$(node -e "process.stdout.write(encodeURIComponent(process.argv[1]))" "$album_title")")
echo "$search_no_auth_flag"

echo -e "\n3) Public single-album fetch (no auth) should 404:"
curl -s -i -X GET "$API_URL/gallery/$album_id"

echo -e "\n4) Highlights (no auth) should NOT include this album's featured photo:"
highlights_no_auth=$(curl -s -X GET "$API_URL/gallery/highlights")
echo "$highlights_no_auth"

echo -e "\n5) Admin session, includeArchived=true — SHOULD include the archived album:"
search_admin=$(curl -s -X GET "$API_URL/gallery?includeArchived=true&search=$(node -e "process.stdout.write(encodeURIComponent(process.argv[1]))" "$album_title")" -b "$COOKIE_JAR")
echo "$search_admin"

echo -e "\n6) Admin single-album fetch should still 200:"
curl -s -i -X GET "$API_URL/gallery/$album_id" -b "$COOKIE_JAR"

echo -e "\n7) Verdict:"
verdict=$(node -e "
function parse(label, raw) {
    try { return JSON.parse(raw); } catch { console.log('FAIL: ' + label + ' response was not valid JSON'); process.exit(1); }
}
const albumId = process.argv[1];
const noAuth = parse('public search', process.argv[2]);
const noAuthFlag = parse('public search w/ includeArchived', process.argv[3]);
const highlights = parse('highlights', process.argv[4]);
const admin = parse('admin search', process.argv[5]);

const items = (body) => Array.isArray(body) ? body : (body.data || []);
const containsAlbum = (body) => items(body).some((a) => String(a.id) === String(albumId));

const fails = [];
if (containsAlbum(noAuth)) fails.push('archived album leaked into public search');
if (containsAlbum(noAuthFlag)) fails.push('includeArchived=true was honored without auth');
if (highlights.some((h) => String(h.albumId) === String(albumId))) fails.push('archived album leaked into highlights');
if (!containsAlbum(admin)) fails.push('admin with includeArchived=true could not see the archived album');

console.log(fails.length === 0 ? 'PASS: archived album is hidden from the public and visible to admins' : 'FAIL: ' + fails.join('; '));
" "$album_id" "$search_no_auth" "$search_no_auth_flag" "$highlights_no_auth" "$search_admin")
echo "$verdict"

echo -e "\nCleaning up throwaway album $album_id..."
curl -s -o /dev/null -X DELETE "$API_URL/gallery/$album_id" -b "$COOKIE_JAR"

[[ "$verdict" == FAIL* ]] && exit 1
exit 0

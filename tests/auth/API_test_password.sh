#!/bin/bash
source "$(dirname "$0")/../_helpers.sh"

# IMPORTANT: this script deliberately never completes a real password
# change. Doing so would overwrite the live admin password in the DB,
# and every other test script's login() call would start failing until
# you manually updated ADMIN_PASSWORD to match. It only exercises the
# auth/validation branches using values that are guaranteed to be
# rejected before a real change could ever happen:
#   - otp "000000" can never be a real OTP: crypto.randomInt(100000,
#     1000000) never generates a value below 100000.
#   - the "wrong current password" step uses a random throwaway string.

echo "1) Request OTP without auth (expect 401):"
curl -s -i -X POST "$API_URL/auth/password/otp"

echo -e "\n2) Change password without auth (expect 401):"
curl -s -i -X PUT "$API_URL/auth/password" -H "Content-Type: application/json" \
    -d '{"currentPassword":"x","newPassword":"x","otp":"000000"}'

login

echo -e "\n3) Change password with a missing field, now authenticated (expect 400, Zod):"
curl -s -i -X PUT "$API_URL/auth/password" -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d '{"currentPassword":"x","newPassword":"x"}'

echo -e "\n4) Request OTP as admin:"
echo "   -> 200 if SMTP_EMAIL/SMTP_PASSWORD are configured and reachable."
echo "   -> 500 (\"Could not send OTP email.\") if they are not — but note"
echo "      the OTP is still written to the admin record either way,"
echo "      since the DB update happens before the email send is attempted."
curl -s -i -X POST "$API_URL/auth/password/otp" -b "$COOKIE_JAR"

echo -e "\n5) Change password with the WRONG current password (expect 401):"
curl -s -i -X PUT "$API_URL/auth/password" -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d "{\"currentPassword\":\"definitely-wrong-$$\",\"newPassword\":\"SomeStrongPass1!\",\"otp\":\"000000\"}"

echo -e "\n6) Correct current password but a WEAK new password (expect 400 — rejected before the OTP is even checked):"
curl -s -i -X PUT "$API_URL/auth/password" -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d "{\"currentPassword\":\"$ADMIN_PASSWORD\",\"newPassword\":\"weak\",\"otp\":\"000000\"}"

echo -e "\n7) Correct current password, strong new password, but a WRONG otp (expect 400 — password NOT changed):"
curl -s -i -X PUT "$API_URL/auth/password" -b "$COOKIE_JAR" -H "Content-Type: application/json" \
    -d "{\"currentPassword\":\"$ADMIN_PASSWORD\",\"newPassword\":\"SomeStrongPass1!\",\"otp\":\"000000\"}"

echo -e "\nNote: the happy path (real OTP -> successful change) is intentionally"
echo "NOT automated here. To verify it manually: run step 4, get the real code"
echo "from the ADMIN_EMAIL inbox, then PUT /auth/password once by hand with"
echo "that code and a password you'll remember — then update ADMIN_PASSWORD"
echo "wherever you export it for these scripts."

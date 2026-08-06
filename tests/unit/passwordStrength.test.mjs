import assert from "node:assert/strict";
import { isPasswordStrongEnough, getPasswordStrength, PASSWORD_MIN_LENGTH, MIN_STRENGTH_SCORE } from "../../utils/passwordStrength.js";

let passed = 0, failed = 0;
const failures = [];

function check(name, fn) {
    try {
        fn();
        passed++;
    } catch (e) {
        failed++;
        failures.push(`${name}\n    ${e.message}`);
    }
}

check("passwordStrength: default dev/test admin password 'password123' scores 2/5", () => {
    assert.equal(getPasswordStrength("password123").score, 2);
});
check("passwordStrength: 'password123' is NOT strong enough (below MIN_STRENGTH_SCORE)", () => {
    assert.equal(isPasswordStrongEnough("password123"), false);
});
check("passwordStrength: a properly mixed password passes", () => {
    assert.equal(isPasswordStrongEnough("SomeStrongPass1!"), true);
});
check("passwordStrength: rejects anything under PASSWORD_MIN_LENGTH", () => {
    assert.equal(isPasswordStrongEnough("Ab1!".padEnd(PASSWORD_MIN_LENGTH - 1, "a")), false);
});
check("passwordStrength: MIN_STRENGTH_SCORE is 3 (documents the bar the API_test_password.sh comments rely on)", () => {
    assert.equal(MIN_STRENGTH_SCORE, 3);
});

console.log(`passwordStrength: ${passed} passed, ${failed} failed`);
if (failed > 0) {
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
}
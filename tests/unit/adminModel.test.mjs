import assert from "node:assert/strict";
import { loginSchema, updatePasswordSchema } from "../../models/adminModel.js";

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

check("loginSchema: requires both username and password, non-empty", () => {
    assert.equal(loginSchema.safeParse({ username: "admin" }).success, false);
    assert.equal(loginSchema.safeParse({ username: "admin", password: "" }).success, false);
    assert.equal(loginSchema.safeParse({ username: "admin", password: "x" }).success, true);
});
check("updatePasswordSchema: requires currentPassword, newPassword, and otp", () => {
    assert.equal(updatePasswordSchema.safeParse({ currentPassword: "a", newPassword: "b" }).success, false);
    assert.equal(updatePasswordSchema.safeParse({ currentPassword: "a", newPassword: "b", otp: "000000" }).success, true);
});

console.log(`adminModel: ${passed} passed, ${failed} failed`);
if (failed > 0) {
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
}
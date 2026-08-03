import assert from "node:assert/strict";
import { urlField, stringArray } from "../../utils/zodHelpers.js";

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

check("urlField('required'): rejects empty string", () => {
    assert.equal(urlField("required").safeParse("").success, false);
});
check("urlField('required'): rejects undefined", () => {
    assert.equal(urlField("required").safeParse(undefined).success, false);
});
check("urlField('required'): accepts a real URL", () => {
    assert.equal(urlField("required").safeParse("https://example.com").success, true);
});
check("urlField('optional'): accepts empty string", () => {
    assert.equal(urlField("optional").safeParse("").success, true);
});
check("urlField('optional'): rejects null", () => {
    assert.equal(urlField("optional").safeParse(null).success, false);
});
check("urlField('nullish'): accepts null and undefined", () => {
    assert.equal(urlField("nullish").safeParse(null).success, true);
    assert.equal(urlField("nullish").safeParse(undefined).success, true);
});
check("urlField('nullish'): rejects empty string", () => {
    assert.equal(urlField("nullish").safeParse("").success, false);
});
check("urlField: unknown mode throws (fails loud, not silently permissive)", () => {
    assert.throws(() => urlField("bogus-mode"));
});
check("stringArray: enforces the max item count", () => {
    const f = stringArray(2);
    assert.equal(f.safeParse(["a", "b", "c"]).success, false);
    assert.equal(f.safeParse(["a", "b"]).success, true);
});

console.log(`zodHelpers: ${passed} passed, ${failed} failed`);
if (failed > 0) {
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
}
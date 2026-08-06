import assert from "node:assert/strict";
import { parsePagination, escapeRegex, asString } from "../../utils/queryHelpers.js";

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

check("parsePagination: sensible defaults with no query params", () => {
    const r = parsePagination({});
    assert.equal(r.page, 1);
    assert.equal(r.pageSize, 20);
    assert.equal(r.hasLimit, false);
    assert.equal(r.hasPage, false);
});
check("parsePagination: pageSize is capped at 100", () => {
    assert.equal(parsePagination({ page: "1", pageSize: "500" }).pageSize, 100);
});
check("parsePagination: limit is capped at 100", () => {
    assert.equal(parsePagination({ limit: "500" }).limit, 100);
});
check("parsePagination: limit=0 is treated as 'no limit', not zero results", () => {
    assert.equal(parsePagination({ limit: "0" }).hasLimit, false);
});
check("parsePagination: garbage page value falls back to 1, not NaN", () => {
    assert.equal(parsePagination({ page: "not-a-number" }).page, 1);
});
check("escapeRegex: escapes regex metacharacters (used for gallery ?search=)", () => {
    assert.equal(escapeRegex("a.b*c(d)"), "a\\.b\\*c\\(d\\)");
});
check("asString: passes through strings, discards non-strings", () => {
    assert.equal(asString("x"), "x");
    assert.equal(asString(["x"]), undefined);
    assert.equal(asString(undefined), undefined);
});

console.log(`queryHelpers: ${passed} passed, ${failed} failed`);
if (failed > 0) {
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
}
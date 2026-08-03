import assert from "node:assert/strict";
import { generateId } from "../../utils/generateId.js";

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

check("generateId: returns a number", () => {
    assert.equal(typeof generateId(), "number");
});
check("generateId: ids are non-decreasing across calls", () => {
    const a = generateId();
    const b = generateId();
    assert.ok(b >= a);
});
check("generateId: realistic burst (well under 1000/ms) produces no collisions", () => {
    const ids = new Set();
    for (let i = 0; i < 200; i++) ids.add(generateId());
    assert.equal(ids.size, 200);
});

console.log(`generateId: ${passed} passed, ${failed} failed`);
if (failed > 0) {
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
}
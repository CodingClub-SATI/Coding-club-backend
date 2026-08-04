// Unit tests for pure logic (utils/*.js) and Zod validation schemas
// (models/*.js). Unlike the API_test_*.sh scripts, these do NOT need a
// running server or a MongoDB connection — they import the modules
// directly and exercise them in-process.
// Run with:  node tests/unit/utils_and_schemas.test.mjs
// (from the backend/ directory, after `npm install`)

import assert from "node:assert/strict";

import { isPasswordStrongEnough, getPasswordStrength, PASSWORD_MIN_LENGTH, MIN_STRENGTH_SCORE } from "../../utils/passwordStrength.js";
import { urlField, stringArray } from "../../utils/zodHelpers.js";
import { parsePagination, escapeRegex, asString } from "../../utils/queryHelpers.js";
import { shouldCountHit } from "../../utils/hitDedup.js";
import { matchesImageSignature } from "../../utils/fileSignature.js";
import { toDotNotation, toSetUpdate } from "../../utils/updateHelpers.js";
import { generateId } from "../../utils/generateId.js";

import { createEventSchema, updateEventSchema, EVENT_TYPES, EVENT_STATUSES } from "../../models/eventModel.js";
import { createContactSchema, updateContactSchema } from "../../models/contactModel.js";
import { createProjectSchema } from "../../models/projectModel.js";
import { createAlbumSchema, updateAlbumSchema, addPhotosSchema } from "../../models/galleryModel.js";
import { memberSchema, updateLeadershipSchema } from "../../models/teamModel.js";
import { loginSchema, updatePasswordSchema } from "../../models/adminModel.js";
import { updateContactInfoSchema } from "../../models/contactInfoModel.js";

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

// ---------------------------------------------------------------------
// utils/passwordStrength.js
// ---------------------------------------------------------------------
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

// ---------------------------------------------------------------------
// utils/zodHelpers.js
// ---------------------------------------------------------------------
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

// ---------------------------------------------------------------------
// utils/queryHelpers.js
// ---------------------------------------------------------------------
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

// ---------------------------------------------------------------------
// utils/hitDedup.js  (backs the view/register-click de-dup window)
// ---------------------------------------------------------------------
check("shouldCountHit: first hit in a window counts, immediate repeat does not", () => {
    const key = `unit-test:${Math.random()}`;
    assert.equal(shouldCountHit(key, 60_000), true);
    assert.equal(shouldCountHit(key, 60_000), false);
});
check("shouldCountHit: different keys are independent", () => {
    const a = `unit-test:a:${Math.random()}`;
    const b = `unit-test:b:${Math.random()}`;
    assert.equal(shouldCountHit(a, 60_000), true);
    assert.equal(shouldCountHit(b, 60_000), true);
});

// ---------------------------------------------------------------------
// utils/fileSignature.js  (magic-byte check behind POST /upload)
// ---------------------------------------------------------------------
check("matchesImageSignature: accepts real JPEG magic bytes", () => {
    const buf = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0, 0, 0, 0, 0, 0, 0, 0]);
    assert.equal(matchesImageSignature(buf, "image/jpeg"), true);
});
check("matchesImageSignature: rejects a text file relabeled as image/jpeg", () => {
    const buf = Buffer.from("this is not actually an image, just text");
    assert.equal(matchesImageSignature(buf, "image/jpeg"), false);
});
check("matchesImageSignature: rejects a too-short buffer", () => {
    assert.equal(matchesImageSignature(Buffer.from([0xFF, 0xD8, 0xFF]), "image/jpeg"), false);
});
check("matchesImageSignature: accepts PNG magic bytes", () => {
    const buf = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0]);
    assert.equal(matchesImageSignature(buf, "image/png"), true);
});
check("matchesImageSignature: WEBP requires both non-contiguous RIFF and WEBP markers", () => {
    const good = Buffer.alloc(12);
    good.write("RIFF", 0, "ascii");
    good.write("WEBP", 8, "ascii");
    assert.equal(matchesImageSignature(good, "image/webp"), true);

    const bad = Buffer.alloc(12); // RIFF present, WEBP marker missing
    bad.write("RIFF", 0, "ascii");
    assert.equal(matchesImageSignature(bad, "image/webp"), false);
});
check("matchesImageSignature: unknown mimetype is rejected", () => {
    const buf = Buffer.from([0xFF, 0xD8, 0xFF, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    assert.equal(matchesImageSignature(buf, "application/pdf"), false);
});

// ---------------------------------------------------------------------
// utils/updateHelpers.js  (backs $set-only partial updates for singletons/members)
// ---------------------------------------------------------------------
check("toDotNotation: flattens one level of nested plain objects", () => {
    const out = toDotNotation({ email: "a@b.com", github: { url: "x", showOnFooter: true } });
    assert.deepEqual(out, { email: "a@b.com", "github.url": "x", "github.showOnFooter": true });
});
check("toDotNotation: does not flatten arrays", () => {
    assert.deepEqual(toDotNotation({ tags: ["a", "b"] }), { tags: ["a", "b"] });
});
check("toDotNotation: does not flatten null", () => {
    assert.deepEqual(toDotNotation({ avatarUrl: null }), { avatarUrl: null });
});
check("toSetUpdate: empty body produces {} (never an empty $set, which MongoDB rejects)", () => {
    assert.deepEqual(toSetUpdate({}), {});
});
check("toSetUpdate: non-empty body is wrapped in $set", () => {
    assert.deepEqual(toSetUpdate({ a: 1 }), { $set: { a: 1 } });
});

// ---------------------------------------------------------------------
// utils/generateId.js
// ---------------------------------------------------------------------
check("generateId: returns a number", () => {
    assert.equal(typeof generateId(), "number");
});
check("generateId: ids are non-decreasing across calls", () => {
    const a = generateId();
    const b = generateId();
    assert.ok(b >= a);
});
check("generateId: realistic burst (well under 1000/ms) produces no collisions", () => {
    // NOTE: the sequence counter wraps modulo 1000 within a single
    // millisecond by design, so this only holds for bursts smaller than
    // that. That's fine for this app's real usage (a handful of admins
    // clicking "create" in the UI) — flagging the bound here explicitly
    // so it doesn't get invalidated by surprise if that assumption ever
    // changes (e.g. a bulk-import script).
    const ids = new Set();
    for (let i = 0; i < 200; i++) ids.add(generateId());
    assert.equal(ids.size, 200);
});

// ---------------------------------------------------------------------
// models/eventModel.js — createEventSchema / updateEventSchema
// ---------------------------------------------------------------------
check("createEventSchema: requires title, type, status", () => {
    assert.equal(createEventSchema.safeParse({}).success, false);
    assert.equal(createEventSchema.safeParse({ title: "x" }).success, false);
    assert.equal(createEventSchema.safeParse({ title: "x", type: EVENT_TYPES[0], status: EVENT_STATUSES[0] }).success, true);
});
check("createEventSchema: rejects an unknown type/status", () => {
    assert.equal(createEventSchema.safeParse({ title: "x", type: "Not-A-Type", status: EVENT_STATUSES[0] }).success, false);
    assert.equal(createEventSchema.safeParse({ title: "x", type: EVENT_TYPES[0], status: "not-a-status" }).success, false);
});
check("createEventSchema: strict — rejects unknown fields", () => {
    const r = createEventSchema.safeParse({ title: "x", type: EVENT_TYPES[0], status: EVENT_STATUSES[0], notAField: 1 });
    assert.equal(r.success, false);
});
check("updateEventSchema: everything optional (partial), still strict", () => {
    assert.equal(updateEventSchema.safeParse({}).success, true);
    assert.equal(updateEventSchema.safeParse({ archived: true }).success, true);
    assert.equal(updateEventSchema.safeParse({ notAField: 1 }).success, false);
});

// ---------------------------------------------------------------------
// models/contactModel.js — createContactSchema (honeypot + enum)
// ---------------------------------------------------------------------
check("createContactSchema: valid submission passes", () => {
    const r = createContactSchema.safeParse({
        name: "Test", email: "test@example.com", requestType: "General Inquiry", message: "hi",
    });
    assert.equal(r.success, true);
});
check("createContactSchema: honeypot must be empty if present (bot detection)", () => {
    const r = createContactSchema.safeParse({
        name: "Bot", email: "bot@example.com", requestType: "General Inquiry", message: "hi", honeypot: "I am a bot",
    });
    assert.equal(r.success, false);
});
check("createContactSchema: honeypot as empty string is fine (real users)", () => {
    const r = createContactSchema.safeParse({
        name: "Real", email: "real@example.com", requestType: "General Inquiry", message: "hi", honeypot: "",
    });
    assert.equal(r.success, true);
});
check("createContactSchema: rejects invalid email / requestType", () => {
    assert.equal(createContactSchema.safeParse({ name: "x", email: "not-an-email", requestType: "General Inquiry", message: "hi" }).success, false);
    assert.equal(createContactSchema.safeParse({ name: "x", email: "x@x.com", requestType: "Not A Real Type", message: "hi" }).success, false);
});
check("updateContactSchema: status+archived optional, but no client-writable freeform fields", () => {
    assert.equal(updateContactSchema.safeParse({ status: "Read" }).success, true);
    assert.equal(updateContactSchema.safeParse({ message: "trying to edit the message" }).success, false);
});

// ---------------------------------------------------------------------
// models/projectModel.js — createProjectSchema
// ---------------------------------------------------------------------
check("createProjectSchema: members must be a positive integer", () => {
    const base = { title: "t", team: "t", description: "d", github: "https://github.com/octocat/Hello-World", category: "Web" };
    assert.equal(createProjectSchema.safeParse({ ...base, members: 0 }).success, false);
    assert.equal(createProjectSchema.safeParse({ ...base, members: 1.5 }).success, false);
    assert.equal(createProjectSchema.safeParse({ ...base, members: 4 }).success, true);
});
check("createProjectSchema: github must be a non-empty URL", () => {
    const base = { title: "t", team: "t", description: "d", category: "Web", members: 2 };
    assert.equal(createProjectSchema.safeParse({ ...base, github: "" }).success, false);
    assert.equal(createProjectSchema.safeParse({ ...base, github: "not-a-url" }).success, false);
});

// ---------------------------------------------------------------------
// models/galleryModel.js — album / photo schemas
// ---------------------------------------------------------------------
check("createAlbumSchema: cover is a valid, optional field (rejection of cover-on-create is app logic in the controller, not the schema)", () => {
    assert.equal(createAlbumSchema.safeParse({ title: "x" }).success, true);
    assert.equal(createAlbumSchema.safeParse({ title: "x", cover: "https://example.com/c.jpg" }).success, true);
});
check("updateAlbumSchema: allows setting archived, still strict", () => {
    assert.equal(updateAlbumSchema.safeParse({ archived: true }).success, true);
    assert.equal(updateAlbumSchema.safeParse({ notAField: 1 }).success, false);
});
check("addPhotosSchema: requires 1-50 photos, each with a real src URL", () => {
    assert.equal(addPhotosSchema.safeParse({ photos: [] }).success, false);
    assert.equal(addPhotosSchema.safeParse({ photos: [{ src: "https://example.com/a.jpg" }] }).success, true);
    assert.equal(addPhotosSchema.safeParse({ photos: [{ src: "" }] }).success, false);
    assert.equal(addPhotosSchema.safeParse({ photos: Array.from({ length: 51 }, (_, i) => ({ src: `https://example.com/${i}.jpg` })) }).success, false);
});

// ---------------------------------------------------------------------
// models/teamModel.js — memberSchema / updateLeadershipSchema
// ---------------------------------------------------------------------
check("memberSchema: skills capped at 3 entries", () => {
    const base = { enrollmentNumber: "E1", fullName: "N", batch: "B" };
    assert.equal(memberSchema.safeParse({ ...base, skills: ["a", "b", "c"] }).success, true);
    assert.equal(memberSchema.safeParse({ ...base, skills: ["a", "b", "c", "d"] }).success, false);
});
check("updateLeadershipSchema: convenors/coConvenors capped at 2 each", () => {
    const base = { coConvenors: [], departmentHeads: {} };
    assert.equal(updateLeadershipSchema.safeParse({ ...base, convenors: [1, 2] }).success, true);
    assert.equal(updateLeadershipSchema.safeParse({ ...base, convenors: [1, 2, 3] }).success, false);
});
check("updateLeadershipSchema: departmentHeads capped at 20 entries", () => {
    const over = Object.fromEntries(Array.from({ length: 21 }, (_, i) => [`dept${i}`, i]));
    const ok = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`dept${i}`, i]));
    assert.equal(updateLeadershipSchema.safeParse({ convenors: [], coConvenors: [], departmentHeads: over }).success, false);
    assert.equal(updateLeadershipSchema.safeParse({ convenors: [], coConvenors: [], departmentHeads: ok }).success, true);
});
check("updateLeadershipSchema: all three top-level keys are required (not .partial())", () => {
    assert.equal(updateLeadershipSchema.safeParse({ convenors: [], coConvenors: [] }).success, false);
});

// ---------------------------------------------------------------------
// models/adminModel.js — loginSchema / updatePasswordSchema
// ---------------------------------------------------------------------
check("loginSchema: requires both username and password, non-empty", () => {
    assert.equal(loginSchema.safeParse({ username: "admin" }).success, false);
    assert.equal(loginSchema.safeParse({ username: "admin", password: "" }).success, false);
    assert.equal(loginSchema.safeParse({ username: "admin", password: "x" }).success, true);
});
check("updatePasswordSchema: requires currentPassword, newPassword, and otp", () => {
    assert.equal(updatePasswordSchema.safeParse({ currentPassword: "a", newPassword: "b" }).success, false);
    assert.equal(updatePasswordSchema.safeParse({ currentPassword: "a", newPassword: "b", otp: "000000" }).success, true);
});

// ---------------------------------------------------------------------
// models/contactInfoModel.js — updateContactInfoSchema
// ---------------------------------------------------------------------
check("updateContactInfoSchema: email accepts a real address or empty string, not garbage", () => {
    assert.equal(updateContactInfoSchema.safeParse({ email: "club@example.com" }).success, true);
    assert.equal(updateContactInfoSchema.safeParse({ email: "" }).success, true);
    assert.equal(updateContactInfoSchema.safeParse({ email: "not-an-email" }).success, false);
});
check("updateContactInfoSchema: strict — rejects unknown top-level fields", () => {
    assert.equal(updateContactInfoSchema.safeParse({ tagline: "nope" }).success, false);
});
check("updateContactInfoSchema: nested social object accepts partial updates", () => {
    const r = updateContactInfoSchema.safeParse({ github: { url: "https://github.com/x", showOnFooter: true } });
    assert.equal(r.success, true);
});

// ---------------------------------------------------------------------
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
    console.log("\nFailures:");
    for (const f of failures) console.log(`  - ${f}`);
}
process.exit(failed > 0 ? 1 : 0);

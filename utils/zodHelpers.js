import z from "zod";

// A URL field, with a mode that picks how "no value" is allowed to look —
// the three shapes that repeat across models:
//   "required" - must be a real URL. No empty string, null, or undefined.
//                 (project github link, gallery photo src)
//   "optional" - a real URL, OR an empty string, but not null. This is
//                 the "field present but cleared" pattern used by update
//                 endpoints (demo/cover/social links). DEFAULT mode.
//   "nullish"  - a real URL, OR null/undefined, but not empty string.
//                 Used for image fields that are either a real URL or
//                 simply absent (logos, banners, avatars).
export function urlField(mode = "optional", maxLen = 500) {
    const base = z.string().max(maxLen).url();
    switch (mode) {
        case "required":
            return z.string().min(1).max(maxLen).url();
        case "nullish":
            return base.nullish();
        case "optional":
            return base.optional().or(z.literal(''));
        default:
            throw new Error(`urlField: unknown mode "${mode}"`);
    }
}

export function stringArray(maxItems, maxLen = 50) {
    return z.array(z.string().max(maxLen)).max(maxItems).optional();
}

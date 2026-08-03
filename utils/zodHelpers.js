/* Mode to picks how "no value" is allowed to look in a URL field —

required:   must be a real URL. No empty string, null, or undefined.
optional:   a real URL, OR an empty string, but not null.  [ DEFAULT ]
            used by update endpoints - field is present but blank.
nullish:    a real URL, OR null/undefined, but not empty string
            Used for image fields - either a real URL or simply absent.
*/

import z from "zod";

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
export function toDotNotation(body) {
    const set = {};
    for (const [key, value] of Object.entries(body)) {
        const isPlainObject = value !== null && typeof value === "object" && !Array.isArray(value);
        if (isPlainObject) {
            for (const [nestedKey, nestedValue] of Object.entries(value)) {
                set[`${key}.${nestedKey}`] = nestedValue;
            }
        } else {
            set[key] = value;
        }
    }
    return set;
}

// Wraps toDotNotation in a ready-to-use update document, avoiding an empty
// `{ $set: {} }` (which MongoDB rejects) when the body has no keys at all.
export function toSetUpdate(body) {
    const setOps = toDotNotation(body);
    return Object.keys(setOps).length > 0 ? { $set: setOps } : {};
}

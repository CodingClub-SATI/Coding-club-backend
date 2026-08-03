export function addPublicId(schema, { unique = true } = {}) {
    schema.add({
        id: { type: Number, required: true, unique }
    });
}

export function addArchivable(schema) {
    schema.add({
        archived: { type: Boolean, default: false }
    });
}

export function addSingletonLock(schema, key) {
    schema.add({
        singleton: { type: String, default: key, unique: true }
    });
}

export function hideMongoInternals(schema) {
    for (const key of ["toJSON", "toObject"]) {
        const existing = schema.get(key) || {};
        const existingTransform = existing.transform;

        schema.set(key, {
            ...existing,
            transform(doc, ret, options) {
                const transformed = existingTransform
                    ? existingTransform(doc, ret, options) || ret
                    : ret;
                delete transformed._id;
                delete transformed.__v;
                return transformed;
            },
        });
    }
}
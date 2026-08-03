import { generateId } from "./generateId.js";
import { handleControllerError } from "./errorHandler.js";

export function createHandler(Model, {
    context,
    duplicateMessage,
    validate,
    buildData,
    beforeSave,
    afterCreate,
    respond,
} = {}) {
    return async (req, res) => {
        try {
            if (validate) {
                const rejection = await validate(req);
                if (rejection) return res.status(rejection.status).json({ message: rejection.message });
            }

            const data = buildData ? await buildData(req) : { ...req.body, id: generateId() };
            const instance = new Model(data);
            if (beforeSave) await beforeSave(instance, req);

            const saved = await instance.save();
            if (afterCreate) await afterCreate(saved, req);
            if (respond) return respond(saved, res);
            return res.status(201).json(saved);
        } catch (error) {
            return handleControllerError(error, res, { context, duplicateMessage });
        }
    };
}

export function updateHandler(Model, {
    paramName = "id",
    filterField = "id",
    notFoundMessage,
    context,
    duplicateMessage,
    validate,
    buildUpdate,
    beforeUpdate,
    afterUpdate,
    respond,
} = {}) {
    return async (req, res) => {
        try {
            if (validate) {
                const rejection = await validate(req);
                if (rejection) return res.status(rejection.status).json({ message: rejection.message });
            }

            const captured = beforeUpdate ? await beforeUpdate(req) : undefined;
            const update = buildUpdate ? await buildUpdate(req) : req.body;

            const updated = await Model.findOneAndUpdate(
                { [filterField]: req.params[paramName] },
                update,
                { returnDocument: "after", runValidators: true }
            ).exec();

            if (!updated) {
                return res.status(404).json({ message: notFoundMessage });
            }

            if (afterUpdate) await afterUpdate(updated, req, captured);

            if (respond) return respond(updated, res);
            return res.status(200).json(updated);
        } catch (error) {
            return handleControllerError(error, res, { context, duplicateMessage });
        }
    };
}

export function removeHandler(Model, {
    paramName = "id",
    filterField = "id",
    notFoundMessage,
    context,
    validate,
    onRemoved,
    respond,
} = {}) {
    return async (req, res) => {
        try {
            if (validate) {
                const rejection = await validate(req);
                if (rejection) return res.status(rejection.status).json({ message: rejection.message });
            }

            const removed = await Model.findOneAndDelete({
                [filterField]: req.params[paramName],
            }).exec();

            if (!removed) {
                return res.status(404).json({ message: notFoundMessage });
            }

            if (onRemoved) await onRemoved(removed, req);

            if (respond) return respond(removed, res);
            return res.status(200).json(removed);
        } catch (error) {
            return handleControllerError(error, res, { context });
        }
    };
}

export function singletonGetHandler(Model, {
    singletonKey,
    context,
    buildDefault,
} = {}) {
    return async (req, res) => {
        try {
            const doc = await Model.findOne({ singleton: singletonKey }).exec();
            if (doc) return res.status(200).json(doc);
            return res.status(200).json(buildDefault ? await buildDefault() : null);
        } catch (error) {
            return handleControllerError(error, res, { context });
        }
    };
}

export function singletonUpdateHandler(Model, {
    singletonKey,
    context,
    validate,
    buildUpdate,
    options,
    respond,
} = {}) {
    return async (req, res) => {
        try {
            if (validate) {
                const rejection = await validate(req);
                if (rejection) return res.status(rejection.status).json({ message: rejection.message });
            }

            const update = buildUpdate ? await buildUpdate(req) : req.body;

            const updated = await Model.findOneAndUpdate(
                { singleton: singletonKey },
                update,
                { returnDocument: "after", upsert: true, runValidators: true, ...options }
            ).exec();

            if (respond) return respond(updated, res);
            return res.status(200).json(updated);
        } catch (error) {
            return handleControllerError(error, res, { context });
        }
    };
}
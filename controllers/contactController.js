import Contact, { REQUEST_TYPES, CONTACT_STATUSES } from "../models/contactModel.js";
import { handleControllerError } from "../utils/errorHandler.js";
import { paginatedFind, asString } from "../utils/queryHelpers.js";
import { createHandler, updateHandler, removeHandler } from "../utils/crudHandlers.js";

export const create = createHandler(Contact, {
    context: "Error creating contact message",
    duplicateMessage: "Contact message already exists",
    respond: (saved, res) => res.status(201).json({
        message: "Thanks for reaching out — we'll get back to you soon.",
        id: saved.id,
    }),
});

export const fetch = async (req, res) => {
    try {
        const wantsArchived = req.query.includeArchived === "true";
        const filter = wantsArchived ? {} : { archived: { $ne: true } };

        const status = asString(req.query.status);
        const requestType = asString(req.query.requestType);
        if (status !== undefined) {
            if (!CONTACT_STATUSES.includes(status)) {
                return res.status(400).json({ message: `Invalid 'status'. Allowed values: ${CONTACT_STATUSES.join(", ")}.` });
            }
            filter.status = status;
        }
        if (requestType !== undefined) {
            if (!REQUEST_TYPES.includes(requestType)) {
                return res.status(400).json({ message: `Invalid 'requestType'. Allowed values: ${REQUEST_TYPES.join(", ")}.` });
            }
            filter.requestType = requestType;
        }

        const query = Contact.find(filter).sort({ createdAt: -1 });
        const result = await paginatedFind(query, Contact, filter, req.query);
        return res.json(result);
    } catch (error) {
        return handleControllerError(error, res, { context: "Error fetching contacts" });
    }
};

export const update = updateHandler(Contact, {
    notFoundMessage: "Contact message does not exist",
    context: "Error updating contact",
});

export const remove = removeHandler(Contact, {
    notFoundMessage: "Contact message does not exist",
    context: "Error deleting contact",
});
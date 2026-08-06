import Update from "../models/updateModel.js";
import { paginatedFind } from "../utils/queryHelpers.js";
import { handleControllerError } from "../utils/errorHandler.js";
import { createHandler, updateHandler, removeHandler } from "../utils/crudHandlers.js";

export const create = createHandler(Update, {
    context: "Error creating update",
    duplicateMessage: "Update already exists",
});

export const fetch = async (req, res) => {
    try {
        const query = Update.find().sort({ createdAt: -1 });
        const result = await paginatedFind(query, Update, {}, req.query, { defaultLimit: 20 });
        return res.json(result);
    } catch (error) {
        return handleControllerError(error, res, { context: "Error fetching updates" });
    }
};

export const update = updateHandler(Update, {
    notFoundMessage: "Update does not exist",
    context: "Error updating update",
    duplicateMessage: "Update already exists",
});

export const remove = removeHandler(Update, {
    notFoundMessage: "Update does not exist",
    context: "Error deleting update",
});
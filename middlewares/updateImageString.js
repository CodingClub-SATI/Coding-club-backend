import Event from "../models/eventModel.js";
import { EVENT_ASSET_FIELD_MAP } from "./parameterValidate.js";
import { loadEventOr404 } from "./eventLookup.js";
import { handleControllerError } from "../utils/errorHandler.js";
import { deleteImageFromCatboxBestEffort } from "../controllers/catboxImageController.js";

export const getEventImageString = async (req, res, next) => {
    try {
        const event = await loadEventOr404(req, res);
        if (!event) return;
        const field = EVENT_ASSET_FIELD_MAP[req.params.asset];
        if (!event[field]) {
            return res.status(404).json({
                message: `Event has no ${req.params.asset} to remove`,
            });
        }
        req.imageUrl = event[field];
        next();
    } catch (err) {
        return handleControllerError(err, res, { context: "Error reading event image" });
    }
};

export const captureExistingEventImage = async (req, res, next) => {
    try {
        const event = await loadEventOr404(req, res);
        if (!event) return;
        const field = EVENT_ASSET_FIELD_MAP[req.params.asset];
        req.previousImageUrl = event[field] || null;
        next();
    } catch (err) {
        return handleControllerError(err, res, { context: "Error reading event image" });
    }
};

export const updateEventImageString = async (req, res) => {
    try {
        const field = EVENT_ASSET_FIELD_MAP[req.params.asset];
        const event = await Event.findOneAndUpdate(
            { id: req.params.id },
            {
                [field]: req.imageUrl,
            },
            {
                returnDocument: "after",
                runValidators: true,
            }
        ).exec();
        if (!event) {
            return res.status(404).json({
                message: "Event not found",
            });
        }

        if (req.previousImageUrl && req.previousImageUrl !== req.imageUrl) {
            deleteImageFromCatboxBestEffort(req.previousImageUrl);
        }

        return res.status(200).json({ event });
    } catch (err) {
        return handleControllerError(err, res, { context: "Error updating event image" });
    }
};

export const removeEventImageString = async (req, res) => {
    try {
        const field = EVENT_ASSET_FIELD_MAP[req.params.asset];
        const event = await Event.findOneAndUpdate(
            { id: req.params.id },
            {
                [field]: null,
            },
            {
                returnDocument: "after",
                runValidators: true,
            }
        ).exec();
        if (!event) {
            return res.status(404).json({
                message: "Event not found",
            });
        }

        deleteImageFromCatboxBestEffort(req.imageUrl);

        return res.status(200).json({ event });
    } catch (err) {
        return handleControllerError(err, res, { context: "Error removing event image" });
    }
};
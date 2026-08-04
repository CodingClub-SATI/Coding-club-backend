import Event, { EVENT_TYPES, EVENT_STATUSES } from "../models/eventModel.js";
import Update from "../models/updateModel.js";
import { paginatedFind, asString } from "../utils/queryHelpers.js";
import { handleControllerError } from "../utils/errorHandler.js";
import { createHandler, updateHandler, removeHandler } from "../utils/crudHandlers.js";
import { generateId } from "../utils/generateId.js";
import { shouldCountHit } from "../utils/hitDedup.js";
import { deleteImagesFromCatboxBestEffort } from "./catboxImageController.js";

const HIT_DEDUP_WINDOW_MS = 12 * 60 * 60 * 1000; // 12 hours

async function findEventAndMaybeIncrement(id, incField, dedupeKeyPrefix, req) {
    const shouldCount = shouldCountHit(`${dedupeKeyPrefix}:${req.ip}:${id}`, HIT_DEDUP_WINDOW_MS);
    return shouldCount
        ? await Event.findOneAndUpdate(
              { id, archived: { $ne: true } },
              { $inc: { [incField]: 1 } },
              { returnDocument: "after" }
          ).exec()
        : await Event.findOne({ id, archived: { $ne: true } }).exec();
}

function formatEventDate(date) {
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC"
    });
}

function buildEventAnnouncementMessage(event) {
    const whenWhere = [
        event.date ? `on ${formatEventDate(event.date)}` : null,
        event.venue ? `at ${event.venue}` : null,
    ].filter(Boolean).join(" ");

    return whenWhere
        ? `🎉 New event: ${event.title}! Join us ${whenWhere} — see you there!`
        : `🎉 New event: ${event.title}! Details coming soon — stay tuned!`;
}

export const create = createHandler(Event, {
    context: "Error creating event",
    duplicateMessage: "Event already exists",
    afterCreate: async (event) => {
        try {
            await Update.create({
                id: generateId(),
                message: buildEventAnnouncementMessage(event),
            });
        } catch (err) {
            console.error("Failed to auto-create announcement for new event (non-fatal):", err);
        }
    },
});

export const fetch = async (req, res) => {
    try {
        const wantsArchived = req.query.includeArchived === "true";
        const filter = wantsArchived && req.isAdmin ? {} : { archived: { $ne: true } };

        const status = asString(req.query.status);
        const type = asString(req.query.type);
        if (status !== undefined) {
            if (!EVENT_STATUSES.includes(status)) {
                return res.status(400).json({ message: `Invalid 'status'. Allowed values: ${EVENT_STATUSES.join(", ")}.` });
            }
            filter.status = status;
        }
        if (type !== undefined) {
            if (!EVENT_TYPES.includes(type)) {
                return res.status(400).json({ message: `Invalid 'type'. Allowed values: ${EVENT_TYPES.join(", ")}.` });
            }
            filter.type = type;
        }

        if (req.query.featured === "true") filter.featured = true;

        // Default sort is by the event's own scheduled date. Callers that
        // actually want "most recently created" (e.g. an admin dashboard's
        // recent-activity panel) can opt in explicitly; we whitelist the
        // value rather than accepting an arbitrary sort field from the client.
        const sort = req.query.sortBy === "createdAt"
            ? { createdAt: -1 }
            : { date: -1, createdAt: -1 };
        const query = Event.find(filter).sort(sort);
        const result = await paginatedFind(query, Event, filter, req.query);
        return res.json(result);
    } catch (error) {
        return handleControllerError(error, res, { context: "Error fetching events" });
    }
};

export const fetchOne = async (req, res) => {
    try {
        const id = req.params.id;
        if (req.isAdmin) {
            const event = await Event.findOne({ id }).exec();
            if (!event) return res.status(404).json({ message: "Event does not exist" });
            return res.status(200).json(event);
        }

        const event = await findEventAndMaybeIncrement(id, "viewCount", "view", req);
        if (!event) return res.status(404).json({ message: "Event does not exist" });
        return res.status(200).json(event);
    } catch (error) {
        return handleControllerError(error, res, { context: "Error fetching event" });
    }
};

export const trackRegisterClick = async (req, res) => {
    try {
        const id = req.params.id;
        const event = await findEventAndMaybeIncrement(id, "registerClickCount", "click", req);
        if (!event) return res.status(404).json({ message: "Event does not exist" });
        return res.status(200).json({ registerClickCount: event.registerClickCount });
    } catch (error) {
        return handleControllerError(error, res, { context: "Error tracking register click" });
    }
};

export const update = updateHandler(Event, {
    notFoundMessage: "Event does not exist",
    context: "Error updating event",
    duplicateMessage: "Event already exists",
});

export const remove = removeHandler(Event, {
    notFoundMessage: "Event does not exist",
    context: "Error deleting event",
    onRemoved: (removed) => {
        deleteImagesFromCatboxBestEffort([removed.logoUrl, removed.bannerUrl]);
    },
});
import mongoose from "mongoose";
import z from "zod";
import { addPublicId, addArchivable, hideMongoInternals } from "../utils/schemaPlugins.js";
import { urlField, stringArray } from "../utils/zodHelpers.js";

export const EVENT_TYPES = ["Workshop", "Hackathon", "Competition", "Seminar"];
export const EVENT_STATUSES = ["upcoming", "completed"];

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    type: { type: String, required: true, enum: EVENT_TYPES },
    status: { type: String, required: true, enum: EVENT_STATUSES },
    featured: { type: Boolean, default: false },
    date: { type: Date },
    time: { type: String },
    reportingTime: { type: String },
    venue: { type: String },
    description: { type: String },
    logoUrl: { type: String },
    bannerUrl: { type: String },
    tags: [String],
    registrationLink: { type: String },
    viewCount: { type: Number, default: 0 },
    registerClickCount: { type: Number, default: 0 }
}, {
    timestamps: true
});

eventSchema.index(
    { title: 1, date: 1 },
    { unique: true, partialFilterExpression: { date: { $exists: true } } }
);

addPublicId(eventSchema);
addArchivable(eventSchema);
hideMongoInternals(eventSchema);

export default mongoose.model('Event', eventSchema, 'events');

const eventFieldsSchema = {
    title: z.string().min(1).max(200),
    type: z.enum(EVENT_TYPES),
    status: z.enum(EVENT_STATUSES),
    featured: z.boolean().optional(),
    archived: z.boolean().optional(),
    date: z.coerce.date().optional(),
    time: z.string().max(50).optional(),
    reportingTime: z.string().max(50).optional(),
    venue: z.string().max(200).optional(),
    description: z.string().max(5000).optional(),
    logoUrl: urlField('nullish'),
    bannerUrl: urlField('nullish'),
    registrationLink: urlField(),
    tags: stringArray(20),
    viewCount: z.number().optional(),
    registerClickCount: z.number().optional()
};

export const createEventSchema = z.object(eventFieldsSchema).strict();
export const updateEventSchema = z.object(eventFieldsSchema).partial().strict();
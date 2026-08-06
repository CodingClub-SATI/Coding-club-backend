import mongoose from "mongoose";
import z from "zod";
import { addPublicId, addArchivable, hideMongoInternals } from "../utils/schemaPlugins.js";

export const REQUEST_TYPES = ['Collaboration', 'Join Club', 'Sponsorship', 'General Inquiry', 'Other'];
export const CONTACT_STATUSES = ['New', 'Read'];

const contactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    requestType: { type: String, required: true, enum: REQUEST_TYPES },
    message: { type: String, required: true },
    status: { type: String, default: 'New', enum: CONTACT_STATUSES }
}, {
    timestamps: true
});

contactSchema.index({ email: 1, message: 1 }, { unique: true });

addPublicId(contactSchema);
addArchivable(contactSchema);
hideMongoInternals(contactSchema);

export default mongoose.model('Contact', contactSchema, 'contacts');

export const createContactSchema = z.object({
    name: z.string().min(1).max(100),
    email: z.string().max(254).email(),
    requestType: z.enum(REQUEST_TYPES),
    message: z.string().min(1).max(2000),
    honeypot: z.string().max(0).optional()
}).strict();

export const updateContactSchema = z.object({
    status: z.enum(CONTACT_STATUSES),
    archived: z.boolean()
}).partial().strict();
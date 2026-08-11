import mongoose from "mongoose";
import z from "zod";
import { addPublicId, hideMongoInternals } from "../utils/schemaPlugins.js";
import { urlField } from "../utils/zodHelpers.js";

const updateSchema = new mongoose.Schema({
    message: { type: String, required: true },
    link: { type: String }
}, {
    timestamps: true
});

addPublicId(updateSchema);
hideMongoInternals(updateSchema);

export default mongoose.model('Update', updateSchema, 'updates');

export const createUpdateSchema = z.object({
    message: z.string().min(1).max(1000),
    link: urlField()
}).strict();

export const updateUpdateSchema = createUpdateSchema.partial().strict();
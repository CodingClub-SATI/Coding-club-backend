import mongoose from "mongoose";
import z from "zod";
import { addPublicId, hideMongoInternals } from "../utils/schemaPlugins.js";

// update dont need to be archieved
const updateSchema = new mongoose.Schema({
    message: { type: String, required: true }
}, {
    timestamps: true
});

addPublicId(updateSchema);
hideMongoInternals(updateSchema);

export default mongoose.model('Update', updateSchema, 'updates');

export const createUpdateSchema = z.object({
    message: z.string().min(1).max(1000)
}).strict();

export const updateUpdateSchema = createUpdateSchema.partial().strict();
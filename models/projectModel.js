import mongoose from "mongoose";
import z from "zod";
import { addPublicId, addArchivable, hideMongoInternals } from "../utils/schemaPlugins.js";
import { urlField, stringArray } from "../utils/zodHelpers.js";

const projectSchema = new mongoose.Schema({
    title: { type: String, required: true },
    team: { type: String, required: true },
    members: { type: Number, required: true },
    tech: [String],
    description: { type: String, required: true },
    stars: { type: Number, default: 0 },
    forks: { type: Number, default: 0 },
    github: { type: String, required: true },
    demo: { type: String },
    category: { type: String, required: true }
}, {
    timestamps: true
});

projectSchema.index({ title: 1, team: 1 }, { unique: true });

addPublicId(projectSchema);
addArchivable(projectSchema);
hideMongoInternals(projectSchema);

export default mongoose.model('Project', projectSchema, 'projects');

export const createProjectSchema = z.object({
    title: z.string().min(1).max(200),
    team: z.string().min(1).max(200),
    members: z.number().int().min(1).max(1000),
    tech: stringArray(20),
    description: z.string().min(1).max(3000),
    github: urlField('required'),
    demo: urlField(),
    category: z.string().min(1).max(100),
}).strict();

export const updateProjectSchema = createProjectSchema.partial().strict();
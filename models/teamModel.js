import mongoose from "mongoose";
import z from "zod";
import { addPublicId, addArchivable, addSingletonLock, hideMongoInternals } from "../utils/schemaPlugins.js";
import { urlField, stringArray } from "../utils/zodHelpers.js";

export const MEMBER_SOCIAL_KEYS = ["github", "linkedin", "instagram", "x"];

const memberSocialFieldsMongoose = MEMBER_SOCIAL_KEYS.reduce((fields, key) => {
    fields[key] = { type: String };
    return fields;
}, {});

const teamMemberSchema = new mongoose.Schema({
    enrollmentNumber: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    specialization: { type: String },
    batch: { type: String, required: true }, // Links to the Batch
    skills: [String],
    avatarUrl: { type: String },
    ...memberSocialFieldsMongoose
}, {
    timestamps: true
});

const batchSchema = new mongoose.Schema({
    batch: { type: String, required: true, unique: true }
}, {
    timestamps: true
});

const leadershipSchema = new mongoose.Schema({
    convenors: [{ type: Number, ref: 'TeamMember' }],
    coConvenors: [{ type: Number, ref: 'TeamMember' }],
    departmentHeads: { type: Map, of: Number }
}, {
    timestamps: true
});

addPublicId(teamMemberSchema);
addArchivable(batchSchema);
hideMongoInternals(teamMemberSchema);
hideMongoInternals(batchSchema);
addSingletonLock(leadershipSchema, "globalLeadership");
hideMongoInternals(leadershipSchema);

export const TeamMember = mongoose.model('TeamMember', teamMemberSchema, 'teammembers');
export const Batch = mongoose.model('Batch', batchSchema, 'batches');
export const Leadership = mongoose.model('Leadership', leadershipSchema, 'leaderships');

export default { TeamMember, Batch, Leadership };

export const createBatchSchema = z.object({
    batch: z.string().min(1).max(50)
}).strict();

export const updateBatchSchema = z.object({
    archived: z.boolean()
}).strict();

const memberSocialFieldsZod = MEMBER_SOCIAL_KEYS.reduce((fields, key) => {
    fields[key] = urlField();
    return fields;
}, {});

export const memberSchema = z.object({
    enrollmentNumber: z.string().min(1).max(50),
    fullName: z.string().min(1).max(200),
    specialization: z.string().max(200).optional(),
    batch: z.string().min(1).max(50),
    skills: stringArray(3),
    avatarUrl: urlField('nullish'),
    ...memberSocialFieldsZod
}).strict();

export const updateMemberSchema = memberSchema.partial().strict();

export const updateLeadershipSchema = z.object({
    convenors: z.array(z.number()).max(2),
    coConvenors: z.array(z.number()).max(2),
    departmentHeads: z.record(z.number()).refine(
        (obj) => Object.keys(obj).length <= 20,
        { message: "departmentHeads cannot have more than 20 entries" }
    )
}).strict();
import mongoose from "mongoose";
import z from "zod";
import { addSingletonLock, hideMongoInternals } from "../utils/schemaPlugins.js";
import { urlField } from "../utils/zodHelpers.js";

export const SOCIAL_KEYS = ["github", "instagram", "linkedin", "x", "discord", "whatsapp"];

const socialEntryMongoose = {
    url: { type: String, default: '' },
    showOnSidebar: { type: Boolean, default: false },
    showOnFooter: { type: Boolean, default: false },
};

const socialEntryZod = z.object({
    url: urlField(),
    showOnSidebar: z.boolean().optional(),
    showOnFooter: z.boolean().optional(),
});

const socialSchemaFields = SOCIAL_KEYS.reduce((fields, key) => {
    fields[key] = socialEntryMongoose;
    return fields;
}, {});

const contactInfoSchema = new mongoose.Schema({
    email: { type: String },
    phone: { type: String },
    youtube: { type: String },
    ...socialSchemaFields
}, {
    timestamps: true
});

addSingletonLock(contactInfoSchema, "globalConfig");
hideMongoInternals(contactInfoSchema);

export default mongoose.model('ContactInfo', contactInfoSchema, 'contactinfos');

const socialZodFields = SOCIAL_KEYS.reduce((fields, key) => {
    fields[key] = socialEntryZod.optional();
    return fields;
}, {});

export const updateContactInfoSchema = z.object({
    email: z.string().max(254).email().optional().or(z.literal('')),
    phone: z.string().max(20).optional().or(z.literal('')),
    youtube: urlField(),
    ...socialZodFields
}).strict();
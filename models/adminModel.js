import mongoose from "mongoose";
import z from "zod";
import { hideMongoInternals } from "#/utils/schemaPlugins.js";
import { hashPassword } from "#/utils/password.js";

const adminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false }, // hashed by the pre-save hook below
    email: { type: String, required: true },
    otp: { type: String, select: false },
    otpExpiry: { type: Date },
    tokenVersion: { type: Number, default: 0 }
}, {
    timestamps: true
});

adminSchema.pre("save", async function hashSensitiveFields() {
    if (this.isModified("password")) {
        this.password = await hashPassword(this.password);
    }
    if (this.isModified("otp") && this.otp) {
        this.otp = await hashPassword(this.otp);
    }
});

hideMongoInternals(adminSchema);

export default mongoose.model('Admin', adminSchema, 'admins');

export const loginSchema = z.object({
    username: z.string().min(1).max(100),
    password: z.string().min(1).max(128)
}).strict();

export const updatePasswordSchema = z.object({
    currentPassword: z.string().min(1).max(128),
    newPassword: z.string().min(1).max(128),
    otp: z.string().min(1).max(10)
}).strict();
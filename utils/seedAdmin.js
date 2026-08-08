import Admin from "../models/adminModel.js";
import { isPasswordStrongEnough, PASSWORD_MIN_LENGTH } from "./passwordStrength.js";

const DEFAULT_ADMIN_USERNAME = "admin";
const DEFAULT_ADMIN_EMAIL = "codingclub@satiengg.in";

export async function seedAdmin() {
    const existingCount = await Admin.countDocuments();
    if (existingCount > 0) {
        return; // already seeded
    }

    const password = process.env.ADMIN_PASSWORD;
    if (!password) {
        console.error(
            "FATAL: No admin account exists and ADMIN_PASSWORD is not set. " +
            "Cannot seed the initial admin. Set ADMIN_PASSWORD in your " +
            "environment and redeploy."
        );
        return;
    }

    if (!isPasswordStrongEnough(password)) {
        console.warn(
            `WARNING: ADMIN_PASSWORD does not meet the app's password-strength ` +
            `bar (min ${PASSWORD_MIN_LENGTH} chars, mixed case/number/symbol). ` +
            "Seeding anyway — change it soon via Settings once logged in."
        );
    }

    const email = process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL;

    try {
        await Admin.create({
            username: DEFAULT_ADMIN_USERNAME,
            password, // hashed by adminSchema's pre-save hook
            email,
        });
        console.log(`Seeded initial admin account (username: "${DEFAULT_ADMIN_USERNAME}").`);
    } catch (err) {
        if (err.code === 11000) {
            console.log("Admin account was already seeded by another process — skipping.");
            return;
        }
        console.error("Failed to seed initial admin account:", err);
    }
}
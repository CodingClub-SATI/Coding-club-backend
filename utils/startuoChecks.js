import { isPasswordStrongEnough, PASSWORD_MIN_LENGTH } from "./passwordStrength.js";

const REQUIRED_ENV_VARS = ["MONGO_URL"];

export function runStartupChecks() {
    const missingRequired = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
    if (missingRequired.length > 0) {
        console.error(
            `FATAL: missing required environment variable(s): ${missingRequired.join(", ")}. ` +
            "See .env.example."
        );
        process.exit(1);
    }

    if (!process.env.JWT_SECRET) {
        console.warn(
            "WARNING: JWT_SECRET is not set. The server does not fall back to a " +
            "default secret - admin login will fail (500) and any existing " +
            "admin_token cookie will be treated as unauthenticated until it is set."
        );
    }
    if (!process.env.ADMIN_PASSWORD) {
        console.warn(
            "WARNING: ADMIN_PASSWORD is not set. If no admin account exists yet, " +
            "the server will refuse to start until it is set (see below)."
        );
    } else if (!isPasswordStrongEnough(process.env.ADMIN_PASSWORD)) {
        console.warn(
            `WARNING: ADMIN_PASSWORD does not meet the app's own password-strength ` +
            `bar (min ${PASSWORD_MIN_LENGTH} characters, mixing case/numbers/symbols) ` +
            "enforced on later changes via POST /auth/password/otp. It will still " +
            "be used to seed the initial admin account, but consider setting a " +
            "stronger one before deploying to production."
        );
    }
    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
        console.warn(
            "WARNING: SMTP_EMAIL/SMTP_PASSWORD are not fully set. The admin " +
            "password-change OTP email will fail to send."
        );
    }
}
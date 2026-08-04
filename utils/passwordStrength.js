// Mirrors the scoring in frontend `src/features/setting/constants.js`
// (getPasswordStrength) so the server enforces the same bar the UI
// advertises, rather than trusting the client to have checked it.

export const PASSWORD_MIN_LENGTH = 8;
export const MIN_STRENGTH_SCORE = 3;

export function getPasswordStrength(password) {
    if (!password) return { score: 0 };

    let score = 0;
    if (password.length >= PASSWORD_MIN_LENGTH) score += 1;
    if (password.length >= 12) score += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    return { score };
}

export function isPasswordStrongEnough(password) {
    if (typeof password !== "string" || password.length < PASSWORD_MIN_LENGTH) return false;
    return getPasswordStrength(password).score >= MIN_STRENGTH_SCORE;
}

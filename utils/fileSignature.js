const SIGNATURES = [
    { mime: "image/jpeg", bytes: [0xFF, 0xD8, 0xFF] },
    { mime: "image/png", bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
    { mime: "image/gif", bytes: [0x47, 0x49, 0x46, 0x38] }, // "GIF8"
    // WEBP: "RIFF" .... "WEBP" — two separate matches, not contiguous bytes.
];

export function matchesImageSignature(buffer, mimetype) {
    if (!buffer || buffer.length < 12) return false;

    if (mimetype === "image/webp") {
        const riff = buffer.subarray(0, 4).toString("ascii");
        const webp = buffer.subarray(8, 12).toString("ascii");
        return riff === "RIFF" && webp === "WEBP";
    }

    const signature = SIGNATURES.find((s) => s.mime === mimetype);
    if (!signature) return false;

    return signature.bytes.every((byte, i) => buffer[i] === byte);
}

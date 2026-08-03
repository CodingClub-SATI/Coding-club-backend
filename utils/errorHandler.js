export function handleControllerError(error, res, { context, duplicateMessage, fallbackMessage } = {}) {
    if (error.name === "ValidationError") {
        return res.status(400).json({ message: error.message });
    }
    if (error.name === "CastError") {
        return res.status(400).json({ message: `Invalid value provided for '${error.path}'.` });
    }
    if (error.code === 11000) {
        return res.status(409).json({ message: duplicateMessage || "Resource already exists." });
    }

    console.error(context ? `${context}:` : "Unhandled controller error:", error);
    return res.status(500).json({ message: fallbackMessage || "Internal Server Error" });
}
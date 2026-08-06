import { Catbox } from "node-catbox";
import { Readable } from "node:stream";
import { handleControllerError } from "../utils/errorHandler.js";

const catbox = new Catbox(process.env.CATBOX_USERHASH);

function extractCatboxFilename(imageUrl) {
    return imageUrl.substring(imageUrl.lastIndexOf("/") + 1);
}

export const uploadImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "No image uploaded.",
            });
        }
        const stream = Readable.from([req.file.buffer]);
        const imageUrl = await catbox.uploadFileStream({
            stream,
            filename: req.file.originalname,
        });
        req.imageUrl = imageUrl;
        next();
    } catch (err) {
        console.error("Catbox upload failed:", err.response?.data || err);
        return handleControllerError(err, res, { context: "Error uploading image to Catbox" });
    }
};

export const removeImage = async (req, res, next) => {
    try {
        await catbox.deleteFiles({
            files: [extractCatboxFilename(req.imageUrl)],
        });
        next();
    } catch (err) {
        return handleControllerError(err, res, { context: "Error deleting image from Catbox" });
    }
};

export function deleteImagesFromCatboxBestEffort(imageUrls) {
    const files = [...new Set((imageUrls || []).filter(Boolean))].map(extractCatboxFilename);
    if (files.length === 0) return;

    catbox
        .deleteFiles({ files })
        .catch((err) => {
            console.error(
                "Failed to delete image(s) from Catbox (non-fatal):",
                err.response?.data || err.message
            );
        });
}

export function deleteImageFromCatboxBestEffort(imageUrl) {
    deleteImagesFromCatboxBestEffort([imageUrl]);
}
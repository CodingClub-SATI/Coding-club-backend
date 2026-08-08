import express from "express";
import multer from "multer";
import { uploadImage, removeImage } from "../controllers/catboxImageController.js";
import { attachAdminStatus, requireAdmin } from "../middlewares/requireAdmin.js";
import { validateEventAsset } from "../middlewares/parameterValidate.js";
import { matchesImageSignature } from "../utils/fileSignature.js";
import {
    getEventImageString, captureExistingEventImage, updateEventImageString, removeEventImageString
} from "../middlewares/updateImageString.js";

const uploadRoute = express.Router();

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            return cb(new Error("INVALID_FILE_TYPE"));
        }
        cb(null, true);
    }
});

function handleImageUpload(req, res, next) {
    upload.single("image")(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({ message: "Image must be smaller than 2MB." });
            }
            if (err.message === "INVALID_FILE_TYPE") {
                return res.status(400).json({ message: "Only JPEG, PNG, WEBP, and GIF images are allowed." });
            }
            console.error("Upload error:", err);
            return res.status(400).json({ message: "Upload failed." });
        }

        if (req.file && !matchesImageSignature(req.file.buffer, req.file.mimetype)) {
            return res.status(400).json({ message: "File content does not match a supported image format." });
        }

        next();
    });
}

uploadRoute.post(
    "/upload",
    attachAdminStatus,
    requireAdmin,
    handleImageUpload,
    uploadImage,
    (req, res) => {
        return res.status(200).json({ url: req.imageUrl });
    }
);

uploadRoute.delete(
    "/upload",
    attachAdminStatus,
    requireAdmin,
    (req, res, next) => {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ message: "Image URL is required for deletion." });
        }
        if (!url.startsWith("https://files.catbox.moe/")) {
            return res.status(400).json({ message: "Only Catbox file URLs can be deleted." });
        }
        req.imageUrl = url;
        next();
    },
    removeImage,
    (req, res) => {
        return res.status(200).json({ message: "Image successfully deleted from Catbox." });
    }
);

uploadRoute.post(
    "/upload/event/:id/:asset",
    attachAdminStatus,
    requireAdmin,
    validateEventAsset,
    captureExistingEventImage,
    handleImageUpload,
    uploadImage,
    updateEventImageString
);

uploadRoute.delete(
    "/upload/event/:id/:asset",
    attachAdminStatus,
    requireAdmin,
    validateEventAsset,
    getEventImageString,
    removeEventImageString
);

export default uploadRoute;
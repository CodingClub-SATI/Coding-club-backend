import express from "express";
import multer from "multer";
import { uploadImage, removeImage } from "../controllers/catboxImageController.js";
import { verifyMemberExistence } from "../middlewares/userExistence.js";
import { updateImageString, removeImageString, getUserImage } from "../middlewares/updateImageString.js";

const uploadRoute = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 2*1024*1024
    }
});

uploadRoute.post("/upload/:email", verifyMemberExistence, upload.single("image"), uploadImage, updateImageString);
uploadRoute.delete("/upload/:email", getUserImage, removeImage, removeImageString);

export default uploadRoute;
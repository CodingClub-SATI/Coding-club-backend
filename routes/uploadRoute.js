import express from "express";
import multer from "multer";
import { uploadImage } from "../controllers/catboxImageController.js";
import { verifyMemberExistence } from "../middlewares/userExistence.js";
import { updateImageString, removeImageString } from "../middlewares/updateImageString.js";

const uploadRoute = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 2*1024*1024
    }
});

uploadRoute.post("/upload/:email", verifyMemberExistence, upload.single("image"), uploadImage, updateImageString);
uploadRoute.delete("/upload/:email", verifyMemberExistence, removeImageString);

export default uploadRoute;
import express from "express";
import multer from "multer";
import { uploadImage } from "../controllers/uploadImageController.js";
import { verifyMemberExistence } from "../middlewares/userExistence.js";

const uploadRoute = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 2*1024*1024
    }
});

uploadRoute.post("/upload/:email", verifyMemberExistence, upload.single("image"), uploadImage);

export default uploadRoute;
import express from "express";
import multer from "multer";
import { uploadImage, removeImage } from "../controllers/catboxImageController.js";
import { verifyMemberExistence, verifyEventExistence } from "../middlewares/checkExistence.js";
import { updateMemberImageString, removeMemberImageString, getMemberImageString } from "../middlewares/updateImageString.js";
import { updateEventImageString, removeEventImageString, getEventImageString } from "../middlewares/updateImageString.js";
import { validateEventAsset } from "../middlewares/paramterValidate.js";

const uploadRoute = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 2*1024*1024
    }
});

uploadRoute.post("/upload/member/:email", verifyMemberExistence, upload.single("avatar"), uploadImage, updateMemberImageString);
uploadRoute.delete("/upload/member/:email", getMemberImageString, removeImage, removeMemberImageString);


uploadRoute.post("/upload/event/:id/:asset", validateEventAsset, verifyEventExistence, upload.single("image"), uploadImage, updateEventImageString);
uploadRoute.delete("/upload/event/:id/:asset", validateEventAsset, getEventImageString, removeImage, removeEventImageString);

export default uploadRoute;


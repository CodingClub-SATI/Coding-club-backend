import express from "express";
import multer from "multer";
import { uploadImage, removeImage, uploadImageArray, deleteExistingImages } from "../controllers/catboxImageController.js";
import { verifyMemberExistence, verifyEventExistence, verifyAlbumExistence } from "../middlewares/checkExistence.js";
import { updateMemberImageString, removeMemberImageString, getMemberImageString } from "../middlewares/updateImageString.js";
import { updateEventImageString, removeEventImageString, getEventImageString } from "../middlewares/updateImageString.js";
import { validateEventAsset } from "../middlewares/paramterValidate.js";
import { fetchSingleAlbum, updateAlbum } from "../controllers/albumController.js";
import { verifyAdmin } from "../middlewares/primitiveAuth.js";

const uploadRoute = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 2*1024*1024
    }
});

uploadRoute.post("/upload/member/:email", verifyAdmin, verifyMemberExistence, upload.single("avatar"), uploadImage, updateMemberImageString);
uploadRoute.delete("/upload/member/:email", verifyAdmin, getMemberImageString, removeImage, removeMemberImageString);

uploadRoute.post("/upload/event/:id/:asset", verifyAdmin, validateEventAsset, verifyEventExistence, upload.single("image"), uploadImage, updateEventImageString);
uploadRoute.delete("/upload/event/:id/:asset", verifyAdmin, validateEventAsset, getEventImageString, removeImage, removeEventImageString);

uploadRoute.post("/gallery/:id/photos", verifyAdmin, fetchSingleAlbum, upload.array("photo"), uploadImageArray, deleteExistingImages, updateAlbum);
export default uploadRoute;
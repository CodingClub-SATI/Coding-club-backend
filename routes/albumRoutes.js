import express from "express";
import multer from "multer";
import { create, fetch, update, remove, fetchSingleAlbum } from "../controllers/albumController.js";
import { removeImageArray } from "../controllers/catboxImageController.js" 
import { validateBody } from "../middlewares/schemaValidate.js";
import { updateAlbumSchema } from "../models/albumModel.js";
import { verifyAlbumExistence } from "../middlewares/checkExistence.js";

const route = express.Router();
const uploadRoute = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 2*1024*1024
    }
});route.post("/gallery", create);
route.get("/gallery", fetch);
route.put("/gallery/:id", validateBody(updateAlbumSchema), update );
route.delete("/gallery/:id", fetchSingleAlbum, removeImageArray, remove);

export default route;
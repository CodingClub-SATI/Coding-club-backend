import express from "express";
import multer from "multer";
import { create, fetch, update, remove, fetchSingleAlbum } from "../controllers/albumController.js";
import { removeImageArray } from "../controllers/catboxImageController.js" 
import { validateBody } from "../middlewares/schemaValidate.js";
import { updateAlbumSchema } from "../models/albumModel.js";
import { verifyAlbumExistence } from "../middlewares/checkExistence.js";
import { verifyAdmin } from "../middlewares/primitiveAuth.js";

const route = express.Router();
const uploadRoute = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 2*1024*1024
    }
});route.post("/gallery", verifyAdmin, create);
route.get("/gallery", fetch);
route.put("/gallery/:id", verifyAdmin, validateBody(updateAlbumSchema), update );
route.delete("/gallery/:id", verifyAdmin, fetchSingleAlbum, removeImageArray, remove);

export default route;
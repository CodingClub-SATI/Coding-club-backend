import express from "express";
import {
    createAlbum, fetchAlbums, fetchAlbum, updateAlbum, removeAlbum, getHighlights
} from "../controllers/albumController.js";
import { addPhotos, removePhoto, updatePhoto } from "../controllers/photoController.js";
import { validateBody } from "../middlewares/schemaValidate.js";
import { attachAdminStatus, requireAdmin } from "../middlewares/requireAdmin.js";
import { createAlbumSchema, updateAlbumSchema, addPhotosSchema, updatePhotoSchema } from "../models/galleryModel.js";

const route = express.Router();

route.get("/gallery", attachAdminStatus, fetchAlbums);
route.get("/gallery/highlights", attachAdminStatus, getHighlights);
route.get("/gallery/:albumId", attachAdminStatus, fetchAlbum);
route.post("/gallery", attachAdminStatus, requireAdmin, validateBody(createAlbumSchema), createAlbum);
route.put("/gallery/:albumId", attachAdminStatus, requireAdmin, validateBody(updateAlbumSchema), updateAlbum);
route.delete("/gallery/:albumId", attachAdminStatus, requireAdmin, removeAlbum);

route.post("/gallery/:albumId/photos", attachAdminStatus, requireAdmin, validateBody(addPhotosSchema), addPhotos);
route.put("/gallery/:albumId/photos/:photoId", attachAdminStatus, requireAdmin, validateBody(updatePhotoSchema), updatePhoto);
route.delete("/gallery/:albumId/photos/:photoId", attachAdminStatus, requireAdmin, removePhoto);

export default route;
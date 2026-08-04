import Album, { MAX_FEATURED_PER_ALBUM } from "../models/galleryModel.js";
import { generateId } from "../utils/generateId.js";
import { handleControllerError } from "../utils/errorHandler.js";
import { deleteImageFromCatboxBestEffort } from "./catboxImageController.js";

export const addPhotos = async (req, res) => {
    try {
        const id = req.params.albumId;
        const album = await Album.findOne({ id }).exec();
        if (!album) {
            return res.status(404).json({ message: "Album does not exist" });
        }

        const newPhotos = req.body.photos.map((photo) => ({ ...photo, id: generateId() }));

        const incomingFeaturedCount = newPhotos.filter((photo) => photo.featured).length;
        if (incomingFeaturedCount > 0) {
            const currentlyFeatured = album.images.filter((img) => img.featured).length;
            if (currentlyFeatured + incomingFeaturedCount > MAX_FEATURED_PER_ALBUM) {
                return res.status(409).json({
                    message: `Featured cap reached (${MAX_FEATURED_PER_ALBUM}). Album already has ${currentlyFeatured} featured photo(s).`,
                });
            }
        }

        album.images.push(...newPhotos);
        const savedAlbum = await album.save();
        return res.status(201).json(savedAlbum);
    } catch (error) {
        return handleControllerError(error, res, {
            context: "Error adding photos",
            duplicateMessage: "Could not save photo(s) due to an id conflict. Please try again.",
        });
    }
};

export const removePhoto = async (req, res) => {
    try {
        const { albumId, photoId } = req.params;
        const album = await Album.findOne({ id: albumId }).exec();
        if (!album) {
            return res.status(404).json({ message: "Album or photo not found" });
        }
        const photo = album.images.find((img) => String(img.id) === String(photoId));
        if (!photo) {
            return res.status(404).json({ message: "Album or photo not found" });
        }
        album.images = album.images.filter((img) => String(img.id) !== String(photoId));
        if (album.cover === photo.src) {
            album.cover = "";
        }
        await album.save();

        deleteImageFromCatboxBestEffort(photo.src);

        return res.status(200).json({ message: "Photo removed" });
    } catch (error) {
        return handleControllerError(error, res, { context: "Error removing photo" });
    }
};

export const updatePhoto = async (req, res) => {
    try {
        const { albumId, photoId } = req.params;
        const album = await Album.findOne({ id: albumId }).exec();
        if (!album) {
            return res.status(404).json({ message: "Album or photo not found" });
        }
        const photo = album.images.find((img) => String(img.id) === String(photoId));
        if (!photo) {
            return res.status(404).json({ message: "Album or photo not found" });
        }

        const { featured } = req.body;
        if (featured && !photo.featured) {
            const currentlyFeatured = album.images.filter((img) => img.featured).length;
            if (currentlyFeatured >= MAX_FEATURED_PER_ALBUM) {
                return res.status(409).json({ message: `Featured cap reached (${MAX_FEATURED_PER_ALBUM})` });
            }
        }

        const previousSrc = photo.src;
        const wasCover = album.cover === previousSrc;
        Object.assign(photo, req.body);
        album.markModified('images');

        if (req.body.src !== undefined && previousSrc !== photo.src && wasCover) {
            album.cover = photo.src;
        }

        await album.save();

        if (req.body.src !== undefined && previousSrc !== photo.src) {
            deleteImageFromCatboxBestEffort(previousSrc);
        }

        return res.status(200).json(photo);
    } catch (error) {
        return handleControllerError(error, res, { context: "Error updating photo" });
    }
};

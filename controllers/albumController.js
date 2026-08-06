import Album from "../models/galleryModel.js";
import { generateId } from "../utils/generateId.js";
import { paginatedFind, escapeRegex, asString } from "../utils/queryHelpers.js";
import { handleControllerError } from "../utils/errorHandler.js";
import { deleteImageFromCatboxBestEffort, deleteImagesFromCatboxBestEffort } from "./catboxImageController.js";
import { createHandler, updateHandler, removeHandler } from "../utils/crudHandlers.js";

export const createAlbum = createHandler(Album, {
    context: "Error creating album",
    duplicateMessage: "Album already exists",
    validate: (req) => {
        if (req.body.cover) {
            return {
                status: 400,
                message: "Cover must be a photo already in this album. Add photos first, then set the cover.",
            };
        }
        return null;
    },
    buildData: (req) => ({ ...req.body, id: generateId(), images: [] }),
});

export const fetchAlbums = async (req, res) => {
    try {
        const wantsArchived = req.query.includeArchived === "true";
        const filter = wantsArchived && req.isAdmin ? {} : { archived: { $ne: true } };

        const search = asString(req.query.search);
        if (search) {
            filter.title = { $regex: escapeRegex(search), $options: "i" };
        }

        const query = Album.find(filter);
        const result = await paginatedFind(query, Album, filter, req.query);
        return res.json(result);
    } catch (error) {
        return handleControllerError(error, res, { context: "Error fetching albums" });
    }
};

export const fetchAlbum = async (req, res) => {
    try {
        const id = req.params.albumId;
        const filter = req.isAdmin ? { id } : { id, archived: { $ne: true } };
        const album = await Album.findOne(filter).exec();
        if (!album) {
            return res.status(404).json({ message: "Album does not exist" });
        }
        return res.status(200).json(album);
    } catch (error) {
        return handleControllerError(error, res, { context: "Error fetching album" });
    }
};

const HIGHLIGHT_LIMIT = 12;

export const getHighlights = async (req, res) => {
    try {
        const wantsArchived = req.query.includeArchived === "true";
        const archivedMatch = wantsArchived && req.isAdmin ? {} : { archived: { $ne: true } };

        const featured = await Album.aggregate([
            { $match: archivedMatch },
            { $unwind: "$images" },
            { $match: { "images.featured": true } },
            { $limit: HIGHLIGHT_LIMIT },
            {
                $project: {
                    _id: 0,
                    albumId: "$id",
                    albumTitle: "$title",
                    id: "$images.id",
                    src: "$images.src",
                    caption: "$images.caption",
                },
            },
        ]).exec();

        if (featured.length > 0) {
            return res.json(featured);
        }


        const fallback = await Album.aggregate([
            { $match: { ...archivedMatch, "images.0": { $exists: true } } },
            { $limit: HIGHLIGHT_LIMIT },
            {
                $project: {
                    _id: 0,
                    albumId: "$id",
                    albumTitle: "$title",
                    firstImage: { $arrayElemAt: ["$images", 0] },
                },
            },
            {
                $project: {
                    albumId: 1,
                    albumTitle: 1,
                    id: "$firstImage.id",
                    src: "$firstImage.src",
                    caption: "$firstImage.caption",
                },
            },
        ]).exec();

        return res.json(fallback);
    } catch (error) {
        return handleControllerError(error, res, { context: "Error fetching gallery highlights" });
    }
};

export const updateAlbum = updateHandler(Album, {
    paramName: "albumId",
    notFoundMessage: "Album does not exist",
    context: "Error updating album",
    duplicateMessage: "Album already exists",
    validate: async (req) => {
        if (!req.body.cover) return null;
        const album = await Album.findOne({ id: req.params.albumId }).select("images.src").lean().exec();
        if (!album) return null; // let the update proceed to its normal 404
        const matchesExistingPhoto = album.images.some((img) => img.src === req.body.cover);
        if (!matchesExistingPhoto) {
            return {
                status: 400,
                message: "Cover must be a photo already in this album.",
            };
        }
        return null;
    },
    beforeUpdate: (req) => (
        req.body.cover !== undefined
            ? Album.findOne({ id: req.params.albumId }).select("cover").lean().exec()
            : null
    ),
    afterUpdate: (updated, req, previousAlbum) => {
        if (previousAlbum?.cover && previousAlbum.cover !== req.body.cover) {
            deleteImageFromCatboxBestEffort(previousAlbum.cover);
        }
    },
});

export const removeAlbum = removeHandler(Album, {
    paramName: "albumId",
    notFoundMessage: "Album does not exist",
    context: "Error deleting album",
    onRemoved: (removed) => {
        deleteImagesFromCatboxBestEffort([removed.cover, ...removed.images.map((img) => img.src)]);
    },
});
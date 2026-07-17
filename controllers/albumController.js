import { Album, updateAlbumSchema } from "../models/albumModel.js";

export const create = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ message: "Album ID is required" });
        }
        const albumExist = await Album.findOne({ id }).exec();
        if (albumExist) {
            return res.status(400).json({ message: "Album already exists" });
        }
        const album = new Album(req.body);
        const savedAlbum = await Album.save();
        console.log("saved album", id);
        return res.status(201).json(savedAlbum);
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({ error: error.message });
        }
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export const fetch = async (req, res) => {
    try {
        const all_albums_list = await Album.find().exec();
        return res.status(200).json(all_albums_list);
        } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export const update = async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) {
            return res.status(400).json({ message: "Album ID is required" });
        }
        req.body.id = id;
        const updatedAlbum = await updateAlbumSchema.findOneAndUpdate(
            { id },
            req.body,
            {
                returnDocument: "after",
                runValidators: true
            }
        ).exec();
        //To be removed. since album existence is verified by previous controller
        if (!updatedAlbum) {
            return res.status(404).json({ message: "Album does not exist" });
        }
        return res.status(200).json(updatedAlbum);
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({ error: error.message });
        }
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export const remove = async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) {
            return res.status(400).json({ message: "Album ID is required" });
        }
        const removedAlbum = await Album.findOneAndDelete({
            id
        }).exec();
        if (!removedAlbum) {
            return res.status(404).json({ message: "Album does not exist" });
        } //defaults to true as existence was previously validated
        return res.status(200).json(removedAlbum);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


export const fetchSingleAlbum = async (req, res, next) => {
    try {
        const id = req.params.id;
        if (!id) {
            return res.status(400).json({ message: "Album ID is required" });
        }
        const album = await Album.findOne({ id }).exec();
        if (!album) {
            return res.status(404).json({ message: "Album does not exist" });
        }
        req.asset = album;
        next();
        //return res.status(200).json(album);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export const updateAlbum = async (req, res) => {
    try {
        const album = req.asset;
        const { photos } = req.body;
        const imageMap = new Map(
            album.images.map(image => [image.id, image])
        );
        photos.forEach((photo, index) => {
            const image = imageMap.get(photo.id);

            image.src = req.uploadImages[index];
            image.caption = photo.caption;
            image.featured = photo.featured;
        });
        await album.save();
        return res.status(201).json(album);
    } catch (err) {
        return res.status(500).json({
            message: err.message,
        });
    }
};
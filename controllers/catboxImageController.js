import FormData from "form-data";
import { Catbox } from 'node-catbox';
import { Readable } from "node:stream";
import { Member, updateMemberSchema } from "../models/memberModel.js";
//import { prependOnceListener } from "node:cluster";

export const uploadImage = async (req, res, next) => {
    const catbox = new Catbox(process.env.CATBOX_USERHASH);
    try{
        if (!req.file) {
            return res.status(400).json({
                message: "No image uploaded.",
            });
        }
        console.log(req.file);
        const stream = Readable.from([req.file.buffer]);
        console.log("Before upload");
        const imageUrl = await catbox.uploadFileStream({
            stream,
            filename: req.file.originalname,
        });
        console.log("After upload");
        req.imageUrl = imageUrl;
        next();
    }
    /*
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "No image uploaded.",
            });
        }
        const form = new FormData();
        form.append("reqtype", "fileupload");
        form.append("userhash", process.env.CATBOX_USERHASH);
        form.append("fileToUpload", req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
        });
        const { data } = await axios.post(
            "https://catbox.moe/user/api.php",
            form,
            {
                headers: form.getHeaders(),
            }
        );
        const imageUrl = data.trim();
        //Will make this generic in future for events+members uploading.
        //Currently I can't be arsed to make this for both.
        //Fuck it, we ball
        req.imageUrl = imageUrl;
        return res.status(200).json({
            imageUrl,
            member,
        });
    
    } */catch (err) {
        console.error(err.response?.data || err);
        return res.status(500).json({
            message: "Failed to upload image.",
        });
    }
};

export const removeImage = async (req, res, next) => {
    try {
        const catbox = new Catbox(process.env.CATBOX_USERHASH);
        const imageUrl = req.imageUrl;
        //url are of the form https://files.catbox.moe/atzkoi.jpg
        //node-catbox wants the "atzkoi.jpg"
        const filename = imageUrl.substring(imageUrl.lastIndexOf("/") + 1);
        await catbox.deleteFiles({
            files: [filename],
        });
        next();
    } catch (err) {
        return res.status(500).json({
            message: err.message,
        });
    }
}

export const removeImageArray = async (req, res, next) => {
    try {
        const catbox = new Catbox(process.env.CATBOX_USERHASH);
        const assets = req.asset; //JS array of file urls
        //url are of the form https://files.catbox.moe/atzkoi.jpg
        //node-catbox wants the "atzkoi.jpg"
        const filenames = req.asset.map((url)=>
            url.substring(url.lastIndexOf("/")+1)
        )
        await catbox.deleteFiles({
            files: filenames,
        });
        next();
    } catch (err) {
        return res.status(500).json({
            message: err.message,
        });
    }
}

export const uploadImageArray = async (req, res, next) => {
    try{
        const catbox = new Catbox(process.env.CATBOX_USERHASH);
        if (!req.files) {
            return res.status(400).json({
                message: "No image(s) uploaded.",
            });
        }
        req.uploadedImages = await Promise.all(
            req.files.map(async (file) => {
                const stream = Readable.from([file.buffer]);

                return await catbox.uploadFileStream({
                    stream,
                    filename: file.originalname,
                });
            })
        );
        next();
    } catch (err) {
        return res.status(500).json({
            message: err.message,
        });
    }
}

export const deleteExistingImages = async (req, res, next) => {
    try {
        const album = req.asset;
        const { photos } = req.body;
        if (!Array.isArray(photos)) {
            return res.status(400).json({
                message: "'photos' must be an array.",
            });
        }
        if (!req.files || req.files.length !== photos.length) {
            return res.status(400).json({
                message: "Number of uploaded files must match the number of photos.",
            });
        }
        const replaceIds = photos.map(photo => photo.id);
        if (new Set(replaceIds).size !== replaceIds.length) {
            return res.status(400).json({
                message: "Duplicate photo ids are not allowed.",
            });
        }
        const albumImageMap = new Map(
            album.images.map(image => [image.id, image])
        );
        for (const id of replaceIds) {
            if (!albumImageMap.has(id)) {
                return res.status(400).json({
                    message: `Photo with id ${id} does not exist in the album.`,
                });
            }
        }
        const filenames = replaceIds.map(id => {
            const image = albumImageMap.get(id);
            return image.src.substring(image.src.lastIndexOf("/") + 1);
        });
        if (filenames.length > 0) {
            const catbox = new Catbox(process.env.CATBOX_USERHASH);
            await catbox.deleteFiles({
                files: filenames,
            });
        }
        next();
    } catch (err) {
        return res.status(500).json({
            message: err.message,
        });
    }
};
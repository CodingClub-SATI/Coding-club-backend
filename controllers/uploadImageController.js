import axios from "axios";
import FormData from "form-data";
import { Member, updateMemberSchema } from "../models/memberModel.js";

export const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
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
        const member = await Member.findOneAndUpdate(
            { email: req.params.email },
            {
                image: imageUrl,
            },
            {
                returnDocument: 'after',
                runValidators: true,
            }
        );
        return res.status(200).json({
            imageUrl,
            member,
        });
    } catch (err) {
        console.error(err.response?.data || err);
        return res.status(500).json({
            message: "Failed to upload image.",
        });
    }
};

export const deleteImage = async (req, res) => {
    
}
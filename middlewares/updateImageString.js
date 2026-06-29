import { Member } from "../models/memberModel.js"
import { updateMemberSchema } from "../models/memberModel.js";

export const updateImageString = async (req, res, next) => {
    try {
            const member = await Member.findOneAndUpdate(
            { email: req.params.email },
            {
                image: req.imageUrl,
            },
            {
                returnDocument: 'after',
                runValidators: true,
            }
        );
        return res.status(200).json({
            member,
        });
    } catch (err) {
        return res.status(500).json({
            message: err.message,
        });
    }
}

export const removeImageString = async (req, res, next) => {
    try {
            const member = await Member.findOneAndUpdate(
            { email: req.params.email },
            {
                image: null,
            },
            {
                returnDocument: 'after',
                runValidators: true,
            }
        );
        return res.status(200).json({
            member,
        });
    } catch (err) {
        return res.status(500).json({
            message: err.message,
        });
    }
}

export const getUserImage = async (req, res, next) => {
    try {
        const member = await Member.findOne({ email: req.params.email });
        if (!member) {
            return res.status(404).json({
                message: "Member not found",
            });
        }
        req.imageUrl = member.image;
        console.log("getUserImage successfully ran");
        next();
    } catch (err) {
        return res.status(500).json({
            message: err.message,
        });
    }
};
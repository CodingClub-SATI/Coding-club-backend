import { Member } from "../models/memberModel.js";
import Event from "../models/eventModel.js";
import { updateMemberSchema } from "../models/memberModel.js";

export const updateMemberImageString = async (req, res) => {
    try {
        const member = await updateMemberSchema.findOneAndUpdate(
            { email: req.params.email },
            {
                image: req.imageUrl,
            },
            {
                returnDocument: "after",
                runValidators: true,
            }
        );
        return res.status(200).json({ member });
    } catch (err) {
        return res.status(500).json({
            message: err.message,
        });
    }
};

export const removeMemberImageString = async (req, res) => {
    try {
        const member = await Member.findOneAndUpdate(
            { email: req.params.email },
            {
                image: null,
            },
            {
                returnDocument: "after",
                runValidators: true,
            }
        );
        return res.status(200).json({ member });
    } catch (err) {
        return res.status(500).json({
            message: err.message,
        });
    }
};

export const getMemberImageString = async (req, res, next) => {
    try {
        if (!req.params.email) {
            return res.status(400).json({
                message: "Email is required",
            });
        }
        const member = await Member.findOne({
            email: req.params.email,
        });
        if (!member) {
            return res.status(404).json({
                message: "Member not found",
            });
        }
        req.imageUrl = member.image;
        console.log("getMemberImageString successfully ran");
        next();
    } catch (err) {
        return res.status(500).json({
            message: err.message,
        });
    }
};

export const getEventImageString = async (req, res, next) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({
                message: "Event ID is required",
            });
        }
        const event = await Event.findOne({
            id: req.params.id,
        });
        if (!event) {
            return res.status(404).json({
                message: "Event not found",
            });
        }
        req.imageUrl = event[req.params.asset];
        console.log("getEventImageString successfully ran");
        next();
    } catch (err) {
        return res.status(500).json({
            message: err.message,
        });
    }
};

export const updateEventImageString = async (req, res) => {
    try {
        const event = await Event.findOneAndUpdate(
            { id: req.params.id },
            {
                [req.params.asset]: req.imageUrl,
            },
            {
                returnDocument: "after",
                runValidators: true,
            }
        );
        return res.status(200).json({ event });
    } catch (err) {
        return res.status(500).json({
            message: err.message,
        });
    }
};

export const removeEventImageString = async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({
                message: "Event ID is required",
            });
        }
        const event = await Event.findOneAndUpdate(
            { id: req.params.id },
            {
                [req.params.asset]: null,
            },
            {
                returnDocument: "after",
                runValidators: true,
            }
        );
        if (!event) {
            return res.status(404).json({
                message: "Event not found",
            });
        }
        return res.status(200).json({ event });
    } catch (err) {
        return res.status(500).json({
            message: err.message,
        });
    }
};
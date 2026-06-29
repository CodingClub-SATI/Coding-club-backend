import { Member } from "../models/memberModel.js";

export const verifyMemberExistence = async (req, res, next) => {
    try {
        const email = req.params.email;
        console.log(email)
        if (!email) {
            return res.status(400).json({message: "Email is required"});
        }
        const memberExists = await Member.exists({email});
        if (!memberExists) {
            return res.status(404).json({
                message:"Member not found",
            });
        }
        next();
    } catch (error) {
        res.status(500).json({
            message: "Could not verify member existence",
        });
    }
};
import { Member } from "../models/memberModel.js";

export const verifyMemberExistence = async (req, res, next) => {
    try {
        const { email } = req.params;
        const memberExists = await Member.exists({email});
        if (!memberExists) {
            return res.status(404).json({
                message:"Member not found",
            });
        }
        next();
    } catch (error) {
        next(error);
    }
};
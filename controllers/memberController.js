import { Member, updateMemberSchema } from "../models/memberModel.js"

export const create = async(req, res)=>{
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({message: "Email is required"});
        }
        const memberExist = await Member.findOne({ email }).exec();
        if (memberExist){
            return res.status(400).json({message: "member already exists"});
        }
        const member = new Member(req.body);
        const savedMember = await member.save();
        console.log("saved", email);
        return res.status(201).json(savedMember);
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        console.error(error);
        return res.status(500).json({error: "Internal Server Error"});
    }
}

export const fetch = async(req, res)=>{
    try {
        const members_list = await Member.find().exec();
        return res.status(200).json(members_list);
    } catch (error) {
        console.error(error);
        return res.status(500).json({error: "Internal Server Error"});
    }
}

export const update = async (req, res) => {
    try {
        const email = req.params.email;
        if (!email) {
            return res.status(400).json({message: "Email is required"});
        }
        req.body.email=email;
        const updatedMember = await Member.findOneAndUpdate(
            { email },
            req.body,
            {
                returnDocument: "after",
                runValidators: true
            }
        ).exec();
        if (!updatedMember) {
            return res.status(404).json({message: "Member does not exist"});
        }
        return res.status(200).json(updatedMember);
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        console.error(error);
        return res.status(500).json({error: "Internal Server Error"});
    }
};

export const remove = async (req, res) => {
    try {
        const email = req.params.email;
        if (!email) {
            return res.status(400).json({message: "Email is required"});
        }
        const removedMember = await Member.findOneAndDelete({
            "email": email
        }).exec();
        if (!removedMember) {
            return res.status(404).json({message: "Member does not exist"});
        }
        return res.status(200).json(removedMember);
    } catch (error) {
        console.error(error);
        return res.status(500).json({error: "Internal Server Error"});
    }
};
import Member from "../models/memberModel.js"

export const create = async(req, res)=>{
    try {
        const email = req.params.email;
        if (!email) {
            return res.status(400).json({message: "Email is required"});
        }
        const memberExist = await Member.findOne({ email });
        if (memberExist){
            return res.status(400).json({message: "member already exists"});
        }
        const member = new Member({...req.body, email});
        const savedMember = await member.save();
        console.log("saved", email);
        return res.status(201).json(savedMember);
    } catch (error) {
        return res.status(500).json({error: "Internal Server Error"});
    }
}

export const fetch = async(req, res)=>{
    try {
        const members_list = await Member.find();
        return res.json(members_list);
    } catch (error) {
        console.log(error);
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
        );
        if (!updatedMember) {
            return res.status(404).json({message: "Member does not exist"});
        }
        return res.status(200).json(updatedMember);
    } catch (error) {
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
        });
        if (!removedMember) {
            return res.status(404).json({message: "Member does not exist"});
        }
        return res.status(200).json(removedMember);
    } catch (error) {
        console.error(error);
        return res.status(500).json({error: "Internal Server Error"});
    }
};
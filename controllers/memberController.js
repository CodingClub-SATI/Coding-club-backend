import req from "express/lib/request.js";
import Member from "../models/memberModel.js"

export const create = async(req, res)=>{
    try {
        const member = new Member(req.body);
        const email = member.socials?.email;
        const memberExist = await Member.findOne({"socials.email":email});
        if (memberExist){
            return res.status(400).json({message: "member already exists"});
        }
        const savedMember = await member.save();
        console.log("saved", email);
        return res.status(200).json(savedMember);
    } catch (error) {
        res.status(500).json({error: "Internal Server Error"});
    }
}

export const fetch = async(req, res)=>{
    try {
        const members_list = await Member.find();
        return res.json(members_list);
    } catch (error) {
        console.log(error);
        res.status(500).json({error: "Internal Server Error"});
    }
}

export const update = async(req, res)=>{
    try {
        const email = req.body.socials?.email;
        const member = await Member.findOne({
            "socials.email": email
        });
        if (!member){
            return res.status(404).json({message:"Member does not exist"});
        }
        const updatedMember =  await Member.findByIdAndUpdate(
            {"socials.email":email},
            req.body, {
            new: true,
            runValidators: true,
        });
        return res.status(200).json(updatedMember);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: "Internal Server Error"});        
    }
}
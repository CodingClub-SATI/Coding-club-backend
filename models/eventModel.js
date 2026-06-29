import mongoose from "mongoose"

const eventSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    branch:{
        type: String,
        required: true
    },
    year:{
        type: Number,
        required: true,
    },
    clubPost:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true,
        unique: true
    },
    image:{
        type: String
    },
    socials:{
        linkedin: String,
        github: String
    },
    tags: [String]
})

export default mongoose.model('member', memberSchema);
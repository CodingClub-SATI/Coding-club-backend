import z from "zod";
import mongoose from "mongoose";

const albumSchema = new mongoose.Schema({
    id:{
        type: String,
        required: true,
        unique: true
    },
    title:{
        type: String,
        required: true
    },
    images:[{
        id: Number,
        src: String,
        caption: String,
        featured: Boolean
    }]
    //Why is this required though? Please clarify
    //cover:{type: String}
    //date:{ type: Date }
})

export const Album = mongoose.model('album', albumSchema);

export const updateAlbumSchema = z.object({
    id: z.string().trim().optional(),
    title: z.string().trim().optional(),
}).strict();
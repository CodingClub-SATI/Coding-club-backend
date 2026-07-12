import mongoose from "mongoose"
import z from "zod";

const eventSchema = new mongoose.Schema({
    id:{ type: Number, required: true, unique: true },
    name:{ type: String, required: true },
    type:{ type: String, required: true },
    status:{ type: String, required: true },
    featured:{ type: Boolean, default: true },
    archived:{ type: Boolean, default: true },
    date:{ type: Date, default: Date.now},
    time:{ type: Date, default: Date.now},
    reportingTime:{ type: Date},
    venue:{ type: String },
    description:{ type: String, default:'This happens to be a generic description, innit lad?'},
    logoUrl:{ type: String },
    bannerUrl:{ type: String },
    tags:[String],
    registrationUrl:{ type: String },
    viewCount:{ type:Number },
    registerClickCount:{ type:Number }
//    name:{
//        type: String,
//        required: true
//    },
//    year:{
//        type: Number,
//        required: true,
//    },
//    clubPost:{
//        type: String,
//        required: true
//    },
//    email:{
//        type: String,
//        required: true,
//        unique: true
//    },
//    image:{
//        type: String
//    },
//    socials:{
//        linkedin: String,
//        github: String
//    },
//    tags: [String]
})

export default mongoose.model('event', eventSchema);

export const updateEventSchema = z.object({
    name: z.string().optional(),
    type: z.string().optional(),
    status: z.string().optional(),
    featured: z.boolean().optional(),
    archived: z.boolean().optional(),
    date: z.iso().date().optional(),
    time: z.iso().time().optional(),
    reportingTime: z.iso().date().optional(),
    venue: z.string().optional(),
    description: z.string().optional(),
    logoUrl: z.string().optional(),
    bannerUrl: z.string().optional(),
    registrationUrl: z.string().optional(),
    tags: z.array(z.string()).optional(),
    viewCount: z.number().optional(),
    registerClickCount: z.number().optional()
}).strict();
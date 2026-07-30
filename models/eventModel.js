import mongoose from "mongoose"
import z from "zod";

const eventSchema = new mongoose.Schema({
    id:{ type: String, required: true, unique: true }, //Id can be event initials (2 letters) + year
    name:{ type: String, required: true },
    type:{
        type: String,
        required: true,
        enum: ["Workshop","Hackathon","Competition","Seminar"]
    },
    status:{
        type: String,
        required: true,
        enum: ["Ongoing","Upcoming","Completed"]
    },
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

export const Event = mongoose.model('event', eventSchema);

export const updateEventSchema = z.object({
    name: z.string().trim().optional(),
    type: z.enum([
        "Hackathon",
        "Workshop",
        "Competition",
        "Seminar"
    ]).optional(),
    status: z.enum([
        "Upcoming",
        "Ongoing",
        "Completed",
    ]).optional(),
    featured: z.boolean().optional(),
    archived: z.boolean().optional(),
    date: z.string().date().optional(),
    time: z.string().time().optional(),
    reportingTime: z.string().date().optional(),
    venue: z.string().trim().optional(),
    description: z.string().trim().optional(),
    logoUrl: z.url().optional(),
    bannerUrl: z.url().optional(),
    registrationUrl: z.url().optional(),
    tags: z.array(z.string().trim()).optional(),
    viewCount: z.number().optional(),
    registerClickCount: z.number().optional()
}).strict();
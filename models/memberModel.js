import mongoose from "mongoose"
import z from "zod";

const memberSchema = new mongoose.Schema({
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
		unique: true,
		trim: true
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

export const Member = mongoose.model('member', memberSchema);

export const updateMemberSchema = z.object({
  name: z.string().optional(),
  branch: z.string().optional(),
  year: z.number().optional(),
  clubPost: z.string().optional(),
  email: z.string().email().optional(),
  socials: z.object({
	linkedin: z.string().optional(),
	github: z.string().optional()
  }).optional(),
  tags: z.array(z.string()).optional()
}).strict();
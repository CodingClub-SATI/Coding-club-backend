import mongoose from "mongoose"

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
	socials:{
		email:{
			type: String,
			required: true
		},
		linkedin: String,
		github: String
	}
})

export default mongoose.model('member', memberSchema);
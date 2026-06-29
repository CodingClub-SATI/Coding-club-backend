#This file shall contain info about API's provided by the server and their respective parameters.

POST /api/members:
	Input:
		-H "Content-Type: application/json" \
    	-d '{
		name:{ type:String, required:true },
		branch:{ type:String, required:true	},
		year:{ type:Number,	required:true, },
		clubPost:{ type:String,	required:true },
		image:{	type:String },
		socials:{ linkedin:String, github: String },
		tags: [String]
    	}'
	Output:
		Success: input payload + http code 201
		Failed [Member exists/Email not provided]: http code 400
		Failed [Internal server error]: http code 500

GET /api/members:			#no email required, returns all members data in json
	Input:
	Output:			#returns member objects encapsulated individually in json objects
		member Object: {
		name:{ type:String, required:true },
		branch:{ type:String, required:true	},
		year:{ type:Number,	required:true, },
		clubPost:{ type:String,	required:true },
		image:{	type:String },
		socials:{ linkedin:String, github: String },
		tags: [String]
    	} * number_of_members
		Failed[Internal server error]: http code 500

DELETE /api/members/$email:
	Input:
		-H "Content-Type: application/json" \
		-d '{
        }'
	Output:
		Success: http code 200
		Failed [Internal Server error]: http code 500
		Failed [Member not found]: http code 404
		Failed [Email not provided]: http code 400

PUT /api/members/$email:
	Input:
		-H "Content-Type: application/json" \
    	-d '{
		name:{ type:String, required:true },
		branch:{ type:String, required:true	},
		year:{ type:Number,	required:true, },
		clubPost:{ type:String,	required:true },
		image:{	type:String },
		socials:{ linkedin:String, github: String },
		tags: [String]
    	}'
	Output:
		Success: http code 200
		Failed [Internal Server error]: http code 500
		Failed [Member not found]: http code 404
		Failed [Email not provided]: http code 400

POST /api/upload/$email:
	Input:
		-H "Content-Type: application/json" \
		-F "image=@/path/to/file" \
		-d '{}'
	Output:
		Success: http code 200
		Failed [Internal Server error]: http code 500
		Failed [Member not found]: http code 404
		Failed [Email not provided]: http code 400

DELETE /api/upload/$email:
	Input:
		-H "Content-Type: application/json" \
		-d '{}'
	Output:
		Success: http code 200
		Failed [Internal Server error]: http code 500
		Failed [Member not found]: http code 404
		Failed [Email not provided]: http code 400
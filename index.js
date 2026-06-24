//One shot function to map console.log,error to a void function if env is 'production'
if (process.env.NODE_ENV === "production") {
    console.log = () => {};
	console.error = () => {};
}

import express from "express";
import mongoose from "mongoose";
import route from "./routes/memberRoutes.js";

const app = express();
app.use(express.json());
app.use("/api", route);

const PORT = process.env.PORT;
const MONGODBHANDLE = process.env.MONGO_URL;

mongoose.connect(MONGODBHANDLE).then(()=>{
	console.log("DB Connected successfully");
	app.listen(PORT, ()=>{
		console.log(`server running on port :${PORT}`);
	});
	})
	.catch(console.error);

//Most basic ping command to test server up/down status
app.get("/ping", (req, res) => {
	res.send("pong");
});

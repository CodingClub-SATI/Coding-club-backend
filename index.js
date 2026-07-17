//One shot function to map console.log,error to a void function if env is 'production'
if (process.env.NODE_ENV === "production") {
    console.log = () => {};
}

import express from "express";
import mongoose from "mongoose";
import memberRoute from "./routes/memberRoutes.js";
import eventRoute from "./routes/eventRoutes.js";
import albumRoute from "./routes/albumRoutes.js";
import uploadRoute from "./routes/uploadRoute.js";
import cors from "cors";

const app = express();
app.use(express.json());
app.use("/api", memberRoute);
app.use("/api", eventRoute);
app.use("/api", albumRoute);
app.use("/api", uploadRoute);

const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
};
app.use(cors(corsOptions));

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
app.use((req, res) => {
  res.status(404).send('Invalid route parameter value.');
});
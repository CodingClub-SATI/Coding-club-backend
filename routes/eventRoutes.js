import express from "express";
import { create, fetch, update, remove } from "../controllers/eventController.js";
import { validateBody } from "../middlewares/schemaValidate.js";
import { updateEventSchema } from "../models/eventModel.js";
import { verifyAdmin } from "../middlewares/primitiveAuth.js";

const route = express.Router();
route.post("/events", verifyAdmin, create);
route.get("/events", fetch);
route.put("/events/:id", verifyAdmin, validateBody(updateEventSchema), update );
route.delete("/events/:id", verifyAdmin, remove);
export default route;
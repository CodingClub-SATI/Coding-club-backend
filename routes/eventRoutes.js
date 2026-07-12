import express from "express";
import { create, fetch, update, remove } from "../controllers/eventController.js";
import { validateBody } from "../middlewares/schemaValidate.js";
import { updateEventSchema } from "../models/eventModel.js";

const route = express.Router();
route.post("/events", create);
route.get("/events", fetch);
route.put("/events/:id", validateBody(updateEventSchema), update );
route.delete("/events/:id", remove);
export default route;
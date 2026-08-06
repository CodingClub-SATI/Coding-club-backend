import express from "express";
import { create, fetch, fetchOne, update, remove, trackRegisterClick } from "../controllers/eventController.js";
import { validateBody } from "../middlewares/schemaValidate.js";
import { attachAdminStatus, requireAdmin } from "../middlewares/requireAdmin.js";
import { updateEventSchema, createEventSchema } from "../models/eventModel.js";

const route = express.Router();
route.post("/events", attachAdminStatus, requireAdmin, validateBody(createEventSchema), create);
route.get("/events", attachAdminStatus, fetch);
route.get("/events/:id", attachAdminStatus, fetchOne);
route.put("/events/:id", attachAdminStatus, requireAdmin, validateBody(updateEventSchema), update);
route.delete("/events/:id", attachAdminStatus, requireAdmin, remove);
route.post("/events/:id/register-click", trackRegisterClick);
export default route;
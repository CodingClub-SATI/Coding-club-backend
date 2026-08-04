import express from "express";
import { create, fetch, update, remove } from "../controllers/contactController.js";
import { validateBody } from "../middlewares/schemaValidate.js";
import { attachAdminStatus, requireAdmin } from "../middlewares/requireAdmin.js";
import { createContactSchema, updateContactSchema } from "../models/contactModel.js";

const route = express.Router();

route.post("/contacts", validateBody(createContactSchema), create);
route.get("/contacts", attachAdminStatus, requireAdmin, fetch);
route.put("/contacts/:id", attachAdminStatus, requireAdmin, validateBody(updateContactSchema), update);
route.delete("/contacts/:id", attachAdminStatus, requireAdmin, remove);

export default route;
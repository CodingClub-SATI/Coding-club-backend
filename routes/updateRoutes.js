import express from "express";
import { create, fetch, update, remove } from "../controllers/updateController.js";
import { validateBody } from "../middlewares/schemaValidate.js";
import { attachAdminStatus, requireAdmin } from "../middlewares/requireAdmin.js";
import { createUpdateSchema, updateUpdateSchema } from "../models/updateModel.js";

const route = express.Router();
route.get("/updates", fetch);
route.post("/updates", attachAdminStatus, requireAdmin, validateBody(createUpdateSchema), create);
route.put("/updates/:id", attachAdminStatus, requireAdmin, validateBody(updateUpdateSchema), update);
route.delete("/updates/:id", attachAdminStatus, requireAdmin, remove);
export default route;
import express from "express";
import { create, fetch, update, remove } from "../controllers/projectController.js";
import { validateBody } from "../middlewares/schemaValidate.js";
import { attachAdminStatus, requireAdmin } from "../middlewares/requireAdmin.js";
import { createProjectSchema, updateProjectSchema } from "../models/projectModel.js";

const route = express.Router();
route.get("/projects", fetch);
route.post("/projects", attachAdminStatus, requireAdmin, validateBody(createProjectSchema), create);
route.put("/projects/:id", attachAdminStatus, requireAdmin, validateBody(updateProjectSchema), update);
route.delete("/projects/:id", attachAdminStatus, requireAdmin, remove);
export default route;
import express from "express";
import { fetch, fetchAdmin } from "../controllers/statsController.js";
import { attachAdminStatus, requireAdmin } from "../middlewares/requireAdmin.js";

const route = express.Router();
route.get("/stats", fetch);
route.get("/admin/stats", attachAdminStatus, requireAdmin, fetchAdmin);
export default route;

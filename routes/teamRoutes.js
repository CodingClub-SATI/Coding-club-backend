import express from "express";
import {
    getPublicRoster, getAdminBatches, createBatch, setBatchArchived, removeBatch
} from "../controllers/batchController.js";
import { addMember, updateMember, removeMember } from "../controllers/memberController.js";
import { getLeadership, updateLeadership } from "../controllers/leadershipController.js";
import { validateBody } from "../middlewares/schemaValidate.js";
import { attachAdminStatus, requireAdmin } from "../middlewares/requireAdmin.js";
import { createBatchSchema, updateBatchSchema, memberSchema, updateMemberSchema, updateLeadershipSchema } from "../models/teamModel.js";

const route = express.Router();

// ---- Public ----
route.get("/team/public", getPublicRoster);

// ---- Admin ----
route.get("/team/admin/batches", attachAdminStatus, requireAdmin, getAdminBatches);
route.post("/team/admin/batches", attachAdminStatus, requireAdmin, validateBody(createBatchSchema), createBatch);
route.patch("/team/admin/batches/:batch", attachAdminStatus, requireAdmin, validateBody(updateBatchSchema), setBatchArchived);
route.delete("/team/admin/batches/:batch", attachAdminStatus, requireAdmin, removeBatch);

route.post("/team/admin/members", attachAdminStatus, requireAdmin, validateBody(memberSchema), addMember);
route.patch("/team/admin/members/:id", attachAdminStatus, requireAdmin, validateBody(updateMemberSchema), updateMember);
route.delete("/team/admin/members/:id", attachAdminStatus, requireAdmin, removeMember);

route.get("/team/admin/leadership", attachAdminStatus, requireAdmin, getLeadership);
route.put("/team/admin/leadership", attachAdminStatus, requireAdmin, validateBody(updateLeadershipSchema), updateLeadership);

export default route;
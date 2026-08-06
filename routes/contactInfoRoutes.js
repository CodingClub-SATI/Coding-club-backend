import express from "express";
import { getContactInfo, updateContactInfo } from "../controllers/contactInfoController.js";
import { validateBody } from "../middlewares/schemaValidate.js";
import { attachAdminStatus, requireAdmin } from "../middlewares/requireAdmin.js";
import { updateContactInfoSchema } from "../models/contactInfoModel.js";

const route = express.Router();

route.get("/contact-info", getContactInfo);

route.put(
    "/contact-info", 
    attachAdminStatus, 
    requireAdmin, 
    validateBody(updateContactInfoSchema), 
    updateContactInfo
);

export default route;
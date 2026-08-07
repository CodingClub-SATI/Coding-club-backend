import express from "express";
import {create, fetch, update, remove} from "../controllers/memberController.js";
import {validateBody} from "../middlewares/schemaValidate.js";
import {updateMemberSchema} from "../models/memberModel.js";
import { verifyAdmin } from "../middlewares/primitiveAuth.js";

const route = express.Router();
route.post("/members", verifyAdmin, create);
route.get("/members", fetch);
route.put("/members/:email", verifyAdmin, validateBody(updateMemberSchema), update);
route.delete("/members/:email", verifyAdmin, remove);
export default route;
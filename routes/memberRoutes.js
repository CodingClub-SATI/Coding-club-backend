import express from "express";
import {create, fetch, update, remove} from "../controllers/memberController.js";
import {validateBody} from "../middlewares/schemaValidate.js";
import {updateMemberSchema} from "../models/memberModel.js";

const route = express.Router();
route.post("/members", create);
route.get("/members", fetch);
route.put("/members/:email", validateBody(updateMemberSchema), update);
route.delete("/members/:email", remove);
export default route;
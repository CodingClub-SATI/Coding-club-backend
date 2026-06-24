import express from "express";
import {create, fetch, update, remove} from "../controllers/memberController.js";
const route = express.Router();
route.post("/member/create", create);
route.get("/member/fetchall", fetch);
route.put("/member/update", update);
route.delete("/member/update", update);
export default route;
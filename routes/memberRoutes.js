import express from "express";
import {create, fetch, update} from "../controllers/memberController.js";
const route = express.Router();
route.post("/member/create", create);
route.get("/member/fetchall", fetch);
route.put("/member/update", update);
export default route;
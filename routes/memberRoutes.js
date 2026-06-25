import express from "express";
import {create, fetch, update, remove} from "../controllers/memberController.js";
const route = express.Router();
route.post("/members", create);
route.get("/members", fetch);
route.put("/members/:email", update);
route.delete("/members/:email", remove);
export default route;
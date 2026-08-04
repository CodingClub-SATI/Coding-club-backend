import express from "express";
import rateLimit from "express-rate-limit";
import { attachAdminStatus, requireAdmin } from "../middlewares/requireAdmin.js";
import { validateBody } from "../middlewares/schemaValidate.js";
import { login, logout, verifySession, requestOtp, updatePassword } from "../controllers/authController.js";
import { loginSchema, updatePasswordSchema } from "../models/adminModel.js";

const route = express.Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: "Too many login attempts. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});

const otpRequestLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { message: "Too many code requests. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});

const passwordUpdateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { message: "Too many attempts. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});

route.post("/auth/login", loginLimiter, validateBody(loginSchema), login);
route.post("/auth/logout", attachAdminStatus, logout);
route.get("/auth/verify", attachAdminStatus, requireAdmin, verifySession);
route.post("/auth/password/otp", otpRequestLimiter, attachAdminStatus, requireAdmin, requestOtp);
route.put("/auth/password", passwordUpdateLimiter, attachAdminStatus, requireAdmin, validateBody(updatePasswordSchema), updatePassword);

export default route;
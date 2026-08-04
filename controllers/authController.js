import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import Admin from "../models/adminModel.js";
import { isPasswordStrongEnough, PASSWORD_MIN_LENGTH } from "../utils/passwordStrength.js";
import { handleControllerError } from "../utils/errorHandler.js";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
    },
});

const isProduction = process.env.NODE_ENV === "production";

export const ADMIN_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
};

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const admin = await Admin.findOne({ username }).select("+password").exec();
        if (!admin) return res.status(401).json({ message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

        if (!process.env.JWT_SECRET) {
            console.error("Login blocked: JWT_SECRET is not set.");
            return res.status(500).json({ message: "Server is not configured correctly." });
        }

        const token = jwt.sign(
            { role: 'admin', username: admin.username, id: admin._id, tokenVersion: admin.tokenVersion || 0 },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.cookie('admin_token', token, {
            ...ADMIN_COOKIE_OPTIONS,
            maxAge: 24 * 60 * 60 * 1000
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        return handleControllerError(error, res, { context: "Login Error" });
    }
};

export const logout = async (req, res) => {
    try {
        if (req.adminId) {
            await Admin.findByIdAndUpdate(req.adminId, { $inc: { tokenVersion: 1 } }).exec();
        }
    } catch (error) {
        console.error("Failed to invalidate admin session on logout (non-fatal):", error);
    }

    res.clearCookie('admin_token', ADMIN_COOKIE_OPTIONS);
    return res.status(200).json({ success: true });
};

export const verifySession = (req, res) => {
    return res.status(200).json({ valid: true, username: req.adminUsername });
};

export const requestOtp = async (req, res) => {
    try {
        const otp = crypto.randomInt(100000, 1000000).toString();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        const admin = await Admin.findById(req.adminId).exec();
        if (!admin) return res.status(404).json({ message: "Admin account not found in DB." });

        admin.otp = otp; // hashed by adminSchema's pre-save hook
        admin.otpExpiry = otpExpiry;
        await admin.save();

        // Send Email
        await transporter.sendMail({
            from: process.env.SMTP_EMAIL,
            to: process.env.ADMIN_EMAIL || admin.email,
            subject: "Coding Club SATI - Password Reset Code",
            text: `Your admin password reset code is: ${otp}. It expires in 5 minutes.`,
        });

        return res.status(200).json({ success: true, message: "OTP Sent" });
    } catch (error) {
        return handleControllerError(error, res, { context: "OTP Error", fallbackMessage: "Could not send OTP email." });
    }
};

export const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, otp } = req.body;

        const admin = await Admin.findById(req.adminId).select("+password +otp").exec();
        if (!admin) return res.status(404).json({ message: "Admin account not found." });

        const isMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isMatch) return res.status(401).json({ message: "Current password is incorrect." });

        if (!isPasswordStrongEnough(newPassword)) {
            return res.status(400).json({
                message: `New password must be at least ${PASSWORD_MIN_LENGTH} characters and mix case, numbers, and symbols.`
            });
        }

        if (!admin.otp || !(await bcrypt.compare(otp, admin.otp))) {
            return res.status(400).json({ message: "Invalid code. Please try again." });
        }
        if (new Date() > admin.otpExpiry) {
            return res.status(400).json({ message: "Code has expired. Please request a new one." });
        }

        admin.password = newPassword; // hashed by adminSchema's pre-save hook
        admin.otp = undefined;
        admin.otpExpiry = undefined;
        admin.tokenVersion = (admin.tokenVersion || 0) + 1;

        await admin.save();

        return res.status(200).json({ success: true, message: "Password updated successfully." });
    } catch (error) {
        return handleControllerError(error, res, { context: "Update Password Error" });
    }
};
import jwt from "jsonwebtoken";
import Admin from "../models/adminModel.js";

export const attachAdminStatus = async (req, res, next) => {
    req.isAdmin = false;
    req.adminId = null;
    req.adminUsername = null;

    const token = req.cookies?.admin_token;
    if (!token) return next();

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin' || !decoded.id) return next();

        const admin = await Admin.findById(decoded.id).select("username tokenVersion").lean().exec();
        if (!admin) return next();

        const tokenVersion = decoded.tokenVersion || 0;
        if (tokenVersion !== (admin.tokenVersion || 0)) return next();

        req.isAdmin = true;
        req.adminId = decoded.id;
        req.adminUsername = admin.username;
    } catch (err) {
        req.isAdmin = false;
    }
    next();
};

export const requireAdmin = (req, res, next) => {
    if (!req.isAdmin) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    next();
};
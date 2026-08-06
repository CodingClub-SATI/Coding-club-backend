import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { handleControllerError } from "./utils/errorHandler.js";
import { runStartupChecks } from "./utils/startupChecks.js";

import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import galleryRoutes from "./routes/galleryRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import updateRoutes from "./routes/updateRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";
import contactInfoRoutes from "./routes/contactInfoRoutes.js";
import { startGithubSyncJob } from "./jobs/githubSyncJob.js";

runStartupChecks();

const app = express();

const trustProxyHops = process.env.TRUST_PROXY_HOPS !== undefined
    ? Number.parseInt(process.env.TRUST_PROXY_HOPS, 10)
    : undefined;
if (Number.isInteger(trustProxyHops) && trustProxyHops >= 0) {
    app.set("trust proxy", trustProxyHops);
}

app.use(helmet());

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: "Too many requests from this IP, please try again later."
});
app.use("/api/", apiLimiter);
app.use(express.json());
app.use(cookieParser());

const defaultDevOrigins = ['http://localhost:5173', 'http://localhost:3000'];
const configuredOrigins = process.env.FRONTEND_URLS
    ? process.env.FRONTEND_URLS.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

if (process.env.NODE_ENV === "production" && configuredOrigins.length === 0) {
    console.warn(
        "WARNING: FRONTEND_URLS is not set in production. CORS will only " +
        "allow the local dev origins, so the deployed frontend's requests " +
        "will be blocked by the browser."
    );
}

const corsOptions = {
    origin: configuredOrigins.length > 0 ? configuredOrigins : defaultDevOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true // Required for HttpOnly cookies to pass through
};
app.use(cors(corsOptions));

const allowedOrigins = new Set(corsOptions.origin);
const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

app.use("/api", (req, res, next) => {
    const origin = req.headers.origin;
    if (STATE_CHANGING_METHODS.has(req.method) && origin && !allowedOrigins.has(origin)) {
        return res.status(403).json({ message: "Request origin not allowed." });
    }
    next();
});

// Routes
app.use("/api", authRoutes);
app.use("/api", eventRoutes);
app.use("/api", projectRoutes);
app.use("/api", galleryRoutes);
app.use("/api", teamRoutes);
app.use("/api", contactRoutes);
app.use("/api", updateRoutes);
app.use("/api", statsRoutes);
app.use("/api", contactInfoRoutes)

const PORT = process.env.PORT || 3000;
const MONGODBHANDLE = process.env.MONGO_URL;

mongoose.connect(MONGODBHANDLE).then(() => {
    console.log("DB Connected successfully");
    app.listen(PORT, () => {
        console.log(`server running on port :${PORT}`);
        startGithubSyncJob();
    });
}).catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
});

// Most basic ping command to test server up/down status
app.get("/ping", (req, res) => {
    res.send("pong");
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: "Invalid route parameter value." });


app.use((err, req, res, next) => {
    const status = err.status || err.statusCode;
    if (typeof status === "number" && status >= 400 && status < 500) {
        return res.status(status).json({ message: err.message || "Bad request." });
    }
    return handleControllerError(err, res, { context: "Unhandled error" });
});
});
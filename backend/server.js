"use strict";
const express    = require("express");
const http       = require("http");
const { Server } = require("socket.io");
const mongoose   = require("mongoose");
const dotenv     = require("dotenv");
const cors       = require("cors");
const helmet     = require("helmet");
const morgan     = require("morgan");
const cookieParser  = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
dotenv.config();

const connectDB       = require("./src/config/db");
const { initSocket }  = require("./src/config/socket");
const errorHandler    = require("./src/middleware/errorHandler");
const { apiLimiter }  = require("./src/middleware/rateLimiter");
const logger          = require("./src/utils/logger");

const authRoutes         = require("./src/routes/auth.routes");
const userRoutes         = require("./src/routes/user.routes");
const matchRoutes        = require("./src/routes/match.routes");
const joinRequestRoutes  = require("./src/routes/joinRequest.routes");
const chatRoutes         = require("./src/routes/chat.routes");
const notificationRoutes = require("./src/routes/notification.routes");
const adminRoutes        = require("./src/routes/admin.routes");
const reviewRoutes       = require("./src/routes/review.routes");

const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || "http://localhost:5173", methods: ["GET","POST"], credentials: true },
  pingTimeout: 60000,
});
initSocket(io);

app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" }, contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true, methods: ["GET","POST","PUT","DELETE","PATCH","OPTIONS"] }));
app.use("/api", apiLimiter);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(mongoSanitize());
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));
app.use((req, _res, next) => { req.io = io; next(); });

const V = "/api";
app.use(`${V}/auth`,          authRoutes);
app.use(`${V}/users`,         userRoutes);
app.use(`${V}/matches`,       matchRoutes);
app.use(`${V}/join-requests`, joinRequestRoutes);
app.use(`${V}/chats`,         chatRoutes);
app.use(`${V}/notifications`, notificationRoutes);
app.use(`${V}/reviews`,       reviewRoutes);
app.use(`${V}/admin`,         adminRoutes);

app.get(`${V}/health`, (_req, res) =>
  res.json({ status: "OK", env: process.env.NODE_ENV, uptime: process.uptime(), timestamp: new Date().toISOString() })
);
app.use((_req, res) => res.status(404).json({ success: false, message: "Route not found." }));
app.use(errorHandler);

const PORT = parseInt(process.env.PORT, 10) || 5000;
connectDB().then(() => {
  server.listen(PORT, () => {
    logger.info(`PlayMate running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
  });
}).catch((err) => { logger.error("Failed to start:", err); process.exit(1); });

process.on("SIGTERM", () => { server.close(() => mongoose.disconnect().then(() => process.exit(0))); });
process.on("SIGINT",  () => { server.close(() => mongoose.disconnect().then(() => process.exit(0))); });
process.on("unhandledRejection", (reason) => { logger.error("Unhandled rejection:", reason); });

module.exports = { app, io };

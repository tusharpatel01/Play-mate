const rateLimit = require("express-rate-limit");

// ─── Strict auth limiter (login / register / forgot-pw) ──
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many auth attempts. Please wait 15 minutes." },
  skip: () => process.env.NODE_ENV === "test",
});

// ─── General API limiter ──────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please slow down." },
});

// ─── Upload limiter (Cloudinary) ─────────────────────────
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: { success: false, message: "Upload limit reached. Try again in an hour." },
});

// ─── Join request limiter ─────────────────────────────────
const joinRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  message: { success: false, message: "Too many join requests. Please slow down." },
});

module.exports = { authLimiter, apiLimiter, uploadLimiter, joinRequestLimiter };

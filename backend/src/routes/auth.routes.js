const express = require("express");
const router = express.Router();
const {
  register, login, logout, refreshToken, getMe,
  verifyEmail, forgotPassword, resetPassword,
} = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiter");
const {
  registerValidator, loginValidator,
  forgotPasswordValidator, resetPasswordValidator,
} = require("../validators");

router.post("/register",        authLimiter, registerValidator,        register);
router.post("/login",           authLimiter, loginValidator,           login);
router.post("/logout",          protect,                               logout);
router.post("/refresh",                                                refreshToken);
router.get("/me",               protect,                               getMe);
router.get("/verify-email/:token",                                     verifyEmail);
router.post("/forgot-password", authLimiter, forgotPasswordValidator,  forgotPassword);
router.put("/reset-password/:token", resetPasswordValidator,           resetPassword);

module.exports = router;

const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { asyncHandler, AppError, sendTokenResponse } = require("../utils/helpers");
const {
  sendEmail,
  emailVerificationTemplate,
  passwordResetTemplate,
} = require("../services/email.service");

// POST /api/auth/register
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return next(new AppError("Email already registered.", 400));

  const user = await User.create({ name, email, password });

  // Send verification email
  const verificationToken = user.getEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
  await sendEmail({
    to: user.email,
    subject: "Verify your PlayMate account",
    html: emailVerificationTemplate(user.name, verifyUrl),
  }).catch(() => {}); // non-blocking

  sendTokenResponse(user, 201, res);
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) return next(new AppError("Please provide email and password.", 400));

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.matchPassword(password))) {
    return next(new AppError("Invalid email or password.", 401));
  }

  if (user.isBanned) return next(new AppError("Your account has been banned.", 403));

  sendTokenResponse(user, 200, res);
});

// POST /api/auth/logout
exports.logout = asyncHandler(async (req, res) => {
  res.clearCookie("refreshToken");
  res.json({ success: true, message: "Logged out successfully." });
});

// POST /api/auth/refresh
exports.refreshToken = asyncHandler(async (req, res, next) => {
  const token = req.cookies.refreshToken;
  if (!token) return next(new AppError("No refresh token.", 401));

  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  const user = await User.findById(decoded.id);
  if (!user) return next(new AppError("User not found.", 401));

  const { generateAccessToken } = require("../utils/helpers");
  const accessToken = generateAccessToken(user._id);

  res.json({ success: true, accessToken });
});

// GET /api/auth/me
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, user: user.toPublicJSON() });
});

// GET /api/auth/verify-email/:token
exports.verifyEmail = asyncHandler(async (req, res, next) => {
  const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpire: { $gt: Date.now() },
  });

  if (!user) return next(new AppError("Invalid or expired verification token.", 400));

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, message: "Email verified successfully." });
});

// POST /api/auth/forgot-password
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new AppError("No user with that email.", 404));

  const resetToken = user.getPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  await sendEmail({
    to: user.email,
    subject: "PlayMate — Password Reset",
    html: passwordResetTemplate(user.name, resetUrl),
  });

  res.json({ success: true, message: "Password reset email sent." });
});

// PUT /api/auth/reset-password/:token
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpire: { $gt: Date.now() },
  });

  if (!user) return next(new AppError("Invalid or expired reset token.", 400));

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

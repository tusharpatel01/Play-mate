const jwt = require("jsonwebtoken");

// ─── Token generation ─────────────────────────────────────
const generateAccessToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || "15m" });

const generateRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d",
  });

const sendTokenResponse = (user, statusCode, res) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  res
    .status(statusCode)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json({
      success: true,
      accessToken,
      user: user.toPublicJSON(),
    });
};

// ─── Async wrapper ────────────────────────────────────────
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ─── Custom error class ───────────────────────────────────
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

// ─── Pagination helper ────────────────────────────────────
const paginate = (query, page = 1, limit = 12) => {
  const skip = (page - 1) * limit;
  return query.skip(skip).limit(limit);
};

const buildPaginationMeta = (total, page, limit) => ({
  total,
  page: Number(page),
  pages: Math.ceil(total / limit),
  limit: Number(limit),
  hasNext: page * limit < total,
  hasPrev: page > 1,
});

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  sendTokenResponse,
  asyncHandler,
  AppError,
  paginate,
  buildPaginationMeta,
};

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { AppError, asyncHandler } = require("../utils/helpers");

// ─── Verify JWT ───────────────────────────────────────────
const protect = asyncHandler(async (req, _res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) throw new AppError("Not authorised. Please log in.", 401);

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);

  if (!user) throw new AppError("User no longer exists.", 401);
  if (user.isBanned) throw new AppError("Your account has been banned.", 403);

  user.lastSeen = Date.now();
  await user.save({ validateBeforeSave: false });

  req.user = user;
  next();
});

// ─── Role gate ────────────────────────────────────────────
const authorize = (...roles) =>
  (req, _res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError(`Role '${req.user.role}' is not allowed here.`, 403));
    }
    next();
  };

// ─── Optional auth (for public routes that show extra data when logged in) ──
const optionalAuth = asyncHandler(async (req, _res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    } catch {
      // silently continue without user
    }
  }
  next();
});

module.exports = { protect, authorize, optionalAuth };

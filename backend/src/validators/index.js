const { body, param, query, validationResult } = require("express-validator");

// ─── Validation result middleware ─────────────────────────
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ─── Auth validators ──────────────────────────────────────
const registerValidator = [
  body("name").trim().isLength({ min: 2, max: 50 }).withMessage("Name must be 2–50 characters"),
  body("email").isEmail().normalizeEmail().withMessage("Invalid email address"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  validate,
];

const loginValidator = [
  body("email").isEmail().normalizeEmail().withMessage("Invalid email"),
  body("password").notEmpty().withMessage("Password is required"),
  validate,
];

const forgotPasswordValidator = [
  body("email").isEmail().normalizeEmail().withMessage("Invalid email"),
  validate,
];

const resetPasswordValidator = [
  param("token").notEmpty().withMessage("Token is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  validate,
];

// ─── Match validators ─────────────────────────────────────
const SPORTS = ["cricket", "football", "basketball", "badminton", "volleyball", "tennis", "other"];
const SKILL_LEVELS = ["beginner", "intermediate", "advanced", "any"];

const createMatchValidator = [
  body("title").trim().isLength({ min: 5, max: 100 }).withMessage("Title must be 5–100 characters"),
  body("sport").isIn(SPORTS).withMessage(`Sport must be one of: ${SPORTS.join(", ")}`),
  body("date").isISO8601().withMessage("Invalid date format"),
  body("startTime").notEmpty().withMessage("Start time is required"),
  body("totalSlots").isInt({ min: 2, max: 50 }).withMessage("Total slots must be between 2 and 50"),
  body("lat").isFloat({ min: -90, max: 90 }).withMessage("Invalid latitude"),
  body("lng").isFloat({ min: -180, max: 180 }).withMessage("Invalid longitude"),
  body("address").trim().notEmpty().withMessage("Address is required"),
  body("skillRequired").optional().isIn(SKILL_LEVELS).withMessage("Invalid skill level"),
  body("entryFee").optional().isFloat({ min: 0 }).withMessage("Entry fee must be non-negative"),
  body("visibility").optional().isIn(["public", "private"]).withMessage("Visibility must be public or private"),
  validate,
];

const updateMatchValidator = [
  param("id").isMongoId().withMessage("Invalid match ID"),
  body("title").optional().trim().isLength({ min: 5, max: 100 }).withMessage("Title must be 5–100 characters"),
  body("totalSlots").optional().isInt({ min: 2, max: 50 }).withMessage("Total slots must be between 2 and 50"),
  validate,
];

// ─── Join request validators ──────────────────────────────
const sendJoinRequestValidator = [
  body("matchId").isMongoId().withMessage("Invalid match ID"),
  body("message").optional().trim().isLength({ max: 200 }).withMessage("Message must be under 200 characters"),
  validate,
];

// ─── Review validators ────────────────────────────────────
const createReviewValidator = [
  body("revieweeId").isMongoId().withMessage("Invalid user ID"),
  body("matchId").isMongoId().withMessage("Invalid match ID"),
  body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
  body("comment").optional().trim().isLength({ max: 300 }).withMessage("Comment must be under 300 characters"),
  validate,
];

// ─── Profile update validator ─────────────────────────────
const updateProfileValidator = [
  body("name").optional().trim().isLength({ min: 2, max: 50 }).withMessage("Name must be 2–50 characters"),
  body("age").optional().isInt({ min: 13, max: 100 }).withMessage("Age must be between 13 and 100"),
  body("bio").optional().trim().isLength({ max: 300 }).withMessage("Bio must be under 300 characters"),
  body("skillLevel").optional().isIn(["beginner", "intermediate", "advanced"]).withMessage("Invalid skill level"),
  body("searchRadius").optional().isIn([2, 5, 10, 20, 50, 100, 250]).withMessage("Invalid radius value"),
  validate,
];

module.exports = {
  validate,
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  createMatchValidator,
  updateMatchValidator,
  sendJoinRequestValidator,
  createReviewValidator,
  updateProfileValidator,
};

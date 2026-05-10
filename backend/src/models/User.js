const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const SPORTS = ["cricket", "football", "basketball", "badminton", "volleyball", "tennis", "other"];
const SKILL_LEVELS = ["beginner", "intermediate", "advanced"];
const ROLES = ["player", "organizer", "admin"];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    role: { type: String, enum: ROLES, default: "player" },

    // ─── Profile ──────────────────────────────────────
    avatar: { type: String, default: "" },
    avatarPublicId: { type: String, default: "" },
    age: { type: Number, min: 13, max: 100 },
    gender: { type: String, enum: ["male", "female", "other", "prefer_not_to_say"] },
    bio: { type: String, maxlength: 300 },
    skillLevel: { type: String, enum: SKILL_LEVELS, default: "beginner" },
    preferredSports: [{ type: String, enum: SPORTS }],
    availability: [{ type: String }], // ["morning", "evening", "weekend"]

    // ─── Location ─────────────────────────────────────
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        default: [0, 0],
      },
      address: { type: String },
      city: { type: String },
    },
    searchRadius: {
      type: Number,
      default: 10, // km
      enum: [2, 5, 10, 20, 50, 100, 250],
    },

    // ─── Stats ────────────────────────────────────────
    matchesPlayed: { type: Number, default: 0 },
    matchesOrganised: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },

    // ─── Auth ─────────────────────────────────────────
    isEmailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isBanned: { type: Boolean, default: false },
    banReason: { type: String },
    emailVerificationToken: String,
    emailVerificationExpire: Date,
    passwordResetToken: String,
    passwordResetExpire: Date,
    refreshToken: { type: String, select: false },

    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// ─── Geo index ────────────────────────────────────────────
userSchema.index({ location: "2dsphere" });
userSchema.index({ preferredSports: 1 });

// ─── Hash password before save ────────────────────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Instance methods ─────────────────────────────────────
userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

userSchema.methods.getEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.emailVerificationToken = crypto.createHash("sha256").update(token).digest("hex");
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24h
  return token;
};

userSchema.methods.getPasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto.createHash("sha256").update(token).digest("hex");
  this.passwordResetExpire = Date.now() + 60 * 60 * 1000; // 1h
  return token;
};

userSchema.methods.toPublicJSON = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    avatar: this.avatar,
    age: this.age,
    gender: this.gender,
    bio: this.bio,
    skillLevel: this.skillLevel,
    preferredSports: this.preferredSports,
    location: this.location,
    searchRadius: this.searchRadius,
    matchesPlayed: this.matchesPlayed,
    matchesOrganised: this.matchesOrganised,
    averageRating: this.averageRating,
    isEmailVerified: this.isEmailVerified,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("User", userSchema);

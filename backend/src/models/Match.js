const mongoose = require("mongoose");

const SPORTS = ["cricket", "football", "basketball", "badminton", "volleyball", "tennis", "other"];
const SKILL_LEVELS = ["beginner", "intermediate", "advanced", "any"];
const STATUS = ["open", "full", "in_progress", "completed", "cancelled"];

const matchSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Match title is required"],
      trim: true,
      maxlength: 100,
    },
    sport: {
      type: String,
      required: [true, "Sport is required"],
      enum: SPORTS,
    },
    description: { type: String, maxlength: 500 },

    // ─── Organizer ────────────────────────────────────
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ─── Location ─────────────────────────────────────
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: { type: [Number], required: true }, // [lng, lat]
      address: { type: String, required: true },
      city: { type: String },
      groundName: { type: String },
    },

    // ─── Scheduling ───────────────────────────────────
    date: { type: Date, required: [true, "Match date is required"] },
    startTime: { type: String, required: true },
    duration: { type: Number, default: 120 }, // minutes

    // ─── Player settings ──────────────────────────────
    totalSlots: {
      type: Number,
      required: true,
      min: 2,
      max: 50,
    },
    participants: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    waitingList: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        addedAt: { type: Date, default: Date.now },
      },
    ],

    // ─── Match settings ───────────────────────────────
    skillRequired: { type: String, enum: SKILL_LEVELS, default: "any" },
    entryFee: { type: Number, default: 0 },
    isFree: { type: Boolean, default: true },
    visibility: { type: String, enum: ["public", "private"], default: "public" },
    status: { type: String, enum: STATUS, default: "open" },

    // ─── Related ──────────────────────────────────────
    groupChat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },

    // ─── Stats ────────────────────────────────────────
    viewCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtual: spots left ──────────────────────────────────
matchSchema.virtual("spotsLeft").get(function () {
  return this.totalSlots - this.participants.length;
});

matchSchema.virtual("isFull").get(function () {
  return this.participants.length >= this.totalSlots;
});

// ─── Indexes ──────────────────────────────────────────────
matchSchema.index({ location: "2dsphere" });
matchSchema.index({ sport: 1 });
matchSchema.index({ date: 1 });
matchSchema.index({ status: 1 });
matchSchema.index({ organizer: 1 });
matchSchema.index({ "participants.user": 1 });

// ─── Auto-close when full ─────────────────────────────────
matchSchema.pre("save", function (next) {
  if (this.participants.length >= this.totalSlots) {
    this.status = "full";
  } else if (this.status === "full" && this.participants.length < this.totalSlots) {
    this.status = "open";
  }
  next();
});

module.exports = mongoose.model("Match", matchSchema);

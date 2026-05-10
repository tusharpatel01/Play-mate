const User = require("../models/User");
const Match = require("../models/Match");
const { Notification, Review, Report } = require("../models/index");
const { asyncHandler, AppError } = require("../utils/helpers");
const { cloudinary } = require("../config/cloudinary");

// ══════════════════════════════════════════════════════════
// USER CONTROLLER
// ══════════════════════════════════════════════════════════

// GET /api/users/:id
exports.getUserProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user || user.isBanned) return next(new AppError("User not found.", 404));
  res.json({ success: true, data: user.toPublicJSON() });
});

// PUT /api/users/profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const allowed = ["name", "bio", "age", "gender", "skillLevel", "preferredSports", "availability", "searchRadius"];
  const updates = {};
  allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  if (req.body.lat && req.body.lng) {
    updates.location = {
      type: "Point",
      coordinates: [parseFloat(req.body.lng), parseFloat(req.body.lat)],
      address: req.body.address,
      city: req.body.city,
    };
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.json({ success: true, data: user.toPublicJSON() });
});

// PUT /api/users/avatar
exports.updateAvatar = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError("Please upload an image.", 400));

  // Delete old avatar
  if (req.user.avatarPublicId) {
    await cloudinary.uploader.destroy(req.user.avatarPublicId).catch(() => {});
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: req.file.path, avatarPublicId: req.file.filename },
    { new: true }
  );

  res.json({ success: true, data: { avatar: user.avatar } });
});

// GET /api/users/nearby - Find nearby players
exports.getNearbyPlayers = asyncHandler(async (req, res) => {
  const { lat, lng, radius = 10, sport, page = 1, limit = 20 } = req.query;

  const filter = { isActive: true, isBanned: false, _id: { $ne: req.user._id } };
  if (sport) filter.preferredSports = sport;

  const users = await User.find({
    ...filter,
    location: {
      $nearSphere: {
        $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
        $maxDistance: parseFloat(radius) * 1000,
      },
    },
  })
    .select("name avatar skillLevel preferredSports averageRating matchesPlayed location")
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json({ success: true, data: users });
});

// PUT /api/users/change-password
exports.changePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new AppError("Current password is incorrect.", 401));
  }
  user.password = req.body.newPassword;
  await user.save();
  res.json({ success: true, message: "Password updated." });
});

// ══════════════════════════════════════════════════════════
// NOTIFICATION CONTROLLER
// ══════════════════════════════════════════════════════════

exports.getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .populate("sender", "name avatar")
    .populate("match", "title sport")
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({ success: true, data: notifications });
});

exports.markAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true });
});

exports.markOneAsRead = asyncHandler(async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
  res.json({ success: true });
});

exports.getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
  res.json({ success: true, count });
});

// ══════════════════════════════════════════════════════════
// REVIEW CONTROLLER
// ══════════════════════════════════════════════════════════

exports.createReview = asyncHandler(async (req, res, next) => {
  const { revieweeId, matchId, rating, comment } = req.body;

  // Must have played in same match
  const match = await Match.findById(matchId);
  if (!match) return next(new AppError("Match not found.", 404));

  const wasParticipant = match.participants.some(
    (p) => p.user.toString() === req.user._id.toString()
  );
  if (!wasParticipant) return next(new AppError("You must have participated in this match.", 403));

  const review = await Review.create({
    reviewer: req.user._id,
    reviewee: revieweeId,
    match: matchId,
    rating,
    comment,
  });

  // Update user average rating
  const allReviews = await Review.find({ reviewee: revieweeId });
  const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
  await User.findByIdAndUpdate(revieweeId, {
    averageRating: Math.round(avg * 10) / 10,
    totalRatings: allReviews.length,
  });

  await review.populate("reviewer", "name avatar");
  res.status(201).json({ success: true, data: review });
});

exports.getUserReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ reviewee: req.params.userId })
    .populate("reviewer", "name avatar")
    .populate("match", "title sport")
    .sort({ createdAt: -1 });

  res.json({ success: true, data: reviews });
});

// ══════════════════════════════════════════════════════════
// REPORT CONTROLLER
// ══════════════════════════════════════════════════════════

exports.createReport = asyncHandler(async (req, res) => {
  const { reportedUserId, reportedMatchId, reason, description } = req.body;
  const report = await Report.create({
    reporter: req.user._id,
    reportedUser: reportedUserId,
    reportedMatch: reportedMatchId,
    reason,
    description,
  });
  res.status(201).json({ success: true, data: report });
});

// ══════════════════════════════════════════════════════════
// ADMIN CONTROLLER
// ══════════════════════════════════════════════════════════

exports.adminGetStats = asyncHandler(async (_req, res) => {
  const [users, matches, reports, activeMatches] = await Promise.all([
    User.countDocuments(),
    Match.countDocuments(),
    Report.countDocuments({ status: "pending" }),
    Match.countDocuments({ status: "open" }),
  ]);
  res.json({ success: true, data: { users, matches, pendingReports: reports, activeMatches } });
});

exports.adminGetUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, isBanned } = req.query;
  const filter = {};
  if (search) filter.name = { $regex: search, $options: "i" };
  if (isBanned !== undefined) filter.isBanned = isBanned === "true";

  const users = await User.find(filter)
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await User.countDocuments(filter);
  res.json({ success: true, data: users, total });
});

exports.adminBanUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.userId);
  if (!user) return next(new AppError("User not found.", 404));

  user.isBanned = true;
  user.banReason = req.body.reason || "Violated community guidelines.";
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, message: "User banned." });
});

exports.adminUnbanUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.userId);
  if (!user) return next(new AppError("User not found.", 404));
  user.isBanned = false;
  user.banReason = undefined;
  await user.save({ validateBeforeSave: false });
  res.json({ success: true, message: "User unbanned." });
});

exports.adminGetReports = asyncHandler(async (req, res) => {
  const reports = await Report.find({ status: "pending" })
    .populate("reporter", "name email")
    .populate("reportedUser", "name email")
    .populate("reportedMatch", "title sport")
    .sort({ createdAt: -1 });

  res.json({ success: true, data: reports });
});

exports.adminResolveReport = asyncHandler(async (req, res, next) => {
  const report = await Report.findById(req.params.reportId);
  if (!report) return next(new AppError("Report not found.", 404));
  report.status = req.body.status || "resolved";
  report.resolvedBy = req.user._id;
  await report.save();
  res.json({ success: true });
});

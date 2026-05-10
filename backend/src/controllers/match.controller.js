const Match = require("../models/Match");
const Chat = require("../models/Chat");
const JoinRequest = require("../models/JoinRequest");
const { asyncHandler, AppError, buildPaginationMeta } = require("../utils/helpers");

// GET /api/matches - geo-filtered match discovery
exports.getMatches = asyncHandler(async (req, res) => {
  const {
    lat, lng, radius = 10, sport, skillRequired,
    date, status = "open", sort = "distance",
    page = 1, limit = 12, search,
  } = req.query;

  const filter = {};
  if (status !== "all") filter.status = status;
  if (sport && sport !== "all") filter.sport = sport;
  if (skillRequired) filter.skillRequired = { $in: [skillRequired, "any"] };

  if (date) {
    const d = new Date(date);
    filter.date = {
      $gte: new Date(d.setHours(0, 0, 0, 0)),
      $lte: new Date(d.setHours(23, 59, 59, 999)),
    };
  } else {
    filter.date = { $gte: new Date() };
  }

  if (search) filter.title = { $regex: search, $options: "i" };

  let query;
  if (lat && lng) {
    query = Match.find({
      ...filter,
      location: {
        $nearSphere: {
          $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseFloat(radius) * 1000,
        },
      },
    });
  } else {
    query = Match.find(filter);
    const sortMap = { latest: { createdAt: -1 }, popular: { viewCount: -1 }, date: { date: 1 } };
    query = query.sort(sortMap[sort] || { createdAt: -1 });
  }

  const total = await Match.countDocuments(filter);
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const matches = await query
    .skip(skip)
    .limit(parseInt(limit))
    .populate("organizer", "name avatar averageRating skillLevel")
    .lean();

  res.json({
    success: true,
    data: matches,
    pagination: buildPaginationMeta(total, page, limit),
  });
});

// GET /api/matches/:id — INCLUDES current user's relationship to the match
exports.getMatchById = asyncHandler(async (req, res, next) => {
  const match = await Match.findByIdAndUpdate(
    req.params.id,
    { $inc: { viewCount: 1 } },
    { new: true }
  )
    .populate("organizer", "name avatar averageRating skillLevel bio")
    .populate("participants.user", "name avatar skillLevel averageRating")
    .populate("waitingList.user", "name avatar")
    .lean();

  if (!match) return next(new AppError("Match not found.", 404));

  // ─── Add current user's status (key fix) ──────────
  let myStatus = {
    isOrganizer:    false,
    isParticipant:  false,
    isOnWaitlist:   false,
    requestStatus:  null,    // "pending" | "accepted" | "rejected" | "cancelled" | null
    canRequest:     true,    // false if already in / pending / full and no waitlist
    canWithdraw:    false,   // true if accepted participant (not organizer)
  };

  if (req.user) {
    const userId = req.user._id.toString();
    myStatus.isOrganizer    = match.organizer._id.toString() === userId;
    myStatus.isParticipant  = match.participants.some((p) => p.user?._id.toString() === userId);
    myStatus.isOnWaitlist   = match.waitingList?.some((w) => w.user?._id.toString() === userId);

    // Look up most recent join-request from this user for this match
    const lastRequest = await JoinRequest.findOne({
      match: match._id,
      player: userId,
    }).sort({ createdAt: -1 }).lean();

    if (lastRequest) myStatus.requestStatus = lastRequest.status;

    myStatus.canRequest =
      !myStatus.isOrganizer &&
      !myStatus.isParticipant &&
      lastRequest?.status !== "pending" &&
      lastRequest?.status !== "accepted";

    myStatus.canWithdraw = myStatus.isParticipant && !myStatus.isOrganizer;
  }

  res.json({ success: true, data: { ...match, myStatus } });
});

// POST /api/matches
exports.createMatch = asyncHandler(async (req, res) => {
  const {
    title, sport, description, lat, lng, address, city, groundName,
    date, startTime, duration, totalSlots, skillRequired,
    entryFee, visibility,
  } = req.body;

  const match = await Match.create({
    title, sport, description,
    location: {
      type: "Point",
      coordinates: [parseFloat(lng), parseFloat(lat)],
      address, city, groundName,
    },
    date,
    startTime,
    duration: duration || 120,
    totalSlots: parseInt(totalSlots),
    skillRequired: skillRequired || "any",
    entryFee: parseFloat(entryFee) || 0,
    isFree: !entryFee || parseFloat(entryFee) === 0,
    visibility: visibility || "public",
    organizer: req.user._id,
    participants: [{ user: req.user._id }], // organizer auto-joins
  });

  // Auto-create group chat with organizer
  const chat = await Chat.create({
    type: "group",
    name: match.title,
    participants: [req.user._id],
    match: match._id,
    admin: req.user._id,
  });

  match.groupChat = chat._id;
  await match.save();

  req.user.matchesOrganised += 1;
  await req.user.save({ validateBeforeSave: false });

  const populated = await Match.findById(match._id).populate("organizer", "name avatar");
  res.status(201).json({ success: true, data: populated });
});

// PUT /api/matches/:id
exports.updateMatch = asyncHandler(async (req, res, next) => {
  const match = await Match.findById(req.params.id);
  if (!match) return next(new AppError("Match not found.", 404));

  if (match.organizer.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    return next(new AppError("Not authorised to update this match.", 403));
  }

  if (req.body.totalSlots && parseInt(req.body.totalSlots) < match.participants.length) {
    return next(new AppError("Cannot reduce slots below current participant count.", 400));
  }

  const updated = await Match.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate("organizer", "name avatar");

  res.json({ success: true, data: updated });
});

// DELETE /api/matches/:id
exports.deleteMatch = asyncHandler(async (req, res, next) => {
  const match = await Match.findById(req.params.id);
  if (!match) return next(new AppError("Match not found.", 404));

  if (match.organizer.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    return next(new AppError("Not authorised.", 403));
  }

  // Also delete the group chat
  if (match.groupChat) await Chat.findByIdAndDelete(match.groupChat);
  await match.deleteOne();
  res.json({ success: true, message: "Match deleted." });
});

// POST /api/matches/:id/leave — NEW: accepted player withdraws from match
exports.leaveMatch = asyncHandler(async (req, res, next) => {
  const match = await Match.findById(req.params.id);
  if (!match) return next(new AppError("Match not found.", 404));

  const userId = req.user._id.toString();

  if (match.organizer.toString() === userId) {
    return next(new AppError("Organizer cannot leave their own match. Delete it instead.", 400));
  }

  const wasParticipant = match.participants.some((p) => p.user.toString() === userId);
  if (!wasParticipant) {
    return next(new AppError("You are not in this match.", 400));
  }

  // Remove from participants
  match.participants = match.participants.filter((p) => p.user.toString() !== userId);

  // Promote first person from waitlist if any
  if (match.waitingList && match.waitingList.length > 0) {
    const promoted = match.waitingList.shift();
    match.participants.push({ user: promoted.user });

    // Notify the promoted user
    const Notification = require("../models/Notification");
    const notif = await Notification.create({
      recipient: promoted.user,
      sender: req.user._id,
      type: "request_accepted",
      title: "You're in! 🎉",
      message: `A spot opened up in "${match.title}". You've been moved off the waitlist!`,
      match: match._id,
      chat: match.groupChat,
    });

    const { emitToUser } = require("../config/socket");
    emitToUser(req.io, promoted.user.toString(), "notification:new", notif);

    // Add the promoted user to the group chat too
    if (match.groupChat) {
      await Chat.findByIdAndUpdate(match.groupChat, {
        $addToSet: { participants: promoted.user },
      });
    }
  }

  await match.save();

  // Remove this user from the group chat
  if (match.groupChat) {
    await Chat.findByIdAndUpdate(match.groupChat, {
      $pull: { participants: req.user._id },
    });
  }

  // Mark their previous join-request as cancelled so they can re-request
  await JoinRequest.findOneAndUpdate(
    { match: match._id, player: req.user._id, status: "accepted" },
    { status: "cancelled" }
  );

  res.json({ success: true, message: "You have left the match." });
});

// GET /api/matches/my
exports.getMyMatches = asyncHandler(async (req, res) => {
  const matches = await Match.find({ organizer: req.user._id })
    .sort({ createdAt: -1 })
    .populate("participants.user", "name avatar");
  res.json({ success: true, data: matches });
});

// GET /api/matches/joined
exports.getJoinedMatches = asyncHandler(async (req, res) => {
  const matches = await Match.find({ "participants.user": req.user._id })
    .sort({ date: 1 })
    .populate("organizer", "name avatar");
  res.json({ success: true, data: matches });
});

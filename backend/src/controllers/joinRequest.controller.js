const Match = require("../models/Match");
const { JoinRequest, Notification, Chat } = require("../models/index");
const { asyncHandler, AppError } = require("../utils/helpers");
const { emitToUser } = require("../config/socket");

// POST /api/join-requests - Send join request
exports.sendRequest = asyncHandler(async (req, res, next) => {
  const { matchId, message } = req.body;

  const match = await Match.findById(matchId);
  if (!match) return next(new AppError("Match not found.", 404));
  if (match.status !== "open") return next(new AppError("Match is not open for requests.", 400));
  if (match.organizer.toString() === req.user._id.toString()) {
    return next(new AppError("You cannot request to join your own match.", 400));
  }

  // Check if already participant
  const isParticipant = match.participants.some(
    (p) => p.user.toString() === req.user._id.toString()
  );
  if (isParticipant) return next(new AppError("You are already in this match.", 400));

  // Check existing request
  const existing = await JoinRequest.findOne({ match: matchId, player: req.user._id });
  if (existing && existing.status === "pending") {
    return next(new AppError("You already have a pending request for this match.", 400));
  }
  if (existing) {
    // Re-activate rejected/cancelled request
    existing.status = "pending";
    existing.message = message;
    await existing.save();
    return res.json({ success: true, data: existing });
  }

  const request = await JoinRequest.create({
    match: matchId,
    player: req.user._id,
    organizer: match.organizer,
    message,
  });

  // Notify organizer
  const notification = await Notification.create({
    recipient: match.organizer,
    sender: req.user._id,
    type: "join_request",
    title: "New Join Request",
    message: `${req.user.name} wants to join ${match.title}`,
    match: matchId,
    joinRequest: request._id,
  });

  // Realtime emit
  emitToUser(req.io, match.organizer.toString(), "notification:new", notification);

  await request.populate("player", "name avatar skillLevel");
  res.status(201).json({ success: true, data: request });
});

// GET /api/join-requests/match/:matchId - Get requests for a match (organizer)
exports.getMatchRequests = asyncHandler(async (req, res, next) => {
  const match = await Match.findById(req.params.matchId);
  if (!match) return next(new AppError("Match not found.", 404));

  if (match.organizer.toString() !== req.user._id.toString()) {
    return next(new AppError("Not authorised.", 403));
  }

  const requests = await JoinRequest.find({ match: req.params.matchId, status: "pending" })
    .populate("player", "name avatar skillLevel averageRating matchesPlayed bio")
    .sort({ createdAt: -1 });

  res.json({ success: true, data: requests });
});

// PUT /api/join-requests/:id/accept
exports.acceptRequest = asyncHandler(async (req, res, next) => {
  const request = await JoinRequest.findById(req.params.id).populate("match player");
  if (!request) return next(new AppError("Request not found.", 404));

  if (request.organizer.toString() !== req.user._id.toString()) {
    return next(new AppError("Not authorised.", 403));
  }

  const match = request.match;

  if (match.participants.length >= match.totalSlots) {
    // Add to waiting list
    const alreadyWaiting = match.waitingList.some(
      (w) => w.user.toString() === request.player._id.toString()
    );
    if (!alreadyWaiting) {
      match.waitingList.push({ user: request.player._id });
      await match.save();
    }
    request.status = "accepted";
    await request.save();

    const notif = await Notification.create({
      recipient: request.player._id,
      sender: req.user._id,
      type: "request_accepted",
      title: "Match is Full — Added to Waitlist",
      message: `You've been added to the waitlist for ${match.title}.`,
      match: match._id,
    });
    emitToUser(req.io, request.player._id.toString(), "notification:new", notif);

    return res.json({ success: true, message: "Match full. Player added to waitlist." });
  }

  // Add to participants
  match.participants.push({ user: request.player._id });
  await match.save();

  // Add to group chat
  await Chat.findByIdAndUpdate(match.groupChat, {
    $addToSet: { participants: request.player._id },
  });

  request.status = "accepted";
  request.respondedAt = new Date();
  await request.save();

  // Notify player
  const notif = await Notification.create({
    recipient: request.player._id,
    sender: req.user._id,
    type: "request_accepted",
    title: "Request Accepted! 🎉",
    message: `Your request to join ${match.title} was accepted.`,
    match: match._id,
    chat: match.groupChat,
  });
  emitToUser(req.io, request.player._id.toString(), "notification:new", notif);
  emitToUser(req.io, request.player._id.toString(), "match:joined", { match });

  res.json({ success: true, data: request, message: "Request accepted." });
});

// PUT /api/join-requests/:id/reject
exports.rejectRequest = asyncHandler(async (req, res, next) => {
  const request = await JoinRequest.findById(req.params.id).populate("match");
  if (!request) return next(new AppError("Request not found.", 404));

  if (request.organizer.toString() !== req.user._id.toString()) {
    return next(new AppError("Not authorised.", 403));
  }

  request.status = "rejected";
  request.respondedAt = new Date();
  await request.save();

  const notif = await Notification.create({
    recipient: request.player,
    sender: req.user._id,
    type: "request_rejected",
    title: "Request Not Accepted",
    message: `Your request to join ${request.match.title} was not accepted this time.`,
    match: request.match._id,
  });
  emitToUser(req.io, request.player.toString(), "notification:new", notif);

  res.json({ success: true, message: "Request rejected." });
});

// PUT /api/join-requests/:id/cancel - Player cancels their own request
exports.cancelRequest = asyncHandler(async (req, res, next) => {
  const request = await JoinRequest.findOne({ _id: req.params.id, player: req.user._id });
  if (!request) return next(new AppError("Request not found.", 404));
  if (request.status !== "pending") return next(new AppError("Cannot cancel a responded request.", 400));

  request.status = "cancelled";
  await request.save();

  res.json({ success: true, message: "Request cancelled." });
});

// DELETE /api/join-requests/match/:matchId/player/:userId - Organizer removes player
exports.removePlayer = asyncHandler(async (req, res, next) => {
  const match = await Match.findById(req.params.matchId);
  if (!match) return next(new AppError("Match not found.", 404));

  if (match.organizer.toString() !== req.user._id.toString()) {
    return next(new AppError("Not authorised.", 403));
  }

  match.participants = match.participants.filter(
    (p) => p.user.toString() !== req.params.userId
  );

  // Promote from waitlist if available
  if (match.waitingList.length > 0) {
    const next_player = match.waitingList.shift();
    match.participants.push({ user: next_player.user });

    const notif = await Notification.create({
      recipient: next_player.user,
      sender: req.user._id,
      type: "request_accepted",
      title: "You're in! 🎉",
      message: `A spot opened up in ${match.title}. You've been moved from the waitlist!`,
      match: match._id,
    });
    emitToUser(req.io, next_player.user.toString(), "notification:new", notif);
  }

  await match.save();

  // Notify removed player
  const notif = await Notification.create({
    recipient: req.params.userId,
    sender: req.user._id,
    type: "player_removed",
    title: "Removed from Match",
    message: `You have been removed from ${match.title}.`,
    match: match._id,
  });
  emitToUser(req.io, req.params.userId, "notification:new", notif);

  res.json({ success: true, message: "Player removed." });
});

// GET /api/join-requests/my - Current user's sent requests
exports.getMyRequests = asyncHandler(async (req, res) => {
  const requests = await JoinRequest.find({ player: req.user._id })
    .populate("match", "title sport date status location organizer")
    .sort({ createdAt: -1 });

  res.json({ success: true, data: requests });
});

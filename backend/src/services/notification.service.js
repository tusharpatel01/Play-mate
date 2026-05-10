const { Notification } = require("../models/index");
const { emitToUser } = require("../config/socket");

/**
 * Create a notification and emit it in realtime.
 * @param {object} io - Socket.io server instance
 * @param {object} payload - Notification fields
 */
const notify = async (io, payload) => {
  try {
    const notif = await Notification.create(payload);
    const populated = await notif.populate("sender", "name avatar");
    if (io) emitToUser(io, payload.recipient.toString(), "notification:new", populated);
    return populated;
  } catch (err) {
    console.error("Notification error:", err.message);
  }
};

// ─── Pre-built notification factories ────────────────────
const notifyJoinRequest = (io, { organizerId, player, match, requestId }) =>
  notify(io, {
    recipient: organizerId,
    sender: player._id,
    type: "join_request",
    title: "New Join Request",
    message: `${player.name} wants to join "${match.title}"`,
    match: match._id,
    joinRequest: requestId,
  });

const notifyRequestAccepted = (io, { playerId, organizerId, match }) =>
  notify(io, {
    recipient: playerId,
    sender: organizerId,
    type: "request_accepted",
    title: "Request Accepted! 🎉",
    message: `You've been accepted into "${match.title}". Time to play!`,
    match: match._id,
    chat: match.groupChat,
  });

const notifyRequestRejected = (io, { playerId, organizerId, match }) =>
  notify(io, {
    recipient: playerId,
    sender: organizerId,
    type: "request_rejected",
    title: "Request Not Accepted",
    message: `Your request for "${match.title}" was not accepted this time.`,
    match: match._id,
  });

const notifyPlayerRemoved = (io, { playerId, organizerId, match }) =>
  notify(io, {
    recipient: playerId,
    sender: organizerId,
    type: "player_removed",
    title: "Removed from Match",
    message: `You have been removed from "${match.title}".`,
    match: match._id,
  });

const notifyWaitlistPromoted = (io, { playerId, organizerId, match }) =>
  notify(io, {
    recipient: playerId,
    sender: organizerId,
    type: "request_accepted",
    title: "You're in! 🎉",
    message: `A spot opened up in "${match.title}" — you're off the waitlist!`,
    match: match._id,
    chat: match.groupChat,
  });

const notifyNewNearbyMatch = (io, { userId, match }) =>
  notify(io, {
    recipient: userId,
    type: "new_nearby_match",
    title: "New Match Nearby 📍",
    message: `A new ${match.sport} match was posted near you: "${match.title}"`,
    match: match._id,
  });

module.exports = {
  notify,
  notifyJoinRequest,
  notifyRequestAccepted,
  notifyRequestRejected,
  notifyPlayerRemoved,
  notifyWaitlistPromoted,
  notifyNewNearbyMatch,
};

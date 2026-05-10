// ─── Barrel export for all models ─────────────────────────
// Each model lives in its own file; this lets you import either way:
//   const Chat = require("../models/Chat");
//   const { Chat, Message } = require("../models");

module.exports = {
  User:         require("./User"),
  Match:        require("./Match"),
  JoinRequest:  require("./JoinRequest"),
  Chat:         require("./Chat"),
  Message:      require("./Message"),
  Notification: require("./Notification"),
  Review:       require("./Review"),
  Report:       require("./Report"),
};

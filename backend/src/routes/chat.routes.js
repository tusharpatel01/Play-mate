const express = require("express");
const router = express.Router();
const {
  getMyChats, getChatById, getMessages, getOrCreateDirectChat, deleteMessage,
} = require("../controllers/chat.controller");
const { protect } = require("../middleware/auth");

router.get("/",                                  protect, getMyChats);
router.get("/:id",                               protect, getChatById);
router.get("/:id/messages",                      protect, getMessages);
router.post("/direct",                           protect, getOrCreateDirectChat);
router.delete("/:chatId/messages/:messageId",    protect, deleteMessage);

module.exports = router;

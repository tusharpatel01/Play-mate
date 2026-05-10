const express = require("express");
const router = express.Router();
const {
  getNotifications, markAsRead, markOneAsRead, getUnreadCount,
} = require("../controllers/misc.controller");
const { protect } = require("../middleware/auth");

router.get("/",               protect, getNotifications);
router.get("/unread-count",   protect, getUnreadCount);
router.put("/read-all",       protect, markAsRead);
router.put("/:id/read",       protect, markOneAsRead);

module.exports = router;

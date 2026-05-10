const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  adminGetStats, adminGetUsers, adminBanUser,
  adminUnbanUser, adminGetReports, adminResolveReport,
} = require("../controllers/misc.controller");

router.use(protect, authorize("admin"));

router.get("/stats",                    adminGetStats);
router.get("/users",                    adminGetUsers);
router.put("/users/:userId/ban",        adminBanUser);
router.put("/users/:userId/unban",      adminUnbanUser);
router.get("/reports",                  adminGetReports);
router.put("/reports/:reportId",        adminResolveReport);

module.exports = router;

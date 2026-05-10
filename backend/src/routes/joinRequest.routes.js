const express = require("express");
const router = express.Router();
const {
  sendRequest, getMatchRequests, acceptRequest, rejectRequest,
  cancelRequest, removePlayer, getMyRequests,
} = require("../controllers/joinRequest.controller");
const { protect } = require("../middleware/auth");
const { sendJoinRequestValidator } = require("../validators");
const { joinRequestLimiter } = require("../middleware/rateLimiter");

router.get("/my",                                protect,                              getMyRequests);
router.get("/match/:matchId",                    protect,                              getMatchRequests);
router.post("/",                                 protect, joinRequestLimiter, sendJoinRequestValidator, sendRequest);
router.put("/:id/accept",                        protect,                              acceptRequest);
router.put("/:id/reject",                        protect,                              rejectRequest);
router.put("/:id/cancel",                        protect,                              cancelRequest);
router.delete("/match/:matchId/player/:userId",  protect,                              removePlayer);

module.exports = router;

const express = require("express");
const router = express.Router();
const { createReview, getUserReviews, createReport } = require("../controllers/misc.controller");
const { protect } = require("../middleware/auth");
const { createReviewValidator } = require("../validators");

router.post("/",              protect, createReviewValidator, createReview);
router.get("/user/:userId",                                   getUserReviews);
router.post("/report",        protect,                        createReport);

module.exports = router;

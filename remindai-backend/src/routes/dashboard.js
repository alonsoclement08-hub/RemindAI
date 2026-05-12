const express = require("express");
const authMiddleware = require("../middleware/auth");
const { getDailySummary } = require("../services/dailySummary");

const router = express.Router();
router.use(authMiddleware);

// GET /api/dashboard/daily-summary
router.get("/daily-summary", async (req, res) => {
  try {
    const summary = await getDailySummary(req.user.userId);
    res.json(summary);
  } catch (err) {
    console.error("Daily summary error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

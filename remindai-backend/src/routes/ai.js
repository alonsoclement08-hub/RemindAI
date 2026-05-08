const express = require("express");
const authMiddleware = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { parseSchema, adviceSchema, suggestSchema } = require("../schemas/ai");
const gemmaService = require("../services/gemma");

const router = express.Router();
router.use(authMiddleware);

// POST /api/ai/parse
// Parse reminder text with Gemma and return structured entities
router.post("/parse", validate(parseSchema), async (req, res) => {
  const { text } = req.body;
  try {
    const result = await gemmaService.parseText(text);
    res.json(result);
  } catch (err) {
    console.error("AI parse error:", err.message);
    res.status(503).json({ error: "AI service unavailable", detail: err.message });
  }
});

// POST /api/ai/advice
// Get intelligent advice and suggestions after a reminder is created
router.post("/advice", validate(adviceSchema), async (req, res) => {
  try {
    const result = await gemmaService.getAdvice(req.body);
    res.json(result);
  } catch (err) {
    console.error("AI advice error:", err.message);
    res.status(503).json({ error: "AI service unavailable", detail: err.message });
  }
});

// POST /api/ai/suggest
// Suggest reminders based on user behaviour patterns
router.post("/suggest", validate(suggestSchema), async (req, res) => {
  const { limit = 3, ...context } = req.body;
  try {
    const suggestions = await gemmaService.suggestReminders(context, limit);
    res.json({ suggestions });
  } catch (err) {
    console.error("AI suggest error:", err.message);
    res.status(503).json({ error: "AI service unavailable", detail: err.message });
  }
});

module.exports = router;

const express = require("express");
const authMiddleware = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { parseSchema, suggestSchema } = require("../schemas/ai");
const ollamaService = require("../services/ollama");

const router = express.Router();
router.use(authMiddleware);

// POST /api/ai/parse
// Parse a reminder text with Mistral 7B and return structured entities
router.post("/parse", validate(parseSchema), async (req, res) => {
  const { text } = req.body;
  try {
    const result = await ollamaService.parseText(text);
    res.json(result);
  } catch (err) {
    console.error("AI parse error:", err.message);
    res.status(503).json({ error: "AI service unavailable", detail: err.message });
  }
});

// POST /api/ai/suggest
// Suggest reminders based on user behaviour patterns
router.post("/suggest", validate(suggestSchema), async (req, res) => {
  const { limit = 3, ...context } = req.body;
  try {
    const suggestions = await ollamaService.suggestReminders(context, limit);
    res.json({ suggestions });
  } catch (err) {
    console.error("AI suggest error:", err.message);
    res.status(503).json({ error: "AI service unavailable", detail: err.message });
  }
});

module.exports = router;

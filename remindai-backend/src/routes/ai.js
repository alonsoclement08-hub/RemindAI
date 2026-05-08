const express = require("express");
const authMiddleware = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { parseSchema, adviceSchema, chatSchema, recommendationsSchema, suggestSchema } = require("../schemas/ai");
const gemmaService = require("../services/gemma");
const { detectQCM } = require("../utils/detectQCM");
const qcmTemplates = require("../utils/qcmTemplates");

const router = express.Router();
router.use(authMiddleware);

// POST /api/ai/parse
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
router.post("/advice", validate(adviceSchema), async (req, res) => {
  try {
    const result = await gemmaService.getAdvice(req.body);
    res.json(result);
  } catch (err) {
    console.error("AI advice error:", err.message);
    res.status(503).json({ error: "AI service unavailable", detail: err.message });
  }
});

// POST /api/ai/chat
// Parse + advice in one Ollama call; also injects QCM template when applicable
router.post("/chat", validate(chatSchema), async (req, res) => {
  const { message } = req.body;
  try {
    const result = await gemmaService.chat(message);

    // Attach QCM template if one matches (uses AI result for reminderType)
    const qcmKey = detectQCM(
      message,
      result?.reminder?.category,
      result?.reminder?.reminderType
    );
    result.qcm = qcmKey ? { key: qcmKey, ...qcmTemplates[qcmKey] } : null;

    res.json(result);
  } catch (err) {
    console.error("AI chat error:", err.message);
    res.status(503).json({ error: "AI service unavailable", detail: err.message });
  }
});

// POST /api/ai/recommendations
// Generate personalised advice from QCM answers
router.post("/recommendations", validate(recommendationsSchema), async (req, res) => {
  const { message, answers } = req.body;
  try {
    const result = await gemmaService.generateRecommendations(message, answers);
    res.json(result);
  } catch (err) {
    console.error("AI recommendations error:", err.message);
    res.status(503).json({ error: "AI service unavailable", detail: err.message });
  }
});

// POST /api/ai/suggest
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

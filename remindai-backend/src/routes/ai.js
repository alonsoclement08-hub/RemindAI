const express = require("express");
const authMiddleware = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { parseSchema, adviceSchema, chatSchema, recommendationsSchema, suggestSchema } = require("../schemas/ai");
const gemmaService = require("../services/gemma");
const { detectQCM } = require("../utils/detectQCM");
const qcmTemplates = require("../utils/qcmTemplates");
const { getSmartRecommendations } = require("../services/aiRecommendations");
const { updatePreference, batchLearnFromHistory, getPreferences, resetPreferences } = require("../services/learningService");
const prisma = require("../services/prisma");

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

// GET /api/ai/smart-recommendations — personalized suggestions from user history
router.get("/smart-recommendations", async (req, res) => {
  try {
    const result = await getSmartRecommendations(req.user.userId);

    // Enrich with user preference scores
    const preferences = await getPreferences(req.user.userId);
    const prefMap = {};
    for (const p of preferences) prefMap[p.category] = p;

    if (result.recommendations) {
      // Filter out strongly disliked categories (score < 0.3 with >= 3 interactions)
      result.recommendations = result.recommendations.filter((rec) => {
        const pref = prefMap[rec.category];
        if (!pref) return true;
        const hasEnoughData = pref.timesCompleted + pref.timesIgnored >= 3;
        return !hasEnoughData || pref.score >= 0.3;
      });

      // Sort by preference score descending
      result.recommendations.sort((a, b) => {
        const scoreA = prefMap[a.category]?.score ?? 0.5;
        const scoreB = prefMap[b.category]?.score ?? 0.5;
        return scoreB - scoreA;
      });

      // Override confidence from preference score when available
      result.recommendations = result.recommendations.map((rec) => {
        const pref = prefMap[rec.category];
        if (pref && pref.timesCompleted + pref.timesIgnored > 0) {
          const ratio = pref.timesCompleted / (pref.timesCompleted + pref.timesIgnored + 1);
          rec.confidence = Math.max(0.3, Math.min(1, ratio));
        }
        return rec;
      });
    }

    res.json(result);
  } catch (err) {
    console.error("Smart recommendations error:", err.message);
    res.status(503).json({ error: "AI service unavailable", detail: err.message });
  }
});

// POST /api/ai/reminder-advice — conversational advice specific to one reminder
router.post("/reminder-advice", async (req, res) => {
  const { reminderId } = req.body;
  if (!reminderId) return res.status(400).json({ error: "reminderId required" });

  const userId = req.user.userId;

  try {
    // Fetch the reminder
    const reminder = await prisma.reminder.findFirst({
      where: { id: reminderId, userId, deletedAt: null },
    });
    if (!reminder) return res.status(404).json({ error: "Reminder not found" });

    // How many times has this category been completed?
    const categoryHistory = await prisma.reminder.findMany({
      where: { userId, category: reminder.category, deletedAt: null },
      select: { completedAt: true, createdAt: true, title: true },
      orderBy: { completedAt: 'desc' },
      take: 50,
    });
    const completedSameCategory = categoryHistory.filter((r) => r.completedAt);
    const lastCompleted = completedSameCategory[0]?.completedAt || null;

    // Today's completions
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const completedToday = await prisma.reminder.count({
      where: { userId, deletedAt: null, completedAt: { gte: todayStart } },
    });

    // User preference for this category
    const pref = await prisma.userPreference.findUnique({
      where: { userId_category: { userId, category: reminder.category } },
    });

    // Feedback history for this specific reminder (how many times ignored)
    const feedbackCount = await prisma.recommendationFeedback.count({
      where: { userId, reminderId, action: 'snoozed' },
    });

    // Patterns
    let patterns = null;
    try {
      const recoResult = await getSmartRecommendations(userId);
      patterns = recoResult.patterns;
    } catch (_) {}

    // Build rich context parts
    const now = new Date();
    const contextParts = [];

    contextParts.push(`Rappel: "${reminder.title}" (catégorie: ${reminder.category}, priorité: ${reminder.priority}/4)`);

    if (reminder.scheduledAt) {
      const diffH = Math.round((new Date(reminder.scheduledAt) - now) / 3600000);
      if (diffH < 0) contextParts.push(`⚠️ En retard de ${Math.abs(diffH)}h`);
      else if (diffH <= 2) contextParts.push(`⏰ Prévu dans ${diffH}h — deadline proche`);
      else contextParts.push(`Prévu dans ${diffH}h`);
    }

    contextParts.push(`Catégorie ${reminder.category}: ${completedSameCategory.length} rappels complétés au total`);

    if (lastCompleted) {
      const daysSince = Math.round((now - new Date(lastCompleted)) / 86400000);
      contextParts.push(`Dernière fois pour cette catégorie: il y a ${daysSince} jour${daysSince > 1 ? 's' : ''}`);
    }

    if (pref) {
      const total = pref.timesCompleted + pref.timesIgnored;
      if (total > 0) {
        const rate = Math.round((pref.timesCompleted / total) * 100);
        contextParts.push(`Taux de completion pour ${reminder.category}: ${rate}%`);
      }
    }

    if (feedbackCount > 0) {
      contextParts.push(`Ce rappel a été repoussé ${feedbackCount} fois`);
    }

    contextParts.push(`${completedToday} rappels déjà complétés aujourd'hui`);

    if (patterns?.favoriteTime?.[0]) {
      contextParts.push(`Meilleur moment pour ${reminder.category}: ${patterns.favoriteTime[0]}`);
    }
    if (patterns?.favoriteDay?.[0]) {
      contextParts.push(`Jour le plus productif: ${patterns.favoriteDay[0]}`);
    }

    const h = now.getHours();
    contextParts.push(`Il est actuellement ${h}h${String(now.getMinutes()).padStart(2, '0')}`);

    const result = await gemmaService.generateAdvice({
      type: 'reminder_specific',
      patterns,
      recentReminders: [{ title: reminder.title, category: reminder.category, completedAt: reminder.completedAt, priority: reminder.priority }],
      weekStats: null,
      preferences: pref ? [pref] : [],
      _contextOverride: contextParts.join('\n'),
    });

    res.json(result);
  } catch (err) {
    console.error("Reminder advice error:", err.message);
    res.status(503).json({ error: "AI service unavailable" });
  }
});

// POST /api/ai/generate-advice — conversational AI advice using all available context
router.post("/generate-advice", async (req, res) => {
  const { type = 'daily_summary', extraContext = {} } = req.body;

  try {
    const userId = req.user.userId;

    // Gather patterns
    let patterns = null;
    try {
      const recoResult = await getSmartRecommendations(userId);
      patterns = recoResult.patterns;
    } catch (_) {}

    // Recent reminders
    const recentReminders = await prisma.reminder.findMany({
      where: { userId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: { title: true, category: true, completedAt: true, priority: true, scheduledAt: true, createdAt: true },
    });

    // Week stats
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);

    const allRecent = await prisma.reminder.findMany({
      where: { userId, deletedAt: null, completedAt: { gte: prevWeekStart } },
      select: { completedAt: true },
    });
    const completedThisWeek = allRecent.filter((r) => new Date(r.completedAt) >= weekStart).length;
    const completedPrevWeek = allRecent.filter((r) => new Date(r.completedAt) < weekStart).length;

    // Preferences
    const preferences = await getPreferences(userId);

    const context = {
      type,
      patterns,
      recentReminders,
      weekStats: { completed: completedThisWeek, prevWeek: completedPrevWeek },
      preferences: preferences.slice(0, 5),
      time: now.toISOString(),
      ...extraContext,
    };

    const result = await gemmaService.generateAdvice(context);
    res.json(result);
  } catch (err) {
    console.error("Generate advice error:", err.message);
    res.status(503).json({ error: "AI service unavailable", detail: err.message });
  }
});

// POST /api/ai/feedback — record user action + update preference score
router.post("/feedback", async (req, res) => {
  const { reminderId, category, action, rating } = req.body;
  if (!action) return res.status(400).json({ error: "action required" });

  try {
    await prisma.recommendationFeedback.create({
      data: {
        userId: req.user.userId,
        reminderId: reminderId || null,
        category: category || null,
        action,
        rating: rating || null,
      },
    });

    let newScore = null;
    if (category) {
      newScore = await updatePreference(req.user.userId, category, action);
    }

    res.json({ success: true, newScore });
  } catch (err) {
    console.error("Feedback error:", err.message);
    res.status(500).json({ error: "Failed to save feedback" });
  }
});

// POST /api/ai/learn-preferences — batch learn from reminder history
router.post("/learn-preferences", async (req, res) => {
  try {
    const learned = await batchLearnFromHistory(req.user.userId);
    res.json({ learned, success: true });
  } catch (err) {
    console.error("Learn preferences error:", err.message);
    res.status(500).json({ error: "Failed to learn preferences" });
  }
});

// GET /api/ai/preferences — get learned preferences + patterns
router.get("/preferences", async (req, res) => {
  try {
    const preferences = await getPreferences(req.user.userId);
    let patterns = null;
    try {
      const result = await getSmartRecommendations(req.user.userId);
      patterns = result.patterns || null;
    } catch (_) {}
    res.json({ preferences, patterns });
  } catch (err) {
    console.error("Get preferences error:", err.message);
    res.status(500).json({ error: "Failed to get preferences" });
  }
});

// DELETE /api/ai/preferences — reset all learned preferences
router.delete("/preferences", async (req, res) => {
  try {
    await resetPreferences(req.user.userId);
    res.json({ success: true });
  } catch (err) {
    console.error("Reset preferences error:", err.message);
    res.status(500).json({ error: "Failed to reset preferences" });
  }
});

module.exports = router;

const prisma = require("./prisma");
const redis = require("./redis");
const { callGemma, extractJSON } = require("./gemma");

const CACHE_TTL = 14400; // 4h — patterns shift slowly
const DAY_NAMES_FR = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const HOUR_BUCKETS = [
  { label: "matin",       min: 5,  max: 11 },
  { label: "après-midi",  min: 12, max: 17 },
  { label: "soir",        min: 18, max: 22 },
  { label: "nuit",        min: 23, max: 4  },
];

// ─── Pattern analysis (pure JS, no AI) ───────────────────────────────────────

function analyzePatterns(history) {
  if (history.length === 0) return null;

  const categories = {};
  const days = {};
  const times = {};
  let completedCount = 0;

  for (const r of history) {
    // Category counts
    categories[r.category] = (categories[r.category] || 0) + 1;

    if (r.completedAt) {
      completedCount++;
      const d = new Date(r.completedAt);

      // Day of week
      const dayName = DAY_NAMES_FR[d.getDay()];
      days[dayName] = (days[dayName] || 0) + 1;

      // Time bucket
      const h = d.getHours();
      const bucket = HOUR_BUCKETS.find((b) =>
        b.min <= b.max ? h >= b.min && h <= b.max : h >= b.min || h <= b.max
      ) ?? HOUR_BUCKETS[0];
      times[bucket.label] = (times[bucket.label] || 0) + 1;
    }
  }

  const topCategories = Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat, count]) => ({ category: cat, count }));

  const favoriteDay = Object.entries(days).sort((a, b) => b[1] - a[1])[0] ?? null;
  const busiestDay = favoriteDay;
  const lightestDay = Object.entries(days).sort((a, b) => a[1] - b[1])[0] ?? null;
  const favoriteTime = Object.entries(times).sort((a, b) => b[1] - a[1])[0] ?? null;

  const totalReminders = history.length;
  const completionRate = totalReminders > 0 ? Math.round((completedCount / totalReminders) * 100) : 0;

  // Human-readable summary for the AI prompt
  const summary = [
    topCategories.length > 0 && `Catégories les plus fréquentes: ${topCategories.map((c) => `${c.category} (${c.count}x)`).join(", ")}`,
    favoriteDay && `Jour préféré: ${favoriteDay[0]} (${favoriteDay[1]} rappels)`,
    favoriteTime && `Moment préféré: ${favoriteTime[0]}`,
    `Taux de complétion: ${completionRate}%`,
  ]
    .filter(Boolean)
    .join(". ");

  return {
    topCategories,
    favoriteDay: favoriteDay ? { day: favoriteDay[0], count: favoriteDay[1] } : null,
    busiestDay: busiestDay ? { day: busiestDay[0], count: busiestDay[1] } : null,
    lightestDay: lightestDay ? { day: lightestDay[0], count: lightestDay[1] } : null,
    favoriteTime: favoriteTime ? { period: favoriteTime[0], count: favoriteTime[1] } : null,
    completionRate,
    totalReminders,
    summary,
  };
}

// ─── AI generation prompt ─────────────────────────────────────────────────────

const RECO_PROMPT = (patterns, recentTitles, today) => `Tu es RemindAI, assistant intelligent. Réponds TOUJOURS en français.

Analyse des habitudes de l'utilisateur:
${patterns.summary}

Rappels récents complétés (derniers 10): ${recentTitles.join(", ")}

Aujourd'hui: ${DAY_NAMES_FR[today.getDay()]}, ${today.getHours()}h

Génère 3 recommandations personnalisées. Retourne UNIQUEMENT ce JSON valide (sans markdown):
{
  "recommendations": [
    {
      "title": "titre du rappel suggéré (court et précis)",
      "reason": "raison personnalisée (max 15 mots, réfère-toi aux habitudes détectées)",
      "category": "work|personal|health|errand|habit|call",
      "suggestedTime": "HH:MM",
      "suggestedDay": "nom du jour ou null",
      "confidence": 0.0
    }
  ]
}

Règles:
- confidence entre 0.5 et 1.0 selon la force du pattern détecté
- suggestedTime basé sur le moment préféré de l'utilisateur
- Propose des rappels variés (évite de répéter la même catégorie 3 fois)
- Si peu de données: propose des rappels utiles et génériques avec confidence 0.5-0.6`;

// ─── Static fallback when AI is unavailable ───────────────────────────────────

function staticRecommendations(patterns) {
  const defaults = [
    { title: "Faire le plein de courses", reason: "Une bonne habitude à prendre chaque semaine", category: "errand",   suggestedTime: "10:00", suggestedDay: "Samedi",   confidence: 0.5 },
    { title: "Appeler un proche",          reason: "Garder le contact avec vos proches",           category: "call",     suggestedTime: "18:00", suggestedDay: null,       confidence: 0.5 },
    { title: "Boire de l'eau",             reason: "Une habitude santé quotidienne",               category: "health",   suggestedTime: "09:00", suggestedDay: null,       confidence: 0.5 },
  ];

  if (!patterns) return defaults;

  // Boost confidence a bit if we have data
  return defaults.map((r) => ({ ...r, confidence: 0.6 }));
}

// ─── Main function ─────────────────────────────────────────────────────────────

async function getSmartRecommendations(userId) {
  const cacheKey = `smart-reco:${userId}:${new Date().toISOString().slice(0, 13)}`; // hourly key

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return { ...JSON.parse(cached), cached: true };
  } catch {}

  // Fetch last 50 completed reminders
  const history = await prisma.reminder.findMany({
    where: { userId, deletedAt: null },
    orderBy: { completedAt: "desc" },
    take: 50,
  });

  const patterns = analyzePatterns(history);
  const recentTitles = history
    .filter((r) => r.completedAt)
    .slice(0, 10)
    .map((r) => r.title);

  let recommendations;
  try {
    const raw = await callGemma(RECO_PROMPT(patterns ?? { summary: "Pas encore d'historique" }, recentTitles, new Date()));
    const parsed = extractJSON(raw);
    recommendations = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];
    if (recommendations.length === 0) throw new Error("empty");
  } catch {
    recommendations = staticRecommendations(patterns);
  }

  const result = { recommendations, patterns };

  try {
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
  } catch {}

  return result;
}

module.exports = { getSmartRecommendations, analyzePatterns };

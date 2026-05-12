const prisma = require("./prisma");
const redis = require("./redis");
const { callGemma, extractJSON } = require("./gemma");

const CACHE_TTL = 3600; // 1h — refreshes each hour

// ─── Prompt ───────────────────────────────────────────────────────────────────

const DAILY_NOTE_PROMPT = (urgent, pending, completedToday, total) => `Tu es RemindAI, assistant bienveillant. Réponds TOUJOURS en français.

Situation de l'utilisateur aujourd'hui:
- Rappels urgents/haute priorité en attente: ${urgent.length}
${urgent.slice(0, 5).map((r) => `  • ${r.title}`).join("\n")}
- Total rappels en attente: ${pending.length}
- Complétés aujourd'hui: ${completedToday}

Génère UNIQUEMENT ce JSON valide (sans markdown):
{
  "aiNote": "note personnalisée (2 phrases max, tutoie l'utilisateur, sois encourageant et précis)",
  "motivationalMessage": "message de motivation court selon la progression (emoji autorisé)"
}

Si 0 urgent: message positif et productif.
Si urgent > 0: mentionne la tâche la plus importante par son nom.
motivationalMessage: adapte selon complétés/${total || 1} (0%=encourage, <50%=continue, ≥50%=félicite).`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function endOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function generateReason(reminder) {
  if (reminder.priority >= 4) return "Priorité urgente";
  if (reminder.priority === 3) return "Priorité haute";
  if (reminder.frequency && reminder.frequency !== "once") {
    const labels = { daily: "quotidien", weekly: "hebdomadaire", monthly: "mensuel", custom: "récurrent" };
    return `Rappel ${labels[reminder.frequency] || "récurrent"}`;
  }
  if (reminder.scheduledAt) {
    const d = new Date(reminder.scheduledAt);
    const now = new Date();
    const diffH = Math.round((d - now) / 3600000);
    if (diffH <= 2) return "Prévu dans moins de 2h";
    if (diffH <= 24) return "Prévu aujourd'hui";
  }
  return "À ne pas oublier";
}

function buildRecommendations(pending) {
  return [...pending]
    .sort((a, b) => {
      // Sort by: priority desc, then scheduledAt asc
      if (b.priority !== a.priority) return b.priority - a.priority;
      const ta = a.scheduledAt ? new Date(a.scheduledAt).getTime() : Infinity;
      const tb = b.scheduledAt ? new Date(b.scheduledAt).getTime() : Infinity;
      return ta - tb;
    })
    .slice(0, 3)
    .map((r) => ({
      action: r.title,
      priority: r.priority >= 4 ? "urgent" : r.priority === 3 ? "high" : "normal",
      reason: generateReason(r),
    }));
}

function staticFallback(urgentCount, completedToday, total) {
  let aiNote;
  if (urgentCount === 0) {
    aiNote = "Pas de tâche urgente aujourd'hui, tu peux avancer sereinement ! Profite de cette journée pour traiter tes rappels en attente.";
  } else {
    aiNote = `Tu as ${urgentCount} tâche${urgentCount > 1 ? "s" : ""} urgente${urgentCount > 1 ? "s" : ""} en attente. Commence par la première de la liste pour bien démarrer ta journée !`;
  }

  const pct = total > 0 ? Math.round((completedToday / total) * 100) : 0;
  let motivationalMessage;
  if (pct === 0) {
    motivationalMessage = "Commençons ! Tu peux le faire 💪";
  } else if (pct < 50) {
    motivationalMessage = `Bonne journée ! Tu as complété ${completedToday}/${total} rappels. Continue ! 🎯`;
  } else {
    motivationalMessage = `Excellent ! Tu as complété ${completedToday}/${total} rappels (${pct}%). Tu es super ! 🚀`;
  }

  return { aiNote, motivationalMessage };
}

// ─── Main function ─────────────────────────────────────────────────────────────

async function getDailySummary(userId) {
  const cacheKey = `daily-summary:${userId}:${new Date().toISOString().slice(0, 10)}`;

  // Redis cache
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return { ...JSON.parse(cached), cached: true };
  } catch {}

  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);

  // All non-deleted, non-archived reminders
  const all = await prisma.reminder.findMany({
    where: { userId, deletedAt: null, archivedAt: null },
    orderBy: { scheduledAt: "asc" },
  });

  const pending = all.filter((r) => !r.completedAt);
  const urgent = pending.filter((r) => r.priority >= 3); // high + urgent

  const completedToday = all.filter(
    (r) => r.completedAt && r.completedAt >= dayStart && r.completedAt <= dayEnd
  ).length;

  const todoCount = pending.length;
  const urgentCount = urgent.length;
  const total = pending.length + completedToday;

  const recommendations = buildRecommendations(pending);

  // AI note (with graceful fallback)
  let aiNote, motivationalMessage;
  try {
    const raw = await callGemma(DAILY_NOTE_PROMPT(urgent, pending, completedToday, total));
    const parsed = extractJSON(raw);
    aiNote = parsed.aiNote;
    motivationalMessage = parsed.motivationalMessage;
  } catch {
    ({ aiNote, motivationalMessage } = staticFallback(urgentCount, completedToday, total));
  }

  const result = {
    date: now.toISOString().slice(0, 10),
    urgentCount,
    todoCount,
    completedToday,
    aiNote,
    recommendations,
    motivationalMessage,
  };

  try {
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
  } catch {}

  return result;
}

module.exports = { getDailySummary };

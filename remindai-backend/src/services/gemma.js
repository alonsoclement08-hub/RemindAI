const { GoogleGenAI, Type } = require("@google/genai");
const redis = require("./redis");

const CACHE_TTL = 3600;
const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

// ─── Client ───────────────────────────────────────────────────────────────────

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) console.warn("WARNING: GEMINI_API_KEY not set — AI features degraded.");
  return new GoogleGenAI({ apiKey: apiKey || "" });
}
const ai = getClient();

// ─── System prompts (Remi persona) ───────────────────────────────────────────

const SYSTEM_PARSE = (todayStr) =>
  `You are Remi, the ultra-casual, supportive best-friend AI behind RemindAI (powered by Gemini).
Today is ${todayStr}.
Detect the input language. If French, use casual French texting slang in aiExplanation (tkt, grave, ouais, chaud, jsp, mec, frère). If English, use English slang (idk, tbh, fr, omg, btw, oof).
Priority scale: 1=low 2=normal 3=high 4=urgent (Eisenhower Matrix).
Urgency: "high" | "medium" | "low".
If no explicit date/time is mentioned, scheduledAt must be null.
aiExplanation: 2-4 sentences, warm, casual, encouraging — like texting a friend.`;

const SYSTEM_ADVICE = () =>
  `You are Remi, the ultra-casual best-friend AI behind RemindAI.
Give specific, actionable, friendly advice about this reminder — exactly like texting a supportive friend.
Detect the language from the reminder. Reply in the same language with matching slang.
Be concise, warm, specific. NO generic advice ever.`;

const SYSTEM_CHAT = (todayStr, tasks = []) => {
  const taskCtx = tasks.length > 0
    ? tasks.map(t => `- [${t.completed ? "DONE" : "PENDING"}] "${t.title}" | Cat: ${t.category} | Due: ${t.dueDate || "?"}`).join("\n")
    : "No existing tasks.";
  return `You are Remi, the ultra-casual best-friend AI behind RemindAI (powered by Gemini).
Today is ${todayStr}.
User's current tasks:
${taskCtx}

You help create and manage reminders. Detect language: French → slang (tkt, ouais, grave, mec, chaud, jsp). English → slang (fr, idk, tbh, omg, oof).
Priority: 1=low, 2=normal, 3=high, 4=urgent.
Always ask for time if not given. Be warm, casual, specific — NOT robotic.
If too many high-priority tasks: gently warn them ("ouais mec c'est blindé là, tkt dis-moi si on décale" / "whoa that's a lot on your plate rn, lmk if we should reschedule some").`;
};

const SYSTEM_RECOMMENDATIONS = () =>
  `You are Remi, the ultra-casual best-friend AI behind RemindAI.
Generate very personalized, specific recommendations based on QCM answers.
Be concrete (actual brands, options, numbers), casual, helpful. No generic advice.
Detect language from the input and reply in the same language.`;

const SYSTEM_ADVICE_GENERATE = (type) => {
  const missions = {
    daily_summary:     "Summarize today. Mention urgents. Encourage warmly.",
    motivation:        "Ultra-motivating message about weekly progress. Compare to last week if data available.",
    budget_alert:      "Friendly budget alert with exact figures (€) and a concrete actionable tip.",
    routine_help:      "Explain why now is the right time for this routine based on the user's patterns.",
    price_advice:      "Talk about the best price found: savings amount, store, ideal timing.",
    pattern_insight:   "Share a precise, encouraging insight about the user's habits. Cite real data.",
    weather_based:     "Give seasonal/contextual advice.",
    reminder_specific: "Very specific advice about this exact reminder. Cite real numbers (times completed, last time, completion rate). If snoozed multiple times, be kind but direct about it.",
  };
  return `You are Remi, the ultra-casual best-friend AI behind RemindAI.
${missions[type] || missions.daily_summary}
Style: conversational French (or English if context is English), 2-4 sentences MAX, 1-2 emojis max, NO bullet points, cite real numbers, use "tu/toi" not "l'utilisateur".`;
};

const SYSTEM_SUGGEST = () =>
  `You are Remi, the ultra-casual best-friend AI behind RemindAI.
Suggest relevant, practical reminders based on the user's habits and patterns.`;

// ─── Deterministic time resolver ──────────────────────────────────────────────

const TIME_KEYWORDS = [
  ['minuit', 0], ['midi', 12], ['matin tôt', 7], ['tôt le matin', 7],
  ['début de journée', 9], ['après-midi', 15], ['fin de journée', 17],
  ['ce soir', 20], ['soir', 20], ['nuit', 22], ['matin', 9],
];

function resolveScheduledAt(text) {
  const lower = text.toLowerCase();
  let hour = null;
  let minute = 0;

  const frFull = text.match(/à?\s*(\d{1,2})[h:](\d{2})/i);
  if (frFull) {
    hour = parseInt(frFull[1], 10);
    minute = parseInt(frFull[2], 10);
  } else {
    const frHour = text.match(/à?\s*(\d{1,2})h\b/i);
    if (frHour) hour = parseInt(frHour[1], 10);
  }

  if (hour === null) {
    const en = text.match(/\bat\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
    if (en) {
      hour = parseInt(en[1], 10);
      minute = parseInt(en[2] || 0, 10);
      if (en[3]?.toLowerCase() === 'pm' && hour < 12) hour += 12;
      if (en[3]?.toLowerCase() === 'am' && hour === 12) hour = 0;
    }
  }

  if (hour === null) {
    for (const [kw, h] of TIME_KEYWORDS) {
      if (lower.includes(kw)) { hour = h; break; }
    }
  }

  if (hour === null) return null;

  const now = new Date();
  const date = new Date();

  if (lower.includes('après-demain')) date.setDate(date.getDate() + 2);
  else if (lower.includes('demain') || lower.includes('tomorrow')) date.setDate(date.getDate() + 1);

  date.setHours(hour, minute, 0, 0);

  const hasExplicitFuture = lower.includes('demain') || lower.includes('tomorrow') || lower.includes('après-demain');
  if (date < now && !hasExplicitFuture) date.setDate(date.getDate() + 1);

  return date.toISOString();
}

// ─── Cache helpers ────────────────────────────────────────────────────────────

function makeCacheKey(prefix, input) {
  const hash = String(input)
    .split("")
    .reduce((h, c) => ((h * 31 + c.charCodeAt(0)) & 0x7fffffff), 0);
  return `ai:${prefix}:${hash}`;
}

async function cacheGet(key) {
  try {
    const val = await redis.get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

async function cacheSet(key, value, ttl = CACHE_TTL) {
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch {}
}

// ─── Gemini call ─────────────────────────────────────────────────────────────

async function callGemini(systemInstruction, userContent, responseSchema = null) {
  const config = { systemInstruction };
  if (responseSchema) {
    config.responseMimeType = "application/json";
    config.responseSchema = responseSchema;
  }

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: userContent,
    config,
  });

  const text = (response.text || "").trim();
  if (responseSchema) return JSON.parse(text || "{}");

  const match = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (match) return JSON.parse(match[0]);
  throw new Error("No JSON in Gemini response");
}

function extractJSON(text) {
  const match = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (!match) throw new Error("No JSON in response");
  return JSON.parse(match[0]);
}

// ─── No-key fallbacks ─────────────────────────────────────────────────────────

const NO_KEY_MSG = "Configure ta GEMINI_API_KEY dans les paramètres pour activer l'IA complète ! 🔑";

function noKeyParse(text) {
  return {
    title: text.substring(0, 40),
    scheduledAt: null,
    reminderType: "task",
    category: "personal",
    priority: 2,
    urgency: "medium",
    intent: "create",
    confidence: 0.5,
    entities: { date: null, time: null, person: null, frequency: null, details: null, notifyBefore: null, priority: null },
    aiExplanation: NO_KEY_MSG,
  };
}

function noKeyAdvice() {
  return { advice: NO_KEY_MSG, suggestions: [], optimizations: [], questions: [], confirmationText: "C'est bien ça ?" };
}

function noKeyChat(text) {
  return {
    reminder: { title: text.substring(0, 40), scheduledAt: null, reminderType: "task", category: "personal", priority: 2, entities: {} },
    advice: NO_KEY_MSG,
    reply: NO_KEY_MSG,
    suggestions: [],
    questions: ["À quelle heure ?"],
    missingInfo: true,
    missingFields: ["time"],
    nextStep: "Configure la clé API Gemini.",
  };
}

// ─── Public service ───────────────────────────────────────────────────────────

const gemmaService = {
  async parseText(text) {
    const key = makeCacheKey("parse", text);
    const cached = await cacheGet(key);
    if (cached) return { ...cached, cached: true };

    if (!process.env.GEMINI_API_KEY) return noKeyParse(text);

    const todayStr = new Date().toISOString().split("T")[0];

    const result = await callGemini(
      SYSTEM_PARSE(todayStr),
      `Parse this reminder: "${text}"`,
      {
        type: Type.OBJECT,
        required: ["title", "scheduledAt", "reminderType", "category", "priority", "urgency", "intent", "confidence", "entities", "aiExplanation"],
        properties: {
          title:         { type: Type.STRING },
          scheduledAt:   { type: Type.STRING, nullable: true },
          reminderType:  { type: Type.STRING, enum: ["call", "shopping", "study", "appointment", "medication", "habit", "task"] },
          category:      { type: Type.STRING, enum: ["work", "personal", "health", "errand", "habit"] },
          priority:      { type: Type.INTEGER },
          urgency:       { type: Type.STRING, enum: ["high", "medium", "low"] },
          intent:        { type: Type.STRING, enum: ["create", "update", "complete", "snooze"] },
          confidence:    { type: Type.NUMBER },
          aiExplanation: { type: Type.STRING },
          entities: {
            type: Type.OBJECT,
            properties: {
              date:         { type: Type.STRING, nullable: true },
              time:         { type: Type.STRING, nullable: true },
              person:       { type: Type.STRING, nullable: true },
              frequency:    { type: Type.STRING, nullable: true },
              details:      { type: Type.STRING, nullable: true },
              notifyBefore: { type: Type.STRING, nullable: true },
              priority:     { type: Type.STRING, nullable: true },
            },
          },
        },
      }
    );

    const resolvedAt = resolveScheduledAt(text);
    if (resolvedAt) result.scheduledAt = resolvedAt;

    await cacheSet(key, result);
    return result;
  },

  async getAdvice(reminder) {
    const key = makeCacheKey("advice", JSON.stringify(reminder));
    const cached = await cacheGet(key);
    if (cached) return { ...cached, cached: true };

    if (!process.env.GEMINI_API_KEY) return noKeyAdvice();

    const result = await callGemini(
      SYSTEM_ADVICE(),
      `Give advice for this reminder: ${JSON.stringify(reminder)}`,
      {
        type: Type.OBJECT,
        required: ["advice", "suggestions", "optimizations", "questions", "confirmationText"],
        properties: {
          advice:           { type: Type.STRING },
          suggestions:      { type: Type.ARRAY, items: { type: Type.STRING } },
          optimizations:    { type: Type.ARRAY, items: { type: Type.STRING } },
          questions:        { type: Type.ARRAY, items: { type: Type.STRING } },
          confirmationText: { type: Type.STRING },
        },
      }
    );

    await cacheSet(key, result);
    return result;
  },

  async chat(message, history = [], tasks = []) {
    const cacheKeyInput = message + (history.length > 0 ? history.map(h => h.content).join("") : "");
    const key = makeCacheKey("chat", cacheKeyInput);
    const cached = await cacheGet(key);
    if (cached) return { ...cached, cached: true };

    if (!process.env.GEMINI_API_KEY) return noKeyChat(message);

    const todayStr = new Date().toISOString().split("T")[0];

    // With history → conversational mode (just a reply)
    if (history && history.length > 0) {
      const formattedHistory = history.map(h => ({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.content }],
      }));

      const chatSession = ai.chats.create({
        model: MODEL,
        config: { systemInstruction: SYSTEM_CHAT(todayStr, tasks) },
        history: formattedHistory,
      });

      const response = await chatSession.sendMessage({ message });
      const result = {
        reminder: null,
        advice: response.text,
        reply: response.text,
        suggestions: [],
        questions: [],
        missingInfo: false,
        missingFields: [],
        nextStep: null,
      };
      return result;
    }

    // No history → extract reminder + structured response
    const result = await callGemini(
      SYSTEM_CHAT(todayStr, tasks),
      message,
      {
        type: Type.OBJECT,
        required: ["reminder", "advice", "suggestions", "questions", "missingInfo", "missingFields", "nextStep"],
        properties: {
          reminder: {
            type: Type.OBJECT,
            properties: {
              title:        { type: Type.STRING },
              scheduledAt:  { type: Type.STRING, nullable: true },
              reminderType: { type: Type.STRING },
              category:     { type: Type.STRING },
              priority:     { type: Type.INTEGER },
              entities: {
                type: Type.OBJECT,
                properties: {
                  person:       { type: Type.STRING, nullable: true },
                  frequency:    { type: Type.STRING, nullable: true },
                  details:      { type: Type.STRING, nullable: true },
                  notifyBefore: { type: Type.STRING, nullable: true },
                },
              },
            },
          },
          advice:        { type: Type.STRING },
          reply:         { type: Type.STRING },
          suggestions:   { type: Type.ARRAY, items: { type: Type.STRING } },
          questions:     { type: Type.ARRAY, items: { type: Type.STRING } },
          missingInfo:   { type: Type.BOOLEAN },
          missingFields: { type: Type.ARRAY, items: { type: Type.STRING } },
          nextStep:      { type: Type.STRING },
        },
      }
    );

    if (result.reminder) {
      result.reminder.scheduledAt = resolveScheduledAt(message);
    }
    if (!result.reminder?.scheduledAt) {
      result.missingInfo = true;
      if (!result.missingFields) result.missingFields = [];
      if (!result.missingFields.includes("time")) result.missingFields.push("time");
    }

    await cacheSet(key, result);
    return result;
  },

  async generateRecommendations(message, answers) {
    const key = makeCacheKey("reco", message + JSON.stringify(answers));
    const cached = await cacheGet(key);
    if (cached) return { ...cached, cached: true };

    if (!process.env.GEMINI_API_KEY) {
      return { intro: NO_KEY_MSG, recommendations: [], avoid: null, tip: "", reminderTitle: message.substring(0, 40) };
    }

    const result = await callGemini(
      SYSTEM_RECOMMENDATIONS(),
      `User wants: "${message}"\nQCM answers: ${JSON.stringify(answers)}\nGenerate personalized recommendations.`,
      {
        type: Type.OBJECT,
        required: ["intro", "recommendations", "tip", "reminderTitle"],
        properties: {
          intro:           { type: Type.STRING },
          recommendations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                item:   { type: Type.STRING },
                reason: { type: Type.STRING },
              },
            },
          },
          avoid: {
            type: Type.OBJECT,
            nullable: true,
            properties: {
              item:   { type: Type.STRING },
              reason: { type: Type.STRING },
            },
          },
          tip:           { type: Type.STRING },
          reminderTitle: { type: Type.STRING },
        },
      }
    );

    await cacheSet(key, result);
    return result;
  },

  async generateAdvice(context) {
    const key = makeCacheKey("gen_advice", JSON.stringify(context).slice(0, 300));
    const cached = await cacheGet(key);
    if (cached) return { ...cached, cached: true };

    if (!process.env.GEMINI_API_KEY) return generateTemplateAdvice(context);

    try {
      const { type = "daily_summary", _contextOverride, patterns, weekStats, recentReminders, preferences, budget, priceData } = context;

      const parts = [];
      if (_contextOverride) {
        parts.push(_contextOverride);
      } else {
        if (patterns) {
          parts.push(`Patterns: fav day=${patterns.favoriteDay?.[0] || "?"}, fav time=${patterns.favoriteTime?.[0] || "?"}, completion=${patterns.completionRate}%`);
          if (patterns.topCategories?.length > 0) parts.push(`Top categories: ${patterns.topCategories.map(c => c.category).join(", ")}`);
        }
        if (weekStats) {
          const prev = weekStats.prevWeek || 0;
          const curr = weekStats.completed || 0;
          const diff = prev > 0 ? Math.round(((curr - prev) / prev) * 100) : null;
          parts.push(`This week: ${curr} done${diff !== null ? ` (${diff > 0 ? "+" : ""}${diff}% vs last week)` : ""}`);
        }
        if (recentReminders?.length > 0) {
          const pending = recentReminders.filter(r => !r.completedAt).slice(0, 3);
          const urgents = pending.filter(r => r.priority >= 3);
          if (urgents.length > 0) parts.push(`Urgent: ${urgents.map(r => r.title).join(", ")}`);
          else if (pending.length > 0) parts.push(`Pending: ${pending.map(r => r.title).join(", ")}`);
        }
        if (preferences?.length > 0) {
          const top = preferences[0];
          if (top.score > 0.5) parts.push(`Top category: ${top.category} (${Math.round(top.score * 100)}%)`);
        }
        if (budget) {
          const pct = Math.round((budget.spent / budget.limit) * 100);
          parts.push(`Budget: ${budget.spent}€/${budget.limit}€ (${pct}%)`);
        }
        if (priceData?.length > 0) {
          const best = priceData[0];
          parts.push(`Best price: ${best.product} at ${best.price}€ at ${best.store} (save ${best.savings}€)`);
        }
      }

      const contextBlock = parts.join("\n") || "No user data yet.";

      const result = await callGemini(
        SYSTEM_ADVICE_GENERATE(type),
        `User context:\n${contextBlock}\n\nGenerate a ${type} message.`,
        {
          type: Type.OBJECT,
          required: ["message", "tone", "actionItems"],
          properties: {
            message:     { type: Type.STRING },
            tone:        { type: Type.STRING, enum: ["encouraging", "advisory", "urgent", "motivating"] },
            actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
        }
      );

      await cacheSet(key, result, 900);
      return result;
    } catch {
      return generateTemplateAdvice(context);
    }
  },

  async suggestReminders(context, limit = 3) {
    const key = makeCacheKey("suggest", JSON.stringify(context));
    const cached = await cacheGet(key);
    if (cached) return cached;

    if (!process.env.GEMINI_API_KEY) return [];

    const result = await callGemini(
      SYSTEM_SUGGEST(),
      `User habits: ${JSON.stringify(context)}\nSuggest exactly ${limit} relevant reminders.`,
      {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title:         { type: Type.STRING },
            category:      { type: Type.STRING },
            priority:      { type: Type.INTEGER },
            suggestedHour: { type: Type.INTEGER },
            reminderType:  { type: Type.STRING },
          },
        },
      }
    );

    const suggestions = Array.isArray(result) ? result : [];
    await cacheSet(key, suggestions);
    return suggestions;
  },
};

// ─── Template fallback (offline / no API key) ─────────────────────────────────

function generateTemplateAdvice(context) {
  const { type, patterns, weekStats, recentReminders, budget } = context;
  const h = new Date().getHours();
  const greeting = h < 12 ? "Bonjour" : h < 18 ? "Salut" : "Bonsoir";

  const pending = (recentReminders || []).filter(r => !r.completedAt);
  const urgents = pending.filter(r => r.priority >= 3);

  if (type === "budget_alert" && budget) {
    const pct = Math.round((budget.spent / budget.limit) * 100);
    return {
      message: `⚠️ Tes dépenses ont atteint ${pct}% de ton budget (${budget.spent}€/${budget.limit}€). Il te reste ${budget.limit - budget.spent}€ — checke les promos avant de faire les courses !`,
      tone: "urgent",
      actionItems: ["Voir mon budget", "Comparer les prix"],
    };
  }

  if (type === "motivation" && weekStats) {
    const curr = weekStats.completed || 0;
    return {
      message: `${greeting} ! ${curr} rappel${curr > 1 ? "s" : ""} complété${curr > 1 ? "s" : ""} cette semaine — c'est top ! 🎯 Continue sur cette lancée.`,
      tone: "motivating",
      actionItems: ["Voir mes stats", "Créer un rappel"],
    };
  }

  if (type === "pattern_insight" && patterns) {
    const day = patterns.favoriteDay?.[0];
    const time = patterns.favoriteTime?.[0];
    return {
      message: `J'ai analysé tes habitudes 🧠 Tu es particulièrement productif${day ? ` le ${day}` : ""}${time ? ` en ${time}` : ""}. Je m'en souviens pour te suggérer les rappels au meilleur moment !`,
      tone: "encouraging",
      actionItems: ["Voir mes préférences"],
    };
  }

  if (urgents.length > 0) {
    return {
      message: `${greeting} ! Tu as ${urgents.length} tâche${urgents.length > 1 ? "s" : ""} urgente${urgents.length > 1 ? "s" : ""} aujourd'hui. Commence par "${urgents[0].title}" — ça te donnera de l'élan 💪`,
      tone: "advisory",
      actionItems: [`Voir ${urgents[0].title}`, "Voir tous les urgents"],
    };
  }

  if (pending.length === 0) {
    return {
      message: `${greeting} ! Tout est à jour — bravo 🎉 Profite de cette journée, tu l'as mérité !`,
      tone: "encouraging",
      actionItems: ["Créer un rappel"],
    };
  }

  const rate = patterns?.completionRate;
  return {
    message: `${greeting} ! Tu as ${pending.length} rappel${pending.length > 1 ? "s" : ""} en attente${rate ? ` et un taux de complétion de ${rate}%` : ""}. Avance à ton rythme — tu gères ! 🚀`,
    tone: "encouraging",
    actionItems: ["Voir mes rappels"],
  };
}

module.exports = gemmaService;
module.exports.extractJSON = extractJSON;

const axios = require("axios");
const redis = require("./redis");

const CACHE_TTL = 3600;
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const MODEL = process.env.OLLAMA_MODEL || "gemma3";

// ─── Prompts ──────────────────────────────────────────────────────────────────

const PARSE_PROMPT = (text) => `Analyse ce rappel et retourne un JSON structuré.

Texte: "${text}"

Retourne UNIQUEMENT ce JSON valide (sans markdown, sans explication):
{
  "title": "action principale sans date/heure/personne",
  "scheduledAt": "ISO 8601 ou null",
  "reminderType": "call|shopping|study|appointment|medication|habit|task",
  "category": "work|personal|health|errand|habit",
  "priority": 1,
  "intent": "create|update|complete|snooze",
  "confidence": 0.9,
  "entities": {
    "date": "phrase date ou null",
    "time": "phrase heure ou null",
    "person": "personne mentionnée ou null",
    "frequency": "fréquence ou null",
    "details": "détails supplémentaires ou null",
    "notifyBefore": "délai de notification (ex: 10 minutes) ou null",
    "priority": "urgent|important|normal ou null"
  }
}

Règles: priority 1=low 2=normal 3=high 4=urgent. Détecte le français et l'anglais.`;

const ADVICE_PROMPT = (reminder) => `Tu es RemindAI, assistant intelligent de rappels. Sois concis, pratique et naturel.

Rappel créé:
${JSON.stringify(reminder, null, 2)}

Retourne UNIQUEMENT ce JSON valide:
{
  "advice": "conseil principal (1-2 phrases max, tutoie l'utilisateur, sois utile et naturel)",
  "suggestions": ["suggestion courte 1", "suggestion courte 2"],
  "optimizations": ["optimisation 1", "optimisation 2"],
  "questions": ["question de clarification si vraiment nécessaire, sinon tableau vide"],
  "confirmationText": "Résumé clair du rappel créé en 1 phrase. C'est bien ça ?"
}

Guide par type de rappel:
- call: créneaux idéaux selon l'heure, alternative SMS si message court
- shopping: géolocalisation (notifier près du magasin), regrouper les courses similaires
- study: plan Pomodoro (25min travail / 5min pause), espacement sur plusieurs jours
- appointment: notifications multiples (1 jour avant, 1h avant, 15min avant), temps de trajet
- medication: alarme quotidienne à heure fixe, ne pas oublier avec repas
- habit: créneau fixe quotidien selon les habitudes détectées

Maximum 2 suggestions et 2 optimisations. Questions seulement si l'info manquante est vraiment utile.`;

const CHAT_PROMPT = (message) => `Tu es RemindAI, un assistant intelligent de rappels. Réponds toujours en français.

L'utilisateur dit: "${message}"

Retourne UNIQUEMENT ce JSON valide (sans markdown):
{
  "reminder": {
    "title": "action principale sans date/heure/personne",
    "scheduledAt": null,
    "reminderType": "call|shopping|study|appointment|medication|habit|task",
    "category": "work|personal|health|errand|habit",
    "priority": 2,
    "entities": {
      "person": null,
      "frequency": null,
      "details": null,
      "notifyBefore": null
    }
  },
  "advice": "conseil utile et naturel (1-2 phrases, tutoie l'utilisateur)",
  "suggestions": ["suggestion courte 1", "suggestion courte 2"],
  "questions": ["question de clarification si vraiment utile"],
  "nextStep": "prochaine étape en 1 phrase courte"
}

Règles par type:
- call: propose meilleurs créneaux, SMS si court
- shopping: géolocalisation, regrouper les achats similaires
- study: plan Pomodoro (25min/5min), étaler sur plusieurs jours
- appointment: propose 3 notifications (J-1, -1h, -15min)
- medication: rappel quotidien à heure fixe, précautions
- habit: créneau fixe selon les habitudes

Max 2 suggestions. Questions seulement si vraiment nécessaire.`;

const SUGGEST_PROMPT = (context, limit) => `Suggère ${limit} rappels pertinents basés sur les habitudes de l'utilisateur.

Habitudes: ${JSON.stringify(context)}

Retourne UNIQUEMENT un tableau JSON:
[{"title": "...", "category": "...", "priority": 2, "suggestedHour": 9, "reminderType": "..."}]`;

// ─── Deterministic time resolver (overrides AI when explicit time is found) ───

const TIME_KEYWORDS = [
  ['minuit', 0], ['midi', 12], ['matin tôt', 7], ['tôt le matin', 7],
  ['début de journée', 9], ['après-midi', 15], ['fin de journée', 17],
  ['ce soir', 20], ['soir', 20], ['nuit', 22], ['matin', 9],
];

function resolveScheduledAt(text) {
  const lower = text.toLowerCase();
  let hour = null;
  let minute = 0;

  // "15h30" / "15h" / "15:30"
  const frFull = text.match(/à?\s*(\d{1,2})[h:](\d{2})/i);
  if (frFull) {
    hour = parseInt(frFull[1], 10);
    minute = parseInt(frFull[2], 10);
  } else {
    const frHour = text.match(/à?\s*(\d{1,2})h\b/i);
    if (frHour) hour = parseInt(frHour[1], 10);
  }

  // "at 3pm" / "at 10:30am"
  if (hour === null) {
    const en = text.match(/\bat\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
    if (en) {
      hour = parseInt(en[1], 10);
      minute = parseInt(en[2] || 0, 10);
      if (en[3]?.toLowerCase() === 'pm' && hour < 12) hour += 12;
      if (en[3]?.toLowerCase() === 'am' && hour === 12) hour = 0;
    }
  }

  // French time keywords (longest match first to avoid "matin" shadowing "matin tôt")
  if (hour === null) {
    for (const [kw, h] of TIME_KEYWORDS) {
      if (lower.includes(kw)) { hour = h; break; }
    }
  }

  if (hour === null) return null; // No time found — let AI value stand

  const now = new Date();
  const date = new Date();

  if (lower.includes('après-demain')) date.setDate(date.getDate() + 2);
  else if (lower.includes('demain') || lower.includes('tomorrow')) date.setDate(date.getDate() + 1);

  date.setHours(hour, minute, 0, 0);

  // If time is already past and no explicit future date was given, push to tomorrow
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

async function cacheSet(key, value) {
  try {
    await redis.setex(key, CACHE_TTL, JSON.stringify(value));
  } catch {}
}

// ─── Ollama call ─────────────────────────────────────────────────────────────

async function callGemma(prompt) {
  const { data } = await axios.post(
    `${OLLAMA_URL}/api/generate`,
    { model: MODEL, prompt, stream: false, options: { temperature: 0.2, num_predict: 1024 } },
    { timeout: 60000 }
  );
  return data.response.trim();
}

function extractJSON(text) {
  const match = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (!match) throw new Error("No JSON in Gemma response");
  return JSON.parse(match[0]);
}

// ─── Public service ───────────────────────────────────────────────────────────

const gemmaService = {
  async parseText(text) {
    const key = makeCacheKey("parse", text);
    const cached = await cacheGet(key);
    if (cached) return { ...cached, cached: true };

    const raw = await callGemma(PARSE_PROMPT(text));
    const result = extractJSON(raw);

    // Deterministic override: if text has an explicit time, trust it over the AI
    const resolvedAt = resolveScheduledAt(text);
    if (resolvedAt) result.scheduledAt = resolvedAt;

    await cacheSet(key, result);
    return result;
  },

  async getAdvice(reminder) {
    const key = makeCacheKey("advice", JSON.stringify(reminder));
    const cached = await cacheGet(key);
    if (cached) return { ...cached, cached: true };

    const raw = await callGemma(ADVICE_PROMPT(reminder));
    const result = extractJSON(raw);

    await cacheSet(key, result);
    return result;
  },

  async chat(message) {
    const key = makeCacheKey("chat", message);
    const cached = await cacheGet(key);
    if (cached) return { ...cached, cached: true };

    const raw = await callGemma(CHAT_PROMPT(message));
    const result = extractJSON(raw);

    // Apply deterministic time resolution to the nested reminder object
    const resolvedAt = resolveScheduledAt(message);
    if (resolvedAt && result.reminder) result.reminder.scheduledAt = resolvedAt;

    await cacheSet(key, result);
    return result;
  },

  async suggestReminders(context, limit = 3) {
    const key = makeCacheKey("suggest", JSON.stringify(context));
    const cached = await cacheGet(key);
    if (cached) return cached;

    const raw = await callGemma(SUGGEST_PROMPT(context, limit));
    const parsed = extractJSON(raw);
    const suggestions = Array.isArray(parsed) ? parsed : parsed.suggestions ?? [];

    await cacheSet(key, suggestions);
    return suggestions;
  },
};

module.exports = gemmaService;

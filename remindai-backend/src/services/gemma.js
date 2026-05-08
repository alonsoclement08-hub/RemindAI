const { GoogleGenerativeAI } = require("@google/generative-ai");
const redis = require("./redis");

const CACHE_TTL = 3600;
const MODEL = process.env.GEMMA_MODEL || "gemma-3-27b-it";

let _genAI;
function getClient() {
  if (!_genAI) _genAI = new GoogleGenerativeAI(process.env.GEMMA_API_KEY);
  return _genAI;
}

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

const SUGGEST_PROMPT = (context, limit) => `Suggère ${limit} rappels pertinents basés sur les habitudes de l'utilisateur.

Habitudes: ${JSON.stringify(context)}

Retourne UNIQUEMENT un tableau JSON:
[{"title": "...", "category": "...", "priority": 2, "suggestedHour": 9, "reminderType": "..."}]`;

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

// ─── Gemma API call ───────────────────────────────────────────────────────────

async function callGemma(prompt) {
  const model = getClient().getGenerativeModel({
    model: MODEL,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
    },
  });
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
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

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

const CHAT_PROMPT = (message) => `Tu es RemindAI, un assistant intelligent de rappels. Réponds TOUJOURS en français.

L'utilisateur dit: "${message}"

ÉTAPE 1 — Nettoie le titre. Enlève ces formulations si présentes:
"créer un rappel pour me rappeler de/d'", "créer un rappel pour", "rappelle-moi de/d'",
"n'oublie pas de/d'", "pense à", "il faut que je". Garde uniquement l'action + l'objet.
Exemple: "créer un rappel pour me rappeler d'acheter des croquettes" → "Acheter des croquettes"

ÉTAPE 2 — Extrais les infos. scheduledAt = null si aucune heure/date n'est explicitement mentionnée.

ÉTAPE 3 — Génère un conseil SPÉCIFIQUE à l'action (pas générique). Exemple pour "acheter des croquettes":
"Les croquettes premium sont souvent moins chères en grande surface le mardi. Vérifie les dates de péremption !"

ÉTAPE 4 — Pose 2 à 3 questions IMPORTANTES selon la catégorie + les infos manquantes.

Retourne UNIQUEMENT ce JSON valide (sans markdown, sans explication):
{
  "reminder": {
    "title": "titre nettoyé, première lettre majuscule",
    "scheduledAt": null,
    "reminderType": "call|shopping|study|appointment|medication|habit|task",
    "category": "work|personal|health|errand|habit",
    "priority": 2,
    "entities": { "person": null, "frequency": null, "details": null, "notifyBefore": null }
  },
  "advice": "conseil utile et spécifique (pas générique), 1-2 phrases, tutoie l'utilisateur",
  "suggestions": ["suggestion concrète 1", "suggestion concrète 2"],
  "questions": ["question 1 (heure si manquante)", "question 2", "question 3 optionnelle"],
  "missingInfo": true,
  "missingFields": ["time"],
  "nextStep": "ce qu'on fait ensuite en 1 phrase"
}

Questions OBLIGATOIRES si l'heure n'est pas précisée:
- shopping → "À quelle heure veux-tu ce rappel ?", "Quel budget environ ?"
- call → "À quelle heure veux-tu appeler ?", "Appel ou SMS ?"
- study → "Tu as combien de temps pour réviser ?", "Tu révises mieux le matin ou le soir ?"
- appointment → "À quelle heure est le rendez-vous ?"
- medication → "À quelle heure chaque matin/soir ?"
- habit → "À quelle heure quotidiennement ?"
- task/default → "À quelle heure veux-tu ce rappel ?"

missingInfo = true si scheduledAt est null. missingFields = ["time"] si heure manquante.
missingInfo = false seulement si heure ET date sont clairement précisées dans le message.`;

const RECOMMENDATIONS_PROMPT = (message, answers) => `Tu es RemindAI. Réponds TOUJOURS en français.

L'utilisateur veut: "${message}"
Ses réponses au questionnaire: ${JSON.stringify(answers)}

Génère des conseils TRÈS PERSONNALISÉS. Retourne UNIQUEMENT ce JSON valide:
{
  "intro": "phrase d'accroche sympathique et personnalisée selon les réponses",
  "recommendations": [
    { "item": "Marque ou option concrète", "reason": "raison courte et précise" },
    { "item": "Marque ou option concrète", "reason": "raison courte et précise" }
  ],
  "avoid": { "item": "ce qu'il faut éviter", "reason": "pourquoi en 1 phrase" },
  "tip": "1 conseil pratique supplémentaire très utile",
  "reminderTitle": "titre du rappel finalisé et personnalisé"
}

Sois CONCRET et SPÉCIFIQUE. Pas de conseils génériques.`;

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

    // Deterministic parser always wins over AI for scheduledAt
    // null = no explicit time found in text → keep missingInfo: true
    if (result.reminder) {
      result.reminder.scheduledAt = resolveScheduledAt(message);
    }
    if (result.reminder?.scheduledAt === null) {
      result.missingInfo = true;
      if (!result.missingFields) result.missingFields = [];
      if (!result.missingFields.includes('time')) result.missingFields.push('time');
    }

    await cacheSet(key, result);
    return result;
  },

  async generateRecommendations(message, answers) {
    const key = makeCacheKey("reco", message + JSON.stringify(answers));
    const cached = await cacheGet(key);
    if (cached) return { ...cached, cached: true };

    const raw = await callGemma(RECOMMENDATIONS_PROMPT(message, answers));
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
module.exports.callGemma = callGemma;
module.exports.extractJSON = extractJSON;

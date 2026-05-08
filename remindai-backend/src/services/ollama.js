const axios = require("axios");
const redis = require("./redis");

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const MODEL = "mistral:7b";
const CACHE_TTL = 3600; // 1 hour in seconds

const PARSE_SYSTEM = [
  "You are a multilingual reminder parser supporting French and English.",
  "Extract structured information from the user's text.",
  "Return ONLY valid JSON — no explanation, no markdown, no extra text.",
].join(" ");

const buildParsePrompt = (text) => `Parse this reminder and return JSON:
{
  "title": "cleaned action without date/time",
  "scheduledAt": "ISO 8601 string or null",
  "category": "work|personal|health|errand|habit",
  "priority": 1-4,
  "intent": "create|update|complete|snooze",
  "confidence": 0.0-1.0,
  "entities": {
    "date": "date phrase or null",
    "time": "time phrase or null",
    "context": "additional context or null"
  }
}

Text: "${text}"`;

const buildSuggestPrompt = (context, limit) =>
  `Based on user patterns, suggest ${limit} relevant reminders as a JSON array:
[{"title": string, "category": string, "priority": 1-4, "suggestedHour": 0-23}]

User patterns: ${JSON.stringify(context)}`;

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
  } catch {
    // Redis unavailable — skip caching
  }
}

// ─── Ollama call ──────────────────────────────────────────────────────────────

async function callOllama(prompt, system = "") {
  const { data } = await axios.post(
    `${OLLAMA_URL}/api/generate`,
    { model: MODEL, prompt, system, stream: false, options: { temperature: 0.1, num_predict: 512 } },
    { timeout: 30000 }
  );
  return data.response.trim();
}

function extractJSON(text) {
  const match = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (!match) throw new Error("No JSON in Ollama response");
  return JSON.parse(match[0]);
}

// ─── Public service ───────────────────────────────────────────────────────────

const ollamaService = {
  async parseText(text) {
    const key = makeCacheKey("parse", text);
    const cached = await cacheGet(key);
    if (cached) return { ...cached, cached: true };

    const raw = await callOllama(buildParsePrompt(text), PARSE_SYSTEM);
    const result = extractJSON(raw);

    await cacheSet(key, result);
    return result;
  },

  async suggestReminders(context, limit = 3) {
    const key = makeCacheKey("suggest", JSON.stringify(context));
    const cached = await cacheGet(key);
    if (cached) return cached;

    const raw = await callOllama(buildSuggestPrompt(context, limit));
    const parsed = extractJSON(raw);
    const suggestions = Array.isArray(parsed) ? parsed : parsed.suggestions ?? [];

    await cacheSet(key, suggestions);
    return suggestions;
  },
};

module.exports = ollamaService;

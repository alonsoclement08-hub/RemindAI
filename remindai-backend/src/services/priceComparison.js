const redis = require("./redis");
const { callGemma, extractJSON } = require("./gemma");

const CACHE_TTL = 21600; // 6h — prices change slowly
const STORES = ["Amazon", "Carrefour", "Leclerc", "Auchan", "Lidl"];
const STORE_ICONS = { Amazon: "🛍️", Carrefour: "🏪", Leclerc: "🟢", Auchan: "🏬", Lidl: "🟡" };

// ─── Cache key ────────────────────────────────────────────────────────────────

function cacheKey(product) {
  const hash = String(product)
    .toLowerCase()
    .split("")
    .reduce((h, c) => ((h * 31 + c.charCodeAt(0)) & 0x7fffffff), 0);
  return `prices:${hash}`;
}

// ─── AI-estimated prices prompt ───────────────────────────────────────────────

const PRICE_PROMPT = (product) => `Tu es un expert en prix de la grande distribution française. Réponds TOUJOURS en français.

Produit: "${product}"

Génère des prix réalistes pour ce produit dans les enseignes françaises.
Retourne UNIQUEMENT ce JSON valide (sans markdown):
{
  "productName": "nom normalisé du produit",
  "prices": [
    { "store": "Amazon",    "price": 0.00, "available": true  },
    { "store": "Carrefour", "price": 0.00, "available": true  },
    { "store": "Leclerc",   "price": 0.00, "available": true  },
    { "store": "Auchan",    "price": 0.00, "available": true  },
    { "store": "Lidl",      "price": 0.00, "available": false }
  ],
  "unit": "unité de mesure (ex: 1 kg, 1L, 6 pièces)",
  "priceNote": "contexte utile sur les prix (1 phrase)"
}

Règles:
- Les prix doivent être réalistes en euros pour 2026.
- Leclerc et Lidl sont généralement les moins chers.
- Amazon est plus cher pour les produits frais, moins cher pour produits secs/emballés.
- available: false si le produit n'est typiquement pas vendu dans cette enseigne.
- prix à 0.00 pour les produits non disponibles.`;

// ─── Main function ─────────────────────────────────────────────────────────────

async function getPriceComparison(productName) {
  const key = cacheKey(productName);

  // Redis cache
  try {
    const cached = await redis.get(key);
    if (cached) return { ...JSON.parse(cached), cached: true };
  } catch {}

  let result;

  try {
    const raw = await callGemma(PRICE_PROMPT(productName));
    const parsed = extractJSON(raw);

    const availablePrices = (parsed.prices || [])
      .filter((p) => p.available && p.price > 0)
      .map((p) => ({
        store: p.store,
        price: Math.round(p.price * 100) / 100,
        logo: STORE_ICONS[p.store] || "🏪",
        available: true,
      }))
      .sort((a, b) => a.price - b.price);

    const cheapest = availablePrices[0] ?? null;
    const mostExpensive = availablePrices[availablePrices.length - 1];
    const savings =
      cheapest && mostExpensive && availablePrices.length > 1
        ? Math.round((mostExpensive.price - cheapest.price) * 100) / 100
        : 0;

    result = {
      productName: parsed.productName || productName,
      prices: availablePrices,
      cheapest,
      savings,
      unit: parsed.unit || "",
      priceNote: parsed.priceNote || "",
      estimatedAt: new Date().toISOString(),
      source: "ai_estimated", // transparent: these are AI estimates, not live scraped
    };
  } catch {
    // Fallback: return a structured empty result rather than crashing
    result = {
      productName,
      prices: [],
      cheapest: null,
      savings: 0,
      unit: "",
      priceNote: "Comparaison indisponible pour le moment.",
      estimatedAt: new Date().toISOString(),
      source: "unavailable",
    };
  }

  try {
    await redis.setex(key, CACHE_TTL, JSON.stringify(result));
  } catch {}

  return result;
}

module.exports = { getPriceComparison };

const prisma = require("./prisma");
const redis = require("./redis");

// ─── Period helpers ───────────────────────────────────────────────────────────

function getPeriodBounds(period) {
  const now = new Date();

  if (period === "weekly") {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay()); // Sunday
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (period === "monthly") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }

  // yearly
  const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  return { start, end };
}

// ─── Cached price lookup (from priceComparison Redis cache) ───────────────────

function priceKey(product) {
  return String(product)
    .toLowerCase()
    .split("")
    .reduce((h, c) => ((h * 31 + c.charCodeAt(0)) & 0x7fffffff), 0);
}

async function getCachedPrice(title) {
  try {
    const key = `prices:${priceKey(title)}`;
    const raw = await redis.get(key);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data?.cheapest?.price ?? null;
  } catch {
    return null;
  }
}

// ─── Main function ─────────────────────────────────────────────────────────────

async function calculateBudgetUsage(userId, category, period) {
  const { start, end } = getPeriodBounds(period);

  // Completed reminders in this category/period
  const purchases = await prisma.reminder.findMany({
    where: {
      userId,
      category,
      completedAt: { gte: start, lte: end },
      deletedAt: null,
    },
    orderBy: { completedAt: "desc" },
  });

  // Sum estimated spend from Redis price cache
  let estimatedSpent = 0;
  let pricedCount = 0;

  for (const p of purchases) {
    const price = await getCachedPrice(p.title);
    if (price != null) {
      estimatedSpent += price;
      pricedCount++;
    }
  }
  estimatedSpent = Math.round(estimatedSpent * 100) / 100;

  // User-defined budget
  const budget = await prisma.budget.findUnique({
    where: { userId_category_period: { userId, category, period } },
  });

  const budgetLimit = budget?.budgetLimit ?? null;
  const alertThreshold = budget?.alertThreshold ?? 0.8;
  const usagePct = budgetLimit ? Math.round((estimatedSpent / budgetLimit) * 100) : null;
  const remaining = budgetLimit != null ? Math.round((budgetLimit - estimatedSpent) * 100) / 100 : null;
  const alertTriggered = budgetLimit != null && estimatedSpent / budgetLimit >= alertThreshold;

  return {
    category,
    period,
    budgetLimit,
    estimatedSpent,
    remaining,
    usagePct,
    alertThreshold,
    alertTriggered,
    purchaseCount: purchases.length,
    pricedCount,           // how many had cached prices
    periodStart: start.toISOString().slice(0, 10),
    periodEnd: end.toISOString().slice(0, 10),
    hasBudget: budget != null,
  };
}

async function setBudget(userId, { category, budgetLimit, period, alertThreshold }) {
  return prisma.budget.upsert({
    where: { userId_category_period: { userId, category, period } },
    create: { userId, category, budgetLimit, period, alertThreshold: alertThreshold ?? 0.8 },
    update: { budgetLimit, alertThreshold: alertThreshold ?? 0.8 },
  });
}

async function updateBudget(id, userId, updates) {
  const existing = await prisma.budget.findFirst({ where: { id, userId } });
  if (!existing) return null;
  return prisma.budget.update({ where: { id }, data: updates });
}

async function listBudgets(userId) {
  return prisma.budget.findMany({ where: { userId }, orderBy: { category: "asc" } });
}

module.exports = { calculateBudgetUsage, setBudget, updateBudget, listBudgets, getPeriodBounds };

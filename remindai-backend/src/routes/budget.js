const express = require("express");
const { z } = require("zod");
const authMiddleware = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { calculateBudgetUsage, setBudget, updateBudget, listBudgets } = require("../services/budgetTracker");

const router = express.Router();
router.use(authMiddleware);

const VALID_PERIODS = ["weekly", "monthly", "yearly"];
const VALID_CATEGORIES = ["work", "personal", "health", "errand", "habit", "call"];

const setBudgetSchema = z.object({
  category:       z.enum(["work", "personal", "health", "errand", "habit", "call"]),
  budgetLimit:    z.number().positive().max(100000),
  period:         z.enum(["weekly", "monthly", "yearly"]),
  alertThreshold: z.number().min(0.1).max(1).optional().default(0.8),
});

const updateBudgetSchema = z.object({
  budgetLimit:    z.number().positive().max(100000).optional(),
  alertThreshold: z.number().min(0.1).max(1).optional(),
});

// GET /api/budget/usage?category=errand&period=monthly
router.get("/usage", async (req, res) => {
  const category = req.query.category?.toString() || "errand";
  const period   = req.query.period?.toString()   || "monthly";

  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `Invalid category. Valid: ${VALID_CATEGORIES.join(", ")}` });
  }
  if (!VALID_PERIODS.includes(period)) {
    return res.status(400).json({ error: `Invalid period. Valid: ${VALID_PERIODS.join(", ")}` });
  }

  try {
    const usage = await calculateBudgetUsage(req.user.userId, category, period);
    res.json(usage);
  } catch (err) {
    console.error("Budget usage error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/budget — list all budgets for user
router.get("/", async (req, res) => {
  try {
    const budgets = await listBudgets(req.user.userId);
    res.json(budgets);
  } catch (err) {
    console.error("List budgets error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/budget/set — create or update a budget
router.post("/set", validate(setBudgetSchema), async (req, res) => {
  const { category, budgetLimit, period, alertThreshold } = req.body;
  try {
    const budget = await setBudget(req.user.userId, { category, budgetLimit, period, alertThreshold });
    res.status(201).json(budget);
  } catch (err) {
    console.error("Set budget error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/budget/:id — update limits on existing budget
router.patch("/:id", validate(updateBudgetSchema), async (req, res) => {
  try {
    const updated = await updateBudget(req.params.id, req.user.userId, req.body);
    if (!updated) return res.status(404).json({ error: "Budget not found" });
    res.json(updated);
  } catch (err) {
    console.error("Update budget error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/budget/:id
router.delete("/:id", async (req, res) => {
  try {
    const existing = await require("../services/prisma").budget.findFirst({
      where: { id: req.params.id, userId: req.user.userId },
    });
    if (!existing) return res.status(404).json({ error: "Budget not found" });
    await require("../services/prisma").budget.delete({ where: { id: req.params.id } });
    res.json({ message: "Budget deleted" });
  } catch (err) {
    console.error("Delete budget error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

const express = require("express");
const prisma = require("../services/prisma");
const authMiddleware = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { createReminderSchema, updateReminderSchema } = require("../schemas/reminders");

const router = express.Router();
router.use(authMiddleware);

const FREE_TIER_LIMIT = 20;

// GET /api/reminders
router.get("/", async (req, res) => {
  try {
    const reminders = await prisma.reminder.findMany({
      where: { userId: req.user.userId, deletedAt: null },
      orderBy: { scheduledAt: "asc" },
    });
    res.json(reminders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/reminders
router.post("/", validate(createReminderSchema), async (req, res) => {
  const { title, scheduledAt, priority, category } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(401).json({ error: "User not found" });

    if (user.tier === "free") {
      const count = await prisma.reminder.count({
        where: { userId: req.user.userId, deletedAt: null, completedAt: null },
      });
      if (count >= FREE_TIER_LIMIT) {
        return res.status(429).json({ error: "Free tier limit reached", upgrade: true });
      }
    }

    const reminder = await prisma.reminder.create({
      data: {
        userId: req.user.userId,
        title,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        priority: priority ?? 2,
        category: category ?? "personal",
      },
    });
    res.status(201).json(reminder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/reminders/:id
router.put("/:id", validate(updateReminderSchema), async (req, res) => {
  const { title, scheduledAt, priority, category, completedAt } = req.body;
  try {
    const existing = await prisma.reminder.findFirst({
      where: { id: req.params.id, userId: req.user.userId, deletedAt: null },
    });
    if (!existing) return res.status(404).json({ error: "Reminder not found" });

    const reminder = await prisma.reminder.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(scheduledAt !== undefined && { scheduledAt: new Date(scheduledAt) }),
        ...(priority !== undefined && { priority }),
        ...(category !== undefined && { category }),
        ...(completedAt !== undefined && { completedAt: new Date(completedAt) }),
      },
    });
    res.json(reminder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/reminders/:id
router.delete("/:id", async (req, res) => {
  try {
    const existing = await prisma.reminder.findFirst({
      where: { id: req.params.id, userId: req.user.userId, deletedAt: null },
    });
    if (!existing) return res.status(404).json({ error: "Reminder not found" });

    await prisma.reminder.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });
    res.json({ message: "Reminder deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/reminders/:id/complete
router.patch("/:id/complete", async (req, res) => {
  try {
    const existing = await prisma.reminder.findFirst({
      where: { id: req.params.id, userId: req.user.userId, deletedAt: null },
    });
    if (!existing) return res.status(404).json({ error: "Reminder not found" });

    const reminder = await prisma.reminder.update({
      where: { id: req.params.id },
      data: { completedAt: new Date() },
    });
    res.json(reminder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

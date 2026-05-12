const express = require("express");
const prisma = require("../services/prisma");
const authMiddleware = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { createReminderSchema, updateReminderSchema } = require("../schemas/reminders");
const { getNextOccurrence } = require("../utils/recurrence");

const router = express.Router();
router.use(authMiddleware);

const FREE_TIER_LIMIT = 20;
const ARCHIVE_AFTER_DAYS = 30;

// GET /api/reminders → { pending, completed, archived }
router.get("/", async (req, res) => {
  try {
    const archiveCutoff = new Date();
    archiveCutoff.setDate(archiveCutoff.getDate() - ARCHIVE_AFTER_DAYS);

    // Auto-archive completed reminders older than 30 days
    await prisma.reminder.updateMany({
      where: {
        userId: req.user.userId,
        deletedAt: null,
        archivedAt: null,
        completedAt: { lt: archiveCutoff },
      },
      data: { archivedAt: new Date() },
    });

    const all = await prisma.reminder.findMany({
      where: { userId: req.user.userId, deletedAt: null },
      orderBy: { scheduledAt: "asc" },
    });

    const pending = [];
    const completed = [];
    const archived = [];

    for (const r of all) {
      if (r.archivedAt) {
        archived.push(r);
      } else if (r.completedAt) {
        completed.push(r);
      } else {
        pending.push(r);
      }
    }

    res.json({ pending, completed, archived });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/reminders
router.post("/", validate(createReminderSchema), async (req, res) => {
  const { title, description, scheduledAt, priority, category, frequency, frequencyDays, notifyBefore, contextAi,
          useGeolocation, locationName, locationLat, locationLng, locationRadius } = req.body;

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

    const baseDate = scheduledAt ? new Date(scheduledAt) : null;
    const reminderData = {
      frequency: frequency ?? "once",
      scheduledAt: baseDate,
      frequencyDays: frequencyDays ?? null,
    };
    const nextOccurrence = getNextOccurrence(reminderData);

    const reminder = await prisma.reminder.create({
      data: {
        userId: req.user.userId,
        title,
        description: description ?? null,
        scheduledAt: baseDate,
        priority: priority ?? 2,
        category: category ?? "personal",
        frequency: frequency ?? "once",
        frequencyDays: frequencyDays ?? undefined,
        nextOccurrence,
        notifyBefore: notifyBefore ?? null,
        contextAi: contextAi ?? null,
        useGeolocation: useGeolocation ?? false,
        locationName: locationName ?? null,
        locationLat: locationLat ?? null,
        locationLng: locationLng ?? null,
        locationRadius: locationRadius ?? 500,
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
  const { title, description, scheduledAt, priority, category, frequency, frequencyDays, notifyBefore, completedAt,
          useGeolocation, locationName, locationLat, locationLng, locationRadius } = req.body;
  try {
    const existing = await prisma.reminder.findFirst({
      where: { id: req.params.id, userId: req.user.userId, deletedAt: null },
    });
    if (!existing) return res.status(404).json({ error: "Reminder not found" });

    const updatedScheduledAt = scheduledAt !== undefined ? new Date(scheduledAt) : existing.scheduledAt;
    const updatedFrequency = frequency ?? existing.frequency;
    const updatedFrequencyDays = frequencyDays ?? existing.frequencyDays;

    const nextOccurrence = getNextOccurrence({
      frequency: updatedFrequency,
      frequencyDays: updatedFrequencyDays,
      scheduledAt: updatedScheduledAt,
    });

    const reminder = await prisma.reminder.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(scheduledAt !== undefined && { scheduledAt: new Date(scheduledAt) }),
        ...(priority !== undefined && { priority }),
        ...(category !== undefined && { category }),
        ...(frequency !== undefined && { frequency }),
        ...(frequencyDays !== undefined && { frequencyDays }),
        ...(notifyBefore !== undefined && { notifyBefore }),
        ...(completedAt !== undefined && { completedAt: new Date(completedAt) }),
        ...(useGeolocation !== undefined && { useGeolocation }),
        ...(locationName !== undefined && { locationName }),
        ...(locationLat !== undefined && { locationLat }),
        ...(locationLng !== undefined && { locationLng }),
        ...(locationRadius !== undefined && { locationRadius }),
        nextOccurrence,
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
// For recurring reminders: marks current as complete and spawns next occurrence
router.patch("/:id/complete", async (req, res) => {
  try {
    const existing = await prisma.reminder.findFirst({
      where: { id: req.params.id, userId: req.user.userId, deletedAt: null },
    });
    if (!existing) return res.status(404).json({ error: "Reminder not found" });

    const now = new Date();
    const reminder = await prisma.reminder.update({
      where: { id: req.params.id },
      data: { completedAt: now },
    });

    let nextReminder = null;
    if (existing.frequency !== "once") {
      // Use the pre-computed nextOccurrence as the scheduledAt for the new reminder,
      // or compute it from current scheduledAt if not yet stored.
      const nextScheduledAt = existing.nextOccurrence ?? getNextOccurrence({
        frequency: existing.frequency,
        frequencyDays: existing.frequencyDays,
        scheduledAt: existing.scheduledAt,
      });

      nextReminder = await prisma.reminder.create({
        data: {
          userId: existing.userId,
          title: existing.title,
          description: existing.description,
          scheduledAt: nextScheduledAt,
          priority: existing.priority,
          category: existing.category,
          frequency: existing.frequency,
          frequencyDays: existing.frequencyDays ?? undefined,
          nextOccurrence: getNextOccurrence({
            frequency: existing.frequency,
            frequencyDays: existing.frequencyDays,
            scheduledAt: nextScheduledAt,
          }),
          notifyBefore: existing.notifyBefore,
          contextAi: existing.contextAi,
        },
      });
    }

    res.json({ reminder, nextReminder });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/reminders/:id/archive
router.patch("/:id/archive", async (req, res) => {
  try {
    const existing = await prisma.reminder.findFirst({
      where: { id: req.params.id, userId: req.user.userId, deletedAt: null },
    });
    if (!existing) return res.status(404).json({ error: "Reminder not found" });

    const reminder = await prisma.reminder.update({
      where: { id: req.params.id },
      data: { archivedAt: new Date() },
    });
    res.json(reminder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/reminders/:id/restore
router.patch("/:id/restore", async (req, res) => {
  try {
    const existing = await prisma.reminder.findFirst({
      where: { id: req.params.id, userId: req.user.userId, deletedAt: null },
    });
    if (!existing) return res.status(404).json({ error: "Reminder not found" });

    const reminder = await prisma.reminder.update({
      where: { id: req.params.id },
      data: { archivedAt: null, completedAt: null },
    });
    res.json(reminder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

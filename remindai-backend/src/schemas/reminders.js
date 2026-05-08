const { z } = require("zod");

const createReminderSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  scheduledAt: z.string().datetime({ offset: true }).optional(),
  priority: z.number().int().min(1).max(4).optional().default(2),
  category: z.enum(["work", "personal", "health", "errand", "habit"]).optional().default("personal"),
});

const updateReminderSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  scheduledAt: z.string().datetime({ offset: true }).optional(),
  priority: z.number().int().min(1).max(4).optional(),
  category: z.enum(["work", "personal", "health", "errand", "habit"]).optional(),
  completedAt: z.string().datetime({ offset: true }).optional(),
});

module.exports = { createReminderSchema, updateReminderSchema };

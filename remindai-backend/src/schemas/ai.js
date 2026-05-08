const { z } = require("zod");

const parseSchema = z.object({
  text: z.string().min(1).max(500),
  language: z.enum(["fr", "en", "auto"]).default("auto"),
});

const adviceSchema = z.object({
  title: z.string().min(1),
  reminderType: z
    .enum(["call", "shopping", "study", "appointment", "medication", "habit", "task"])
    .optional(),
  category: z.enum(["work", "personal", "health", "errand", "habit"]).optional(),
  scheduledAt: z.string().nullable().optional(),
  priority: z.number().int().min(1).max(4).optional(),
  entities: z
    .object({
      person: z.string().nullable().optional(),
      frequency: z.string().nullable().optional(),
      details: z.string().nullable().optional(),
      notifyBefore: z.string().nullable().optional(),
    })
    .optional(),
});

const suggestSchema = z.object({
  topCategory: z.string().optional(),
  patterns: z
    .array(
      z.object({
        category: z.string(),
        count: z.number(),
        preferredHour: z.number(),
        avgPriority: z.number(),
      })
    )
    .optional(),
  limit: z.number().int().min(1).max(10).default(3),
});

module.exports = { parseSchema, adviceSchema, suggestSchema };

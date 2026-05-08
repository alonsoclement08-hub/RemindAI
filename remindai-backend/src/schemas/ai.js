const { z } = require("zod");

const parseSchema = z.object({
  text: z.string().min(1).max(500),
  language: z.enum(["fr", "en", "auto"]).default("auto"),
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

module.exports = { parseSchema, suggestSchema };

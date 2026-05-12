const { z } = require("zod");

const frequencyEnum = z.enum(["once", "daily", "weekly", "monthly", "custom"]);

const geoFields = {
  useGeolocation: z.boolean().optional(),
  locationName:   z.string().max(255).optional(),
  locationLat:    z.number().min(-90).max(90).optional(),
  locationLng:    z.number().min(-180).max(180).optional(),
  locationRadius: z.number().int().min(50).max(5000).optional(),
};

const createReminderSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  description: z.string().max(2000).optional(),
  scheduledAt: z.string().datetime({ offset: true }).optional(),
  priority: z.number().int().min(1).max(4).optional().default(2),
  category: z.enum(["work", "personal", "health", "errand", "habit", "call"]).optional().default("personal"),
  frequency: frequencyEnum.optional().default("once"),
  frequencyDays: z.array(z.number().int().min(0).max(6)).optional(),
  notifyBefore: z.number().int().min(0).optional(),
  contextAi: z.string().optional(),
  ...geoFields,
});

const updateReminderSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).optional(),
  scheduledAt: z.string().datetime({ offset: true }).optional(),
  priority: z.number().int().min(1).max(4).optional(),
  category: z.enum(["work", "personal", "health", "errand", "habit", "call"]).optional(),
  frequency: frequencyEnum.optional(),
  frequencyDays: z.array(z.number().int().min(0).max(6)).optional(),
  notifyBefore: z.number().int().min(0).optional(),
  completedAt: z.string().datetime({ offset: true }).optional(),
  ...geoFields,
});

module.exports = { createReminderSchema, updateReminderSchema };

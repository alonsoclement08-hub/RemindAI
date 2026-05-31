const express = require("express");
const prisma = require("../services/prisma");
const authMiddleware = require("../middleware/auth");
const { getNextOccurrence } = require("../utils/recurrence");

const router = express.Router();
router.use(authMiddleware);

const FREE_TIER_LIMIT = 20;

// Parse a value that might be a JSON string (frequency_days from SQLite)
function parseFrequencyDays(val) {
  if (!val) return undefined;
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return undefined; }
  }
  return undefined;
}

// POST /api/sync — batch sync from mobile client
// Accepts { client_timestamp, changes: [{action, id, reminder}] }
// Returns { results, server_changes, conflicts }
router.post("/", async (req, res) => {
  const userId = req.user.userId;
  const { changes = [] } = req.body;

  if (!Array.isArray(changes)) {
    return res.status(400).json({ error: "changes must be an array" });
  }

  const results = [];
  const serverChanges = [];

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(401).json({ error: "User not found" });

  for (const change of changes) {
    const localId = change.id;
    try {
      if (change.action === "create") {
        const r = change.reminder || {};

        // Free tier limit check
        if (user.tier === "free") {
          const count = await prisma.reminder.count({
            where: { userId, deletedAt: null, completedAt: null },
          });
          if (count >= FREE_TIER_LIMIT) {
            results.push({ localId, success: false, error: "limit_reached" });
            continue;
          }
        }

        const scheduledAt = r.scheduledAt || r.scheduled_at;
        const freqDays = parseFrequencyDays(r.frequencyDays ?? r.frequency_days);
        const baseDate = scheduledAt ? new Date(scheduledAt) : null;
        const reminderMeta = {
          frequency: r.frequency ?? "once",
          scheduledAt: baseDate,
          frequencyDays: freqDays ?? null,
        };

        const reminder = await prisma.reminder.create({
          data: {
            userId,
            title: (r.title || "Sans titre").slice(0, 500),
            description: r.description ? r.description.slice(0, 2000) : null,
            scheduledAt: baseDate,
            priority: Number(r.priority) || 2,
            category: r.category || "personal",
            frequency: r.frequency || "once",
            frequencyDays: freqDays ?? undefined,
            nextOccurrence: getNextOccurrence(reminderMeta),
            notifyBefore: r.notifyBefore ?? r.notify_before ?? null,
            contextAi: r.contextAi ?? r.context_ai ?? null,
            useGeolocation: !!(r.useGeolocation || r.use_geolocation),
            locationName: r.locationName ?? r.location_name ?? null,
            locationLat: r.locationLat ?? r.location_lat ?? null,
            locationLng: r.locationLng ?? r.location_lng ?? null,
            locationRadius: Number(r.locationRadius ?? r.location_radius) || 500,
          },
        });

        results.push({ localId, serverId: reminder.id, success: true });
        // Return the server reminder so the client can update its local record
        serverChanges.push({ action: "create", localId, id: reminder.id, reminder });

      } else if (change.action === "update") {
        const r = change.reminder || {};

        const existing = await prisma.reminder.findFirst({
          where: { id: localId, userId, deletedAt: null },
        });

        if (existing) {
          const data = {};
          if (r.title !== undefined) data.title = r.title.slice(0, 500);
          if (r.description !== undefined) data.description = r.description;
          if (r.priority !== undefined) data.priority = Number(r.priority);
          if (r.category !== undefined) data.category = r.category;
          if (r.frequency !== undefined) data.frequency = r.frequency;
          if (r.completedAt !== undefined) data.completedAt = r.completedAt ? new Date(r.completedAt) : null;
          if (r.archivedAt !== undefined) data.archivedAt = r.archivedAt ? new Date(r.archivedAt) : null;
          if (r.scheduledAt !== undefined) data.scheduledAt = r.scheduledAt ? new Date(r.scheduledAt) : null;

          await prisma.reminder.update({ where: { id: localId }, data });
        }
        results.push({ localId, success: true });

      } else if (change.action === "delete") {
        await prisma.reminder.updateMany({
          where: { id: localId, userId },
          data: { deletedAt: new Date() },
        });
        results.push({ localId, success: true });

      } else {
        results.push({ localId, success: false, error: "unknown action" });
      }
    } catch (err) {
      console.error(`Sync error for ${localId}:`, err.message);
      results.push({ localId, success: false, error: err.message });
    }
  }

  res.json({ results, server_changes: serverChanges, conflicts: [] });
});

module.exports = router;

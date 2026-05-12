const express = require("express");
const { z } = require("zod");
const authMiddleware = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { checkNearbyReminders, resetGeoNotified } = require("../services/geolocation");

const router = express.Router();
router.use(authMiddleware);

const nearbySchema = z.object({
  latitude:  z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// POST /api/location/nearby
// Mobile sends current coords → server returns triggered geo-reminders
router.post("/nearby", validate(nearbySchema), async (req, res) => {
  const { latitude, longitude } = req.body;
  try {
    const triggered = await checkNearbyReminders(req.user.userId, latitude, longitude);
    res.json({ triggered, count: triggered.length });
  } catch (err) {
    console.error("Geo check error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/location/:id/reset-geo
// Resets geoNotified so the reminder can fire again (e.g. after snooze)
router.patch("/:id/reset-geo", async (req, res) => {
  try {
    await resetGeoNotified(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error("Reset geo error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

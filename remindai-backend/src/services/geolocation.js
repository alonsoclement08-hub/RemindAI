const prisma = require("./prisma");

const EARTH_RADIUS_M = 6371e3;

/**
 * Haversine formula — returns distance between two coordinates in metres.
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Returns pending geo-reminders that are within their radius of (lat, lng).
 * Also marks returned reminders as geoNotified so they aren't re-triggered.
 */
async function checkNearbyReminders(userId, latitude, longitude) {
  const candidates = await prisma.reminder.findMany({
    where: {
      userId,
      useGeolocation: true,
      geoNotified: false,
      completedAt: null,
      deletedAt: null,
      archivedAt: null,
    },
  });

  const triggered = candidates.filter((r) => {
    if (r.locationLat == null || r.locationLng == null) return false;
    const dist = calculateDistance(latitude, longitude, r.locationLat, r.locationLng);
    return dist <= r.locationRadius;
  });

  if (triggered.length > 0) {
    await prisma.reminder.updateMany({
      where: { id: { in: triggered.map((r) => r.id) } },
      data: { geoNotified: true },
    });
  }

  return triggered;
}

/**
 * Resets geoNotified so the reminder can fire again next time (e.g. after snooze).
 */
async function resetGeoNotified(reminderId) {
  await prisma.reminder.update({
    where: { id: reminderId },
    data: { geoNotified: false },
  });
}

module.exports = { calculateDistance, checkNearbyReminders, resetGeoNotified };

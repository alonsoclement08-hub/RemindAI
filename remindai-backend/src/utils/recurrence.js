/**
 * Computes the next occurrence DateTime for a recurring reminder.
 * Returns null for frequency "once".
 */
function getNextOccurrence(reminder) {
  const { frequency, frequencyDays, scheduledAt } = reminder;
  if (!frequency || frequency === "once") return null;

  const base = scheduledAt ? new Date(scheduledAt) : new Date();
  const hours = base.getHours();
  const minutes = base.getMinutes();
  const seconds = base.getSeconds();

  const next = new Date(base);

  if (frequency === "daily") {
    next.setDate(next.getDate() + 1);
    return next;
  }

  if (frequency === "weekly") {
    next.setDate(next.getDate() + 7);
    return next;
  }

  if (frequency === "monthly") {
    next.setMonth(next.getMonth() + 1);
    return next;
  }

  if (frequency === "custom" && Array.isArray(frequencyDays) && frequencyDays.length > 0) {
    // frequencyDays: array of weekday numbers (0=Sun ... 6=Sat)
    const today = base.getDay();
    const sorted = [...frequencyDays].sort((a, b) => a - b);
    // Find the next day index after today
    const nextDay = sorted.find((d) => d > today) ?? sorted[0];
    const diff = nextDay > today ? nextDay - today : 7 - today + nextDay;
    next.setDate(next.getDate() + diff);
    next.setHours(hours, minutes, seconds, 0);
    return next;
  }

  return null;
}

module.exports = { getNextOccurrence };

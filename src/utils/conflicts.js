// Flags reminders scheduled too close to one another so the user doesn't
// double-book a time slot without realizing it.
const DEFAULT_BUFFER_MINUTES = 30;

export function findConflict(reminders, scheduledAt, excludeId = null, bufferMinutes = DEFAULT_BUFFER_MINUTES) {
  if (!scheduledAt) return null;
  const target = new Date(scheduledAt).getTime();
  if (Number.isNaN(target)) return null;

  const bufferMs = bufferMinutes * 60 * 1000;

  return reminders.find((r) => {
    if (r.id === excludeId) return false;
    if (r.completed_at || r.deleted_at || r.archived_at) return false;
    if (!r.scheduled_at) return false;

    const other = new Date(r.scheduled_at).getTime();
    if (Number.isNaN(other)) return false;

    return Math.abs(other - target) < bufferMs;
  }) || null;
}

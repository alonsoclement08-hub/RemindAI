import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

function formatICSDate(isoString) {
  // Convert ISO string to ICS format: 20250517T140000Z
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`
  );
}

function escapeICS(str) {
  return (str || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export async function exportReminderToCalendar(reminder) {
  const now = new Date();
  const dtStamp = formatICSDate(now.toISOString());
  const dtStart = reminder.scheduled_at
    ? formatICSDate(reminder.scheduled_at)
    : dtStamp;

  // End time = start + 30 min
  const endDate = new Date(reminder.scheduled_at || now);
  endDate.setMinutes(endDate.getMinutes() + 30);
  const dtEnd = formatICSDate(endDate.toISOString());

  const uid = `remindai-${reminder.id}@app`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//RemindAI//RemindAI//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeICS(reminder.title)}`,
    reminder.description ? `DESCRIPTION:${escapeICS(reminder.description)}` : null,
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeICS(reminder.title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');

  const fileName = `remindai_${reminder.id}.ics`;
  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(fileUri, lines, { encoding: FileSystem.EncodingType.UTF8 });

  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) throw new Error('Partage non disponible sur cet appareil');

  await Sharing.shareAsync(fileUri, {
    mimeType: 'text/calendar',
    dialogTitle: 'Ajouter au calendrier',
    UTI: 'public.calendar-event',
  });
}

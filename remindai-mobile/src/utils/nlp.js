import { addDays, setHours, setMinutes, startOfDay, nextMonday, nextDay } from 'date-fns';

const DAYS_FR = {
  lundi: 1, mardi: 2, mercredi: 3, jeudi: 4,
  vendredi: 5, samedi: 6, dimanche: 0,
};

const CATEGORIES_FR = {
  appel: 'work', call: 'work', téléphone: 'work', réunion: 'work', meeting: 'work',
  médecin: 'health', docteur: 'health', sport: 'health', gym: 'health',
  courses: 'errand', acheter: 'errand', pharmacy: 'errand',
  méditer: 'habit', méditation: 'habit', courir: 'habit',
};

function detectCategory(text) {
  const lower = text.toLowerCase();
  for (const [keyword, cat] of Object.entries(CATEGORIES_FR)) {
    if (lower.includes(keyword)) return cat;
  }
  return 'personal';
}

function detectPriority(text) {
  const lower = text.toLowerCase();
  if (lower.includes('urgent') || lower.includes('important')) return 4;
  if (lower.includes('asap') || lower.includes('vite')) return 3;
  return 2;
}

function parseTime(text) {
  // FR "à 14h30" or "à 14:30" — h or colon separator with minutes
  const frFull = text.match(/à\s*(\d{1,2})[h:](\d{2})/i);
  if (frFull) {
    return { hour: parseInt(frFull[1], 10), minute: parseInt(frFull[2], 10) };
  }
  // FR "à 14h" — hour only, no minutes
  const frHour = text.match(/à\s*(\d{1,2})h\b/i);
  if (frHour) {
    return { hour: parseInt(frHour[1], 10), minute: 0 };
  }
  // EN "at 3pm", "at 10:30am" — must have am/pm to avoid false positives
  const en = text.match(/\bat\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (en) {
    let hour = parseInt(en[1], 10);
    const minute = parseInt(en[2] || 0, 10);
    if (en[3]?.toLowerCase() === 'pm' && hour < 12) hour += 12;
    if (en[3]?.toLowerCase() === 'am' && hour === 12) hour = 0;
    return { hour, minute };
  }
  return { hour: 9, minute: 0 };
}

function parseDate(text) {
  const lower = text.toLowerCase();
  const now = new Date();
  const time = parseTime(text);

  let base = now;

  if (lower.includes('demain') || lower.includes('tomorrow')) {
    base = addDays(now, 1);
  } else if (lower.includes('après-demain') || lower.includes('day after')) {
    base = addDays(now, 2);
  } else if (lower.includes('semaine prochaine') || lower.includes('next week')) {
    base = nextMonday(now);
  } else if (lower.includes('ce soir') || lower.includes('tonight')) {
    base = now;
    // Only apply default evening hour when no explicit time was given
    if (time.hour === 9 && time.minute === 0) time.hour = 20;
  } else {
    for (const [dayName, dayNum] of Object.entries(DAYS_FR)) {
      if (lower.includes(dayName)) {
        base = nextDay(now, dayNum);
        break;
      }
    }
  }

  return setMinutes(setHours(startOfDay(base), time.hour), time.minute);
}

function extractTitle(text) {
  return text
    .replace(/demain|tomorrow|après-demain|ce soir|tonight|semaine prochaine|next week/gi, '')
    .replace(/à\s*\d{1,2}[h:]\d*|at\s*\d{1,2}(:\d{2})?\s*(am|pm)?/gi, '')
    .replace(/lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche/gi, '')
    .replace(/urgent|important|asap/gi, '')
    .replace(/rappelle-moi (de |d')?/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseNLP(text) {
  const title = extractTitle(text) || text.trim();
  let scheduledAt = parseDate(text);
  const category = detectCategory(text);
  const priority = detectPriority(text);

  // If the computed time is already in the past and no explicit future date
  // was given, the user means "next occurrence" → push to tomorrow
  const lower = text.toLowerCase();
  const hasExplicitFuture = lower.includes('demain') || lower.includes('tomorrow')
    || lower.includes('après-demain') || lower.includes('semaine prochaine')
    || lower.includes('next week') || Object.keys(DAYS_FR).some((d) => lower.includes(d));
  if (scheduledAt < new Date() && !hasExplicitFuture) {
    scheduledAt = addDays(scheduledAt, 1);
  }

  return {
    title: title.charAt(0).toUpperCase() + title.slice(1),
    scheduledAt,
    category,
    priority,
    raw: text,
  };
}

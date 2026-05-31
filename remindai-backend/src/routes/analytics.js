const express = require('express');
const prisma = require('../services/prisma');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const CATEGORY_COLORS = {
  work: '#7F77DD',
  personal: '#4CAF82',
  health: '#E8735A',
  errand: '#F09B30',
  habit: '#3B9BDB',
  call: '#9C59D1',
};

const CATEGORY_LABELS = {
  work: 'Travail',
  personal: 'Personnel',
  health: 'Santé',
  errand: 'Courses',
  habit: 'Habitudes',
  call: 'Appels',
};

const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const DAY_NAMES_FULL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTH_NAMES = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

function getPeriodBounds(period) {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const start = new Date(now);
  const periodDays = period === 'week' ? 6 : period === 'month' ? 29 : 364;
  start.setDate(start.getDate() - periodDays);
  start.setHours(0, 0, 0, 0);

  const duration = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - duration);

  return { start, end, prevStart, prevEnd, periodDays: periodDays + 1 };
}

function toDateKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function getStreak(userId) {
  const completions = await prisma.reminder.findMany({
    where: { userId, completedAt: { not: null }, deletedAt: null },
    select: { completedAt: true },
  });

  const days = new Set(completions.map(r => toDateKey(r.completedAt)));

  let streak = 0;
  const checkDate = new Date();
  checkDate.setHours(0, 0, 0, 0);

  for (let i = 0; i < 366; i++) {
    if (!days.has(toDateKey(checkDate))) break;
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}

// ── GET /api/analytics/summary?period=week|month|year ─────────────────────────
router.get('/summary', async (req, res) => {
  const { period = 'week' } = req.query;
  const userId = req.user.userId;
  const { start, end, prevStart, prevEnd } = getPeriodBounds(period);

  try {
    const [current, previous, streak] = await Promise.all([
      prisma.reminder.findMany({
        where: { userId, deletedAt: null, createdAt: { gte: start, lte: end } },
        select: { completedAt: true },
      }),
      prisma.reminder.findMany({
        where: { userId, deletedAt: null, createdAt: { gte: prevStart, lte: prevEnd } },
        select: { completedAt: true },
      }),
      getStreak(userId),
    ]);

    const completed = current.filter(r => r.completedAt).length;
    const total = current.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const prevCompleted = previous.filter(r => r.completedAt).length;
    let trend = 0;
    if (prevCompleted > 0) {
      trend = Math.round(((completed - prevCompleted) / prevCompleted) * 100);
    } else if (completed > 0) {
      trend = 100;
    }

    res.json({ completed, total, rate, trend, streak });
  } catch (err) {
    console.error('[analytics/summary]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/analytics/charts?period=week|month|year ──────────────────────────
router.get('/charts', async (req, res) => {
  const { period = 'week' } = req.query;
  const userId = req.user.userId;
  const { start, end, periodDays } = getPeriodBounds(period);

  try {
    const reminders = await prisma.reminder.findMany({
      where: { userId, deletedAt: null, createdAt: { gte: start, lte: end } },
      select: { completedAt: true, createdAt: true, category: true },
    });

    // ── completionByDay ──
    const dayMap = {};

    if (period === 'year') {
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        dayMap[key] = { label: MONTH_NAMES[d.getMonth()], completed: 0, total: 0 };
      }
      for (const r of reminders) {
        const d = new Date(r.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (dayMap[key]) {
          dayMap[key].total++;
          if (r.completedAt) dayMap[key].completed++;
        }
      }
    } else {
      for (let i = periodDays - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const key = toDateKey(d);
        const label = period === 'week' ? DAY_NAMES[d.getDay()] : String(d.getDate());
        dayMap[key] = { label, completed: 0, total: 0 };
      }
      for (const r of reminders) {
        const key = toDateKey(r.createdAt);
        if (dayMap[key]) {
          dayMap[key].total++;
          if (r.completedAt) dayMap[key].completed++;
        }
      }
    }
    const completionByDay = Object.values(dayMap);

    // ── completionByHour ──
    const hourMap = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
    for (const r of reminders) {
      if (r.completedAt) {
        hourMap[new Date(r.completedAt).getHours()].count++;
      }
    }
    const completionByHour = hourMap;

    // ── categoryBreakdown ──
    const catMap = {};
    for (const r of reminders) {
      if (r.completedAt) {
        catMap[r.category] = (catMap[r.category] || 0) + 1;
      }
    }
    const categoryBreakdown = Object.entries(catMap)
      .map(([category, count]) => ({
        category,
        count,
        label: CATEGORY_LABELS[category] || category,
        color: CATEGORY_COLORS[category] || '#999',
      }))
      .sort((a, b) => b.count - a.count);

    // ── productivityScore ──
    const completedCount = reminders.filter(r => r.completedAt).length;
    const totalCount = reminders.length;
    const completionRate = totalCount > 0 ? completedCount / totalCount : 0;
    const activeDays = new Set(
      reminders.filter(r => r.completedAt).map(r => toDateKey(r.completedAt))
    ).size;
    const consistency = periodDays > 0 ? activeDays / periodDays : 0;
    const productivityScore = Math.round((completionRate * 0.6 + consistency * 0.4) * 100);

    res.json({ completionByDay, completionByHour, categoryBreakdown, productivityScore });
  } catch (err) {
    console.error('[analytics/charts]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/analytics/insights?period=week|month ─────────────────────────────
router.get('/insights', async (req, res) => {
  const { period = 'week' } = req.query;
  const userId = req.user.userId;
  const { start, end, prevStart, prevEnd, periodDays } = getPeriodBounds(period);

  try {
    const [current, previous, streak] = await Promise.all([
      prisma.reminder.findMany({
        where: { userId, deletedAt: null, createdAt: { gte: start, lte: end } },
        select: { completedAt: true, category: true, createdAt: true },
      }),
      prisma.reminder.findMany({
        where: { userId, deletedAt: null, createdAt: { gte: prevStart, lte: prevEnd } },
        select: { completedAt: true, category: true },
      }),
      getStreak(userId),
    ]);

    const insights = [];
    const currentCompleted = current.filter(r => r.completedAt).length;
    const prevCompleted = previous.filter(r => r.completedAt).length;
    const periodLabel = period === 'week' ? 'semaine' : 'mois';

    // Completion trend
    if (currentCompleted > prevCompleted && prevCompleted > 0) {
      const diff = currentCompleted - prevCompleted;
      const pct = Math.round((diff / prevCompleted) * 100);
      insights.push({ type: 'positive', emoji: '🚀', text: `Tu as complété ${diff} rappel${diff > 1 ? 's' : ''} de plus cette ${periodLabel} (+${pct}%) !` });
    } else if (prevCompleted > 0 && currentCompleted < prevCompleted) {
      const diff = prevCompleted - currentCompleted;
      insights.push({ type: 'warning', emoji: '📉', text: `${diff} rappel${diff > 1 ? 's' : ''} de moins par rapport à la période précédente.` });
    }

    // Best hour
    const hourCounts = {};
    for (const r of current) {
      if (r.completedAt) {
        const h = new Date(r.completedAt).getHours();
        hourCounts[h] = (hourCounts[h] || 0) + 1;
      }
    }
    const bestHourEntry = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
    if (bestHourEntry) {
      const h = parseInt(bestHourEntry[0]);
      insights.push({ type: 'info', emoji: '⏰', text: `Ton meilleur moment : ${h}h–${h + 1}h (${bestHourEntry[1]} complété${bestHourEntry[1] > 1 ? 's' : ''})` });
    }

    // Best day of week
    const dayCounts = {};
    for (const r of current) {
      if (r.completedAt) {
        const d = new Date(r.completedAt).getDay();
        dayCounts[d] = (dayCounts[d] || 0) + 1;
      }
    }
    const bestDayEntry = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
    if (bestDayEntry) {
      insights.push({ type: 'info', emoji: '📅', text: `Jour le plus productif : ${DAY_NAMES_FULL[parseInt(bestDayEntry[0])]} (${bestDayEntry[1]} complété${bestDayEntry[1] > 1 ? 's' : ''})` });
    }

    // Category trends
    const curCats = {};
    const prevCats = {};
    for (const r of current) { if (r.completedAt) curCats[r.category] = (curCats[r.category] || 0) + 1; }
    for (const r of previous) { if (r.completedAt) prevCats[r.category] = (prevCats[r.category] || 0) + 1; }

    let bestGrowth = null;
    let worstDecline = null;
    for (const [cat, count] of Object.entries(curCats)) {
      const prev = prevCats[cat] || 0;
      if (prev > 0) {
        const growth = ((count - prev) / prev) * 100;
        if (growth > 20 && (!bestGrowth || growth > bestGrowth.pct)) bestGrowth = { cat, pct: Math.round(growth) };
        if (growth < -20 && (!worstDecline || growth < worstDecline.pct)) worstDecline = { cat, pct: Math.round(growth) };
      }
    }
    if (bestGrowth) insights.push({ type: 'positive', emoji: '📈', text: `${CATEGORY_LABELS[bestGrowth.cat] || bestGrowth.cat} en hausse (+${bestGrowth.pct}%)` });
    if (worstDecline) insights.push({ type: 'warning', emoji: '📉', text: `${CATEGORY_LABELS[worstDecline.cat] || worstDecline.cat} en baisse (${worstDecline.pct}%)` });

    // Streak
    if (streak >= 2) {
      insights.push({ type: 'positive', emoji: '🔥', text: `Streak de ${streak} jours consécutifs ! Continue comme ça !` });
    }

    // Daily average
    const avgPerDay = periodDays > 0 ? (currentCompleted / periodDays).toFixed(1) : 0;
    if (avgPerDay > 0) {
      insights.push({ type: 'info', emoji: '📊', text: `Moyenne de ${avgPerDay} rappel${avgPerDay > 1 ? 's' : ''} complété${avgPerDay > 1 ? 's' : ''} par jour` });
    }

    if (!insights.length) {
      insights.push({ type: 'info', emoji: '🌱', text: 'Crée et complète des rappels pour voir tes insights personnalisés !' });
    }

    res.json({ insights });
  } catch (err) {
    console.error('[analytics/insights]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/analytics/export/text?period=month ───────────────────────────────
router.get('/export/text', async (req, res) => {
  const { period = 'month' } = req.query;
  const userId = req.user.userId;
  const { start, end } = getPeriodBounds(period);

  try {
    const reminders = await prisma.reminder.findMany({
      where: { userId, deletedAt: null, createdAt: { gte: start, lte: end } },
      select: { completedAt: true, category: true },
    });

    const completed = reminders.filter(r => r.completedAt).length;
    const total = reminders.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const streak = await getStreak(userId);

    const catMap = {};
    for (const r of reminders) {
      if (r.completedAt) catMap[r.category] = (catMap[r.category] || 0) + 1;
    }

    const periodLabel = period === 'week' ? 'SEMAINE' : period === 'month' ? 'MOIS' : 'ANNÉE';
    const catLines = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, count]) => `  • ${CATEGORY_LABELS[cat] || cat}: ${count}`)
      .join('\n') || '  Aucune donnée';

    const report = `📊 RAPPORT REMINDAI — CETTE ${periodLabel}
━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Rappels complétés: ${completed}/${total}
🎯 Taux de complétion: ${rate}%
🔥 Streak actuel: ${streak} jour${streak !== 1 ? 's' : ''}

📂 Par catégorie:
${catLines}
━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 Généré par RemindAI`;

    res.json({ report, period, completed, total, rate, streak });
  } catch (err) {
    console.error('[analytics/export]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/analytics/log ───────────────────────────────────────────────────
router.post('/log', (req, res) => {
  res.json({ ok: true });
});

module.exports = router;

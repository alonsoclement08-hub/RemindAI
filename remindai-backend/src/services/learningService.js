const prisma = require('./prisma');

function calculateScore(timesCompleted, timesIgnored) {
  return (timesCompleted - timesIgnored * 0.5) / (timesCompleted + timesIgnored + 1);
}

async function updatePreference(userId, category, action) {
  const isPositive = action === 'completed' || action === 'liked';
  const isNegative = action === 'ignored' || action === 'disliked';

  const existing = await prisma.userPreference.findUnique({
    where: { userId_category: { userId, category } },
  });

  const newCompleted = (existing?.timesCompleted || 0) + (isPositive ? 1 : 0);
  const newIgnored = (existing?.timesIgnored || 0) + (isNegative ? 1 : 0);
  const newScore = calculateScore(newCompleted, newIgnored);

  await prisma.userPreference.upsert({
    where: { userId_category: { userId, category } },
    create: {
      userId,
      category,
      timesCompleted: isPositive ? 1 : 0,
      timesIgnored: isNegative ? 1 : 0,
      score: calculateScore(isPositive ? 1 : 0, isNegative ? 1 : 0),
    },
    update: {
      timesCompleted: newCompleted,
      timesIgnored: newIgnored,
      score: newScore,
    },
  });

  return newScore;
}

async function batchLearnFromHistory(userId) {
  const reminders = await prisma.reminder.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const stats = {};
  for (const r of reminders) {
    const cat = r.category;
    if (!stats[cat]) stats[cat] = { completed: 0, ignored: 0 };
    if (r.completedAt) {
      stats[cat].completed++;
    } else if (r.scheduledAt && new Date(r.scheduledAt) < new Date()) {
      stats[cat].ignored++;
    }
  }

  let updated = 0;
  for (const [category, s] of Object.entries(stats)) {
    const score = calculateScore(s.completed, s.ignored);
    await prisma.userPreference.upsert({
      where: { userId_category: { userId, category } },
      create: { userId, category, timesCompleted: s.completed, timesIgnored: s.ignored, score },
      update: { timesCompleted: s.completed, timesIgnored: s.ignored, score },
    });
    updated++;
  }

  return updated;
}

async function getPreferences(userId) {
  return prisma.userPreference.findMany({
    where: { userId },
    orderBy: { score: 'desc' },
  });
}

async function resetPreferences(userId) {
  await prisma.userPreference.deleteMany({ where: { userId } });
  await prisma.recommendationFeedback.deleteMany({ where: { userId } });
}

module.exports = { updatePreference, batchLearnFromHistory, getPreferences, resetPreferences, calculateScore };

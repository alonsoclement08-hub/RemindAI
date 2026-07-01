// Tracks user reminder patterns to improve AI suggestions over time

export const contextAI = {
  _patterns: {},

  recordReminder(reminder) {
    const category = reminder.category || 'personal';
    const priority = reminder.priority || 2;
    const hour = reminder.scheduled_at
      ? new Date(reminder.scheduled_at).getHours()
      : new Date().getHours();

    if (!this._patterns[category]) {
      this._patterns[category] = { count: 0, hours: [], priorities: [] };
    }
    this._patterns[category].count++;
    this._patterns[category].hours.push(hour);
    this._patterns[category].priorities.push(priority);
  },

  getTopCategory() {
    let topCat = 'personal';
    let topCount = 0;
    for (const [cat, data] of Object.entries(this._patterns)) {
      if (data.count > topCount) {
        topCount = data.count;
        topCat = cat;
      }
    }
    return topCat;
  },

  getPreferredHour(category) {
    const data = this._patterns[category];
    if (!data || data.hours.length === 0) return 9;
    return Math.round(data.hours.reduce((a, b) => a + b, 0) / data.hours.length);
  },

  getSuggestContext() {
    return {
      topCategory: this.getTopCategory(),
      patterns: Object.entries(this._patterns).map(([category, data]) => ({
        category,
        count: data.count,
        preferredHour: this.getPreferredHour(category),
        avgPriority: data.priorities.length
          ? Math.round(data.priorities.reduce((a, b) => a + b, 0) / data.priorities.length)
          : 2,
      })),
    };
  },

  reset() {
    this._patterns = {};
  },
};

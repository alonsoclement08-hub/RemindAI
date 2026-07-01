import { contextAI } from '../../src/utils/contextAi';

beforeEach(() => {
  contextAI.reset();
});

describe('contextAI.recordReminder', () => {
  it('increments count for the reminder category', () => {
    contextAI.recordReminder({ category: 'work', priority: 3, scheduled_at: null });
    contextAI.recordReminder({ category: 'work', priority: 2, scheduled_at: null });

    expect(contextAI._patterns.work.count).toBe(2);
  });

  it('stores the hour extracted from scheduled_at', () => {
    const scheduledAt = new Date(2026, 4, 10, 14, 0).toISOString(); // 14:00
    contextAI.recordReminder({ category: 'health', priority: 2, scheduled_at: scheduledAt });

    expect(contextAI._patterns.health.hours).toContain(14);
  });
});

describe('contextAI.getTopCategory', () => {
  it('returns the category with the most reminders', () => {
    contextAI.recordReminder({ category: 'work', priority: 2, scheduled_at: null });
    contextAI.recordReminder({ category: 'work', priority: 2, scheduled_at: null });
    contextAI.recordReminder({ category: 'health', priority: 2, scheduled_at: null });

    expect(contextAI.getTopCategory()).toBe('work');
  });

  it('returns "personal" when no reminders have been recorded', () => {
    expect(contextAI.getTopCategory()).toBe('personal');
  });
});

describe('contextAI.getPreferredHour', () => {
  it('returns the average hour for a category', () => {
    const h8 = new Date(2026, 4, 10, 8, 0).toISOString();
    const h10 = new Date(2026, 4, 10, 10, 0).toISOString();
    contextAI.recordReminder({ category: 'work', priority: 2, scheduled_at: h8 });
    contextAI.recordReminder({ category: 'work', priority: 2, scheduled_at: h10 });

    expect(contextAI.getPreferredHour('work')).toBe(9); // (8+10)/2 = 9
  });
});

describe('contextAI.getSuggestContext', () => {
  it('returns structured context with patterns for all recorded categories', () => {
    const at9 = new Date(2026, 4, 10, 9, 0).toISOString();
    contextAI.recordReminder({ category: 'work', priority: 3, scheduled_at: at9 });
    contextAI.recordReminder({ category: 'health', priority: 2, scheduled_at: at9 });

    const ctx = contextAI.getSuggestContext();

    expect(ctx.topCategory).toBe('work');
    expect(ctx.patterns).toHaveLength(2);
    const workPattern = ctx.patterns.find((p) => p.category === 'work');
    expect(workPattern).toMatchObject({ category: 'work', count: 1, preferredHour: 9, avgPriority: 3 });
  });
});

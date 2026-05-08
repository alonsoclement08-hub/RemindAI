import { parseNLP } from '../../src/utils/nlp';

describe('parseNLP', () => {
  it('detects "demain" and sets next day', () => {
    const result = parseNLP('Appelle Jean demain à 15h');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(result.scheduledAt.getDate()).toBe(tomorrow.getDate());
    expect(result.scheduledAt.getHours()).toBe(15);
  });

  it('extracts hour from "à 9h30"', () => {
    const result = parseNLP('Réunion demain à 9h30');
    expect(result.scheduledAt.getHours()).toBe(9);
    expect(result.scheduledAt.getMinutes()).toBe(30);
  });

  it('detects work category from "appelle"', () => {
    const result = parseNLP('Appelle le client demain');
    expect(result.category).toBe('work');
  });

  it('detects health category from "médecin"', () => {
    const result = parseNLP('Médecin lundi à 10h');
    expect(result.category).toBe('health');
  });

  it('detects errand category from "courses"', () => {
    const result = parseNLP('Faire les courses vendredi');
    expect(result.category).toBe('errand');
  });

  it('detects urgent priority', () => {
    const result = parseNLP('Rappel urgent demain');
    expect(result.priority).toBe(4);
  });

  it('defaults to priority 2', () => {
    const result = parseNLP('Faire quelque chose demain');
    expect(result.priority).toBe(2);
  });

  it('removes "rappelle-moi de" from title', () => {
    const result = parseNLP("Rappelle-moi d'appeler maman demain");
    expect(result.title.toLowerCase()).not.toContain('rappelle');
  });

  it('capitalizes first letter of title', () => {
    const result = parseNLP('appeler jean demain');
    expect(result.title[0]).toBe(result.title[0].toUpperCase());
  });

  it('returns raw text', () => {
    const text = 'Test reminder';
    const result = parseNLP(text);
    expect(result.raw).toBe(text);
  });
});

describe('parseNLP — time formats', () => {
  it('"appelé maman à 12h30" → 12:30', () => {
    const r = parseNLP('appelé maman à 12h30');
    expect(r.scheduledAt.getHours()).toBe(12);
    expect(r.scheduledAt.getMinutes()).toBe(30);
  });

  it('"réunion à 14:00" (colon FR format) → 14:00', () => {
    const r = parseNLP('réunion à 14:00');
    expect(r.scheduledAt.getHours()).toBe(14);
    expect(r.scheduledAt.getMinutes()).toBe(0);
  });

  it('"call at 3pm" → 15:00', () => {
    const r = parseNLP('call at 3pm');
    expect(r.scheduledAt.getHours()).toBe(15);
    expect(r.scheduledAt.getMinutes()).toBe(0);
  });

  it('"meeting at 10:30am" → 10:30', () => {
    const r = parseNLP('meeting at 10:30am');
    expect(r.scheduledAt.getHours()).toBe(10);
    expect(r.scheduledAt.getMinutes()).toBe(30);
  });

  it('"médecin à 8h" → 08:00', () => {
    const r = parseNLP('médecin à 8h');
    expect(r.scheduledAt.getHours()).toBe(8);
    expect(r.scheduledAt.getMinutes()).toBe(0);
  });

  it('"ce soir à 22h" → 22:00 (explicit time beats evening default)', () => {
    const r = parseNLP('ce soir à 22h');
    expect(r.scheduledAt.getHours()).toBe(22);
  });
});

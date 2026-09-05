import { dateFromKey, dateKey, dateLabel } from '../src/lib/date';

describe('date utilities', () => {
  it('formats selected dates for Spanish calendar triggers', () => {
    expect(dateLabel('2026-09-08')).toBe('Tuesday 08, Sep.');
  });

  it('round-trips local date keys without UTC conversion', () => {
    const date = dateFromKey('2026-09-08');

    expect(date).toBeDefined();
    if (!date) throw new Error('Expected a valid date');
    expect(dateKey(date)).toBe('2026-09-08');
  });
});

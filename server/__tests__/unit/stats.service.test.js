/* eslint-env jest */

const { createStatsService } = require('../../services/stats.service');

function createService(overrides = {}) {
  return {
    id: 1,
    name: 'Service',
    type: 'internet',
    amount: 60,
    paymentDate: null,
    dueDate: '2026-09-10',
    paid: false,
    ...overrides
  };
}

describe('statistics service', () => {
  const clock = () => new Date(2026, 8, 4, 12);

  test('derives monthly periods, excludes null amounts, and zero-fills the series', () => {
    const repository = {
      findAll: jest.fn(() => [
        createService({ dueDate: '2026-08-10', amount: 60, paid: true }),
        createService({ id: 2, dueDate: '2026-07-10', amount: null }),
        createService({ id: 3, dueDate: '2026-09-10', amount: 0 }),
        createService({ id: 4, dueDate: '2026-03-10', amount: 999 })
      ])
    };
    const stats = createStatsService(repository, clock);

    expect(stats.getByType('internet', 3)).toEqual({
      type: 'internet',
      periods: [
        { period: '2026-06', amount: 0 },
        { period: '2026-07', amount: 60 },
        { period: '2026-08', amount: 0 }
      ],
      average: 20
    });
    expect(repository.findAll).toHaveBeenCalledWith({ type: 'internet' });
  });

  test('aggregates full bimonthly amounts into their derived periods and includes zeros in average', () => {
    const repository = {
      findAll: jest.fn(() => [
        createService({ type: 'electricity', dueDate: '2026-09-10', amount: 450 }),
        createService({ id: 2, type: 'electricity', dueDate: '2026-07-10', amount: 300 }),
        createService({ id: 3, type: 'electricity', dueDate: '2026-05-10', amount: 99 })
      ])
    };
    const stats = createStatsService(repository, clock);

    expect(stats.getByType('electricity', 3)).toEqual({
      type: 'electricity',
      periods: [
        { period: '2026-03..2026-04', amount: 99 },
        { period: '2026-05..2026-06', amount: 300 },
        { period: '2026-07..2026-08', amount: 450 }
      ],
      average: 283
    });
  });
});

const BIMONTHLY_TYPES = new Set(['electricity', 'gas']);
const { localToday } = require('../utils/dates');

function shiftMonth(month, offset) {
  const [year, monthNumber] = month.split('-').map(Number);
  const date = new Date(year, monthNumber - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function periodForDueDate(type, dueDate) {
  const periodEnd = shiftMonth(dueDate.slice(0, 7), -1);
  if (!BIMONTHLY_TYPES.has(type)) {
    return periodEnd;
  }

  return `${shiftMonth(periodEnd, -1)}..${periodEnd}`;
}

function seriesFor(type, count, today) {
  const anchorEnd = shiftMonth(today.slice(0, 7), -1);
  return Array.from({ length: count }, (_, index) => {
    const offset = count - 1 - index;
    const periodEnd = shiftMonth(anchorEnd, BIMONTHLY_TYPES.has(type) ? -2 * offset : -offset);
    const period = BIMONTHLY_TYPES.has(type)
      ? `${shiftMonth(periodEnd, -1)}..${periodEnd}`
      : periodEnd;
    return { period, amount: 0 };
  });
}

function createStatsService(repository, clock = () => new Date()) {
  function getByType(type, periods = 6) {
    const series = seriesFor(type, periods, localToday(clock()));
    const totals = new Map(series.map(({ period }) => [period, 0]));

    for (const service of repository.findAll({ type })) {
      if (service.amount === null) {
        continue;
      }

      const period = periodForDueDate(type, service.dueDate);
      if (totals.has(period)) {
        totals.set(period, totals.get(period) + service.amount);
      }
    }

    const result = series.map(({ period }) => ({ period, amount: totals.get(period) }));
    const average = result.reduce((total, { amount }) => total + amount, 0) / periods;
    return { type, periods: result, average };
  }

  return { getByType };
}

module.exports = { createStatsService, periodForDueDate, seriesFor };

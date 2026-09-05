const { isValidDate, isValidMonth } = require('./dates');
const { SERVICE_TYPES } = require('./validation');
const { ValidationError } = require('../services/errors');

const FILTER_FIELDS = new Set(['month', 'from', 'to', 'type', 'paid']);

function singleValue(query, key) {
  const value = query[key];
  if (Array.isArray(value)) {
    throw new ValidationError(`${key} must be supplied once`);
  }
  return value;
}

function parseFilters(query) {
  for (const key of Object.keys(query)) {
    if (!FILTER_FIELDS.has(key)) {
      throw new ValidationError(`${key} is not a supported filter`);
    }
  }

  const month = singleValue(query, 'month');
  const from = singleValue(query, 'from');
  const to = singleValue(query, 'to');
  const type = singleValue(query, 'type');
  const paid = singleValue(query, 'paid');

  if (month && (from || to)) {
    throw new ValidationError('month cannot be combined with from or to');
  }
  if ((from && !to) || (!from && to)) {
    throw new ValidationError('from and to must be supplied together');
  }
  if (month && !isValidMonth(month)) {
    throw new ValidationError('month must be a valid YYYY-MM');
  }
  if (from && (!isValidDate(from) || !isValidDate(to))) {
    throw new ValidationError('from and to must be valid YYYY-MM-DD dates');
  }
  if (from && from > to) {
    throw new ValidationError('from must be before or equal to to');
  }
  if (type && !SERVICE_TYPES.includes(type)) {
    throw new ValidationError('type must be a supported service type');
  }
  if (paid !== undefined && paid !== 'true' && paid !== 'false') {
    throw new ValidationError('paid must be true or false');
  }

  return {
    ...(month ? { month } : {}),
    ...(from ? { from, to } : {}),
    ...(type ? { type } : {}),
    ...(paid !== undefined ? { paid: paid === 'true' } : {})
  };
}

module.exports = { parseFilters };

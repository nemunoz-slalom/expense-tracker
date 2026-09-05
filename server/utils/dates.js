const { ValidationError } = require('../services/errors');

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_PATTERN = /^\d{4}-\d{2}$/;

function isValidDate(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function isValidMonth(value) {
  return typeof value === 'string'
    && MONTH_PATTERN.test(value)
    && isValidDate(`${value}-01`);
}

function localToday(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseIdentifier(value) {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
    throw new ValidationError('id must be a positive integer');
  }

  const id = Number(value);
  if (!Number.isSafeInteger(id)) {
    throw new ValidationError('id must be a positive integer');
  }

  return id;
}

module.exports = { isValidDate, isValidMonth, localToday, parseIdentifier };

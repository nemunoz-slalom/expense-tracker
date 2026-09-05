/* eslint-env jest */

const { ValidationError } = require('../../services/errors');
const { isValidDate, isValidMonth, localToday, parseIdentifier } = require('../../utils/dates');
const { parseFilters } = require('../../utils/filters');
const { getStatus, sortServices } = require('../../utils/sorting');
const { validateCreate, validateService, validateUpdate } = require('../../utils/validation');

describe('date utilities', () => {
  test('accepts real dates and rejects impossible calendar dates', () => {
    expect(isValidDate('2024-02-29')).toBe(true);
    expect(isValidDate('2025-02-29')).toBe(false);
    expect(isValidDate('2026-13-01')).toBe(false);
    expect(isValidMonth('2026-09')).toBe(true);
    expect(isValidMonth('2026-00')).toBe(false);
  });

  test('formats a supplied date in server-local calendar form', () => {
    expect(localToday(new Date(2026, 8, 4, 23, 59))).toBe('2026-09-04');
  });

  test('only accepts safe positive integer identifiers', () => {
    expect(parseIdentifier('42')).toBe(42);
    expect(() => parseIdentifier('0')).toThrow(ValidationError);
    expect(() => parseIdentifier('1.5')).toThrow(ValidationError);
  });
});

describe('service validation', () => {
  const validService = {
    name: 'CFE',
    type: 'electricity',
    amount: 450,
    paymentDate: null,
    dueDate: '2026-09-20',
    paid: false
  };

  test('normalizes a create request to a complete unpaid Service', () => {
    expect(validateCreate({
      name: ' CFE ',
      type: 'electricity',
      amount: 450,
      paymentDate: null,
      dueDate: '2026-09-20'
    })).toEqual(validService);
  });

  test('rejects invalid complete Service states', () => {
    expect(() => validateService({ ...validService, name: '   ' })).toThrow('name must not be blank');
    expect(() => validateService({ ...validService, amount: -1 })).toThrow('amount must be');
    expect(() => validateService({ ...validService, paymentDate: '2026-09-21' })).toThrow('dueDate must be');
  });

  test('allows only supplied contract fields in a non-empty PATCH', () => {
    expect(validateUpdate({ amount: 0 })).toEqual({ amount: 0 });
    expect(() => validateUpdate({})).toThrow('At least one field');
    expect(() => validateUpdate({ status: 'paid' })).toThrow('status is not allowed');
  });
});

describe('filters', () => {
  test('converts contract query values to a typed filter', () => {
    expect(parseFilters({ month: '2026-09', type: 'water', paid: 'false' })).toEqual({
      month: '2026-09',
      type: 'water',
      paid: false
    });
  });

  test('rejects mixed, incomplete, malformed, and unsupported filters', () => {
    expect(() => parseFilters({ month: '2026-09', from: '2026-09-01', to: '2026-09-30' })).toThrow(ValidationError);
    expect(() => parseFilters({ from: '2026-09-01' })).toThrow(ValidationError);
    expect(() => parseFilters({ paid: 'yes' })).toThrow(ValidationError);
    expect(() => parseFilters({ status: 'paid' })).toThrow(ValidationError);
  });
});

describe('status and ordering', () => {
  const services = [
    { id: 4, paid: true, dueDate: '2026-09-01' },
    { id: 3, paid: false, dueDate: '2026-09-20' },
    { id: 2, paid: false, dueDate: '2026-09-04' },
    { id: 1, paid: false, dueDate: '2026-09-03' },
    { id: 5, paid: false, dueDate: '2026-09-03' }
  ];

  test('derives status with paid precedence and seven-day urgency boundary', () => {
    expect(getStatus(services[0], '2026-09-04')).toBe('paid');
    expect(getStatus(services[1], '2026-09-04')).toBe('normal');
    expect(getStatus({ paid: false, dueDate: '2026-09-11' }, '2026-09-04')).toBe('urgent');
    expect(getStatus(services[3], '2026-09-04')).toBe('overdue');
  });

  test('sorts by urgency, due date, then identifier without mutating input', () => {
    expect(sortServices(services, '2026-09-04').map(({ id }) => id)).toEqual([1, 5, 2, 3, 4]);
    expect(services[0].id).toBe(4);
  });
});

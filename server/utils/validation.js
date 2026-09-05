const { isValidDate } = require('./dates');
const { ValidationError } = require('../services/errors');

const SERVICE_TYPES = ['electricity', 'gas', 'internet', 'mobile', 'water'];
const CREATE_FIELDS = new Set(['name', 'type', 'amount', 'paymentDate', 'dueDate']);
const UPDATE_FIELDS = new Set([...CREATE_FIELDS, 'paid']);

function assertObject(value, message) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ValidationError(message);
  }
}

function assertAllowedFields(value, allowedFields) {
  for (const key of Object.keys(value)) {
    if (!allowedFields.has(key)) {
      throw new ValidationError(`${key} is not allowed`);
    }
  }
}

function validateService(value) {
  assertObject(value, 'Service must be an object');

  if (typeof value.name !== 'string' || !value.name.trim()) {
    throw new ValidationError('name must not be blank');
  }
  if (!SERVICE_TYPES.includes(value.type)) {
    throw new ValidationError('type must be a supported service type');
  }
  if (value.amount !== null && value.amount !== undefined
    && (typeof value.amount !== 'number' || !Number.isFinite(value.amount) || value.amount < 0)) {
    throw new ValidationError('amount must be a non-negative finite number');
  }
  if (!isValidDate(value.dueDate)) {
    throw new ValidationError('dueDate must be a valid YYYY-MM-DD date');
  }
  if (value.paymentDate !== null && value.paymentDate !== undefined && !isValidDate(value.paymentDate)) {
    throw new ValidationError('paymentDate must be a valid YYYY-MM-DD date');
  }
  if (value.paymentDate && value.paymentDate > value.dueDate) {
    throw new ValidationError('dueDate must be >= paymentDate');
  }
  if (typeof value.paid !== 'boolean') {
    throw new ValidationError('paid must be a boolean');
  }

  return {
    ...value,
    name: value.name.trim(),
    amount: value.amount ?? null,
    paymentDate: value.paymentDate ?? null
  };
}

function validateCreate(value) {
  assertObject(value, 'Request body must be an object');
  assertAllowedFields(value, CREATE_FIELDS);
  return validateService({ ...value, paid: false });
}

function validateUpdate(value) {
  assertObject(value, 'Request body must be an object');
  assertAllowedFields(value, UPDATE_FIELDS);
  if (Object.keys(value).length === 0) {
    throw new ValidationError('At least one field must be provided');
  }
  return value;
}

module.exports = { SERVICE_TYPES, validateCreate, validateService, validateUpdate };

class DomainError extends Error {
  constructor(message, statusCode, error = 'DomainError') {
    super(message);
    this.name = error;
    this.error = error;
    this.statusCode = statusCode;
  }
}

class ValidationError extends DomainError {
  constructor(message) {
    super(message, 400, 'ValidationError');
  }
}

class NotFoundError extends DomainError {
  constructor(message = 'Service not found') {
    super(message, 404, 'NotFoundError');
  }
}

class ConflictError extends DomainError {
  constructor(message) {
    super(message, 409, 'ConflictError');
  }
}

function isDomainError(error) {
  return error instanceof DomainError;
}

module.exports = {
  ConflictError,
  DomainError,
  NotFoundError,
  ValidationError,
  isDomainError
};

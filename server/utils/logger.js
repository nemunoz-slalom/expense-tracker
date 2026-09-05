const SENSITIVE_KEY = /token|secret|password|authorization|chat.?id|amount|name|payment.?date|due.?date/i;

function redact(value, key = '') {
  if (SENSITIVE_KEY.test(key)) {
    return '[REDACTED]';
  }

  if (Array.isArray(value)) {
    return value.map((item) => redact(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        redact(entryValue, entryKey)
      ])
    );
  }

  return value;
}

function createLogger(write = console.log) {
  function log(event, details = {}) {
    write(JSON.stringify({
      timestamp: new Date().toISOString(),
      event,
      ...redact(details)
    }));
  }

  return { log };
}

module.exports = { createLogger, redact };

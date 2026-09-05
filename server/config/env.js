const path = require('path');

function parsePort(value) {
  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  return port;
}

function parseOrigin(value) {
  try {
    return new URL(value).origin;
  } catch {
    throw new Error('CLIENT_ORIGIN must be a valid URL');
  }
}

function loadConfig(environment = process.env, logger) {
  const { PORT, DATABASE_PATH, CLIENT_ORIGIN, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = environment;

  if (!DATABASE_PATH || !DATABASE_PATH.trim()) {
    throw new Error('DATABASE_PATH is required');
  }

  if (!CLIENT_ORIGIN || !CLIENT_ORIGIN.trim()) {
    throw new Error('CLIENT_ORIGIN is required');
  }

  const hasTelegramToken = Boolean(TELEGRAM_BOT_TOKEN);
  const hasTelegramChatId = Boolean(TELEGRAM_CHAT_ID);

  if (hasTelegramToken !== hasTelegramChatId && logger) {
    logger.log('telegram.configuration.incomplete');
  }

  return {
    port: parsePort(PORT || '5001'),
    databasePath: path.resolve(DATABASE_PATH),
    clientOrigin: parseOrigin(CLIENT_ORIGIN),
    telegram: hasTelegramToken && hasTelegramChatId
      ? { botToken: TELEGRAM_BOT_TOKEN, chatId: TELEGRAM_CHAT_ID }
      : null
  };
}

module.exports = { loadConfig };

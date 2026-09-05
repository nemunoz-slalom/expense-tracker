function createTelegramClient(telegram, logger, fetchImpl = globalThis.fetch) {
  async function sendMessage(message) {
    if (!telegram) {
      logger.log('telegram.delivery.skipped', { reason: 'configuration-unavailable' });
      return false;
    }

    try {
      const response = await fetchImpl(`https://api.telegram.org/bot${telegram.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: telegram.chatId, text: message })
      });

      if (!response.ok) {
        logger.log('telegram.delivery.failed', { statusCode: response.status });
        return false;
      }

      logger.log('telegram.delivery.succeeded');
      return true;
    } catch (error) {
      logger.log('telegram.delivery.failed', {
        error: error instanceof Error ? error.name : 'UnknownError'
      });
      return false;
    }
  }

  return { sendMessage };
}

module.exports = { createTelegramClient };

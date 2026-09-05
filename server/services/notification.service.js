function formatType(type) {
  return `${type.charAt(0).toUpperCase()}${type.slice(1)}`;
}

function formatAmount(amount) {
  return amount === null ? '' : ` $${amount.toFixed(2)}`;
}

function formatPaymentDate(paymentDate) {
  const [year, month, day] = paymentDate.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    timeZone: 'UTC'
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function formatCreationMessage(service) {
  return `${service.name} (${formatType(service.type)})${formatAmount(service.amount)} created`;
}

function formatPaidMessage(service) {
  return `${service.name} (${formatType(service.type)})${formatAmount(service.amount)} paid on ${formatPaymentDate(service.paymentDate)}`;
}

function createNotificationService(telegramClient, logger = { log: () => {} }) {
  async function send(message) {
    try {
      return await telegramClient.sendMessage(message);
    } catch (error) {
      logger.log('notification.delivery.failed', {
        error: error instanceof Error ? error.name : 'UnknownError'
      });
      return false;
    }
  }

  function sendCreation(service) {
    return send(formatCreationMessage(service));
  }

  function sendPaid(service) {
    return send(formatPaidMessage(service));
  }

  return { sendCreation, sendPaid };
}

module.exports = {
  createNotificationService,
  formatCreationMessage,
  formatPaidMessage
};

/* eslint-env jest */

const {
  createNotificationService,
  formatCreationMessage,
  formatPaidMessage
} = require('../../services/notification.service');
const { createTelegramClient } = require('../../external/telegram.client');
const { createServiceService } = require('../../services/service.service');

const service = {
  id: 1,
  name: 'CFE',
  type: 'electricity',
  amount: 450,
  paymentDate: '2026-09-04',
  dueDate: '2026-09-10',
  paid: true
};

function createRepository() {
  const services = new Map();
  let nextId = 1;

  return {
    create: jest.fn((input) => {
      const created = {
        ...input,
        id: nextId++,
        createdAt: '2026-09-04T12:00:00.000Z',
        updatedAt: '2026-09-04T12:00:00.000Z'
      };
      services.set(created.id, created);
      return created;
    }),
    findById: jest.fn((id) => services.get(id) || null),
    update: jest.fn((id, input) => {
      const updated = {
        ...input,
        id,
        createdAt: services.get(id).createdAt,
        updatedAt: '2026-09-04T13:00:00.000Z'
      };
      services.set(id, updated);
      return updated;
    })
  };
}

describe('notification service', () => {
  test('formats creation and paid messages with optional amounts', () => {
    expect(formatCreationMessage(service)).toBe('CFE (Electricity) $450.00 created');
    expect(formatCreationMessage({ ...service, amount: null })).toBe('CFE (Electricity) created');
    expect(formatPaidMessage(service)).toBe('CFE (Electricity) $450.00 paid on Sep 04');
    expect(formatPaidMessage({ ...service, amount: null })).toBe('CFE (Electricity) paid on Sep 04');
  });

  test('sends formatted creation and paid messages through the Telegram boundary', async () => {
    const telegramClient = { sendMessage: jest.fn().mockResolvedValue(true) };
    const notifications = createNotificationService(telegramClient);

    await notifications.sendCreation(service);
    await notifications.sendPaid(service);

    expect(telegramClient.sendMessage).toHaveBeenNthCalledWith(1, 'CFE (Electricity) $450.00 created');
    expect(telegramClient.sendMessage).toHaveBeenNthCalledWith(2, 'CFE (Electricity) $450.00 paid on Sep 04');
  });

  test('skips unavailable Telegram configuration and redacts delivery failures', async () => {
    const logger = { log: jest.fn() };
    const unavailableClient = createTelegramClient(null, logger);
    const failedClient = createTelegramClient(
      { botToken: 'telegram-token', chatId: 'telegram-chat-id' },
      logger,
      jest.fn().mockRejectedValue(new Error('telegram-token must not be logged'))
    );

    await expect(unavailableClient.sendMessage('message')).resolves.toBe(false);
    await expect(failedClient.sendMessage('message')).resolves.toBe(false);

    expect(logger.log).toHaveBeenNthCalledWith(
      1,
      'telegram.delivery.skipped',
      { reason: 'configuration-unavailable' }
    );
    expect(logger.log).toHaveBeenNthCalledWith(
      2,
      'telegram.delivery.failed',
      { error: 'Error' }
    );
    expect(JSON.stringify(logger.log.mock.calls)).not.toContain('telegram-token');
    expect(JSON.stringify(logger.log.mock.calls)).not.toContain('telegram-chat-id');
  });

  test('only requests a paid notification for a false-to-true transition', async () => {
    const repository = createRepository();
    const notifications = { sendPaid: jest.fn().mockResolvedValue() };
    const services = createServiceService(
      repository,
      () => new Date(2026, 8, 4, 12),
      notifications
    );
    const created = services.create({
      name: 'CFE',
      type: 'electricity',
      dueDate: '2026-09-10'
    });

    services.update(created.id, { paid: true });
    await Promise.resolve();
    services.update(created.id, { paid: true });
    await Promise.resolve();

    expect(notifications.sendPaid).toHaveBeenCalledTimes(1);
    expect(notifications.sendPaid).toHaveBeenCalledWith(
      expect.objectContaining({ id: created.id, paid: true, paymentDate: '2026-09-04' })
    );
  });
});

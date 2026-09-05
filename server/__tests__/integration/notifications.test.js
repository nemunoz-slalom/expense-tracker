/* eslint-env jest */

const request = require('supertest');

const { createApp } = require('../../app');
const { createServiceRepository } = require('../../repositories/service.repository');
const { createTelegramClient } = require('../../external/telegram.client');
const { createServiceService } = require('../../services/service.service');
const { createNotificationService } = require('../../services/notification.service');
const { createServiceFixture, createTelegramStub, createTestDatabase } = require('../helpers/test-support');

function createRequest(overrides = {}) {
  const service = { ...createServiceFixture(overrides) };
  delete service.paid;
  return service;
}

describe('Notification HTTP integration', () => {
  let databaseContext;
  let telegramClient;
  let app;

  beforeEach(() => {
    databaseContext = createTestDatabase();
    telegramClient = createTelegramStub();
    const repository = createServiceRepository(databaseContext.database);
    const notificationService = createNotificationService(telegramClient);
    const serviceService = createServiceService(
      repository,
      () => new Date(2026, 8, 4, 12),
      notificationService
    );
    app = createApp({ serviceService, logger: { log: jest.fn() } });
  });

  afterEach(() => {
    databaseContext.cleanup();
  });

  test('sends creation notification only through the application notify endpoint', async () => {
    const created = await request(app)
      .post('/api/services')
      .send(createRequest({ paymentDate: '2026-09-01', dueDate: '2026-09-10' }))
      .expect(201);

    expect(telegramClient.messages).toEqual([]);

    await request(app).post(`/api/services/${created.body.data.id}/notify`).expect(204);

    expect(telegramClient.messages).toEqual(['Electricity bill (Electricity) $450.00 created']);
  });

  test('returns not found when the notify target does not exist', async () => {
    await request(app)
      .post('/api/services/999/notify')
      .expect(404)
      .expect({ error: 'NotFoundError', message: 'Service not found' });
  });

  test('keeps notify successful without Telegram credentials', async () => {
    const created = await request(app).post('/api/services').send(createRequest()).expect(201);
    const unavailableApp = createApp({
      serviceService: createServiceService(
        createServiceRepository(databaseContext.database),
        () => new Date(2026, 8, 4, 12),
        createNotificationService({ sendMessage: jest.fn().mockResolvedValue(false) })
      ),
      logger: { log: jest.fn() }
    });

    await request(unavailableApp).post(`/api/services/${created.body.data.id}/notify`).expect(204);
  });

  test('keeps notification requests and paid transitions successful when delivery fails', async () => {
    const logger = { log: jest.fn() };
    const failedTelegramClient = createTelegramClient(
      { botToken: 'telegram-token', chatId: 'telegram-chat-id' },
      logger,
      jest.fn().mockRejectedValue(new Error('telegram-token must not be logged'))
    );
    const failingApp = createApp({
      serviceService: createServiceService(
        createServiceRepository(databaseContext.database),
        () => new Date(2026, 8, 4, 12),
        createNotificationService(failedTelegramClient, logger)
      ),
      logger
    });
    const created = await request(failingApp).post('/api/services').send(createRequest()).expect(201);

    await request(failingApp).post(`/api/services/${created.body.data.id}/notify`).expect(204);
    await request(failingApp).patch(`/api/services/${created.body.data.id}`).send({ paid: true }).expect(200);
    await new Promise(setImmediate);

    await request(failingApp)
      .get(`/api/services/${created.body.data.id}`)
      .expect(200)
      .expect(({ body }) => expect(body.data).toMatchObject({ paid: true, paymentDate: '2026-09-04' }));
    expect(JSON.stringify(logger.log.mock.calls)).not.toContain('telegram-token');
    expect(JSON.stringify(logger.log.mock.calls)).not.toContain('telegram-chat-id');
  });

  test('does not duplicate payment notifications for repeated paid updates', async () => {
    const created = await request(app).post('/api/services').send(createRequest()).expect(201);

    await request(app).patch(`/api/services/${created.body.data.id}`).send({ paid: true }).expect(200);
    await new Promise(setImmediate);
    await request(app).patch(`/api/services/${created.body.data.id}`).send({ paid: true }).expect(200);
    await new Promise(setImmediate);

    expect(telegramClient.messages).toEqual(['Electricity bill (Electricity) $450.00 paid on Sep 04']);
  });
});

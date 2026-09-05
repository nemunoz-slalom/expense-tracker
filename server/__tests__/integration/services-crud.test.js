/* eslint-env jest */

const request = require('supertest');

const { createApp } = require('../../app');
const { createServiceRepository } = require('../../repositories/service.repository');
const { createServiceService } = require('../../services/service.service');
const { createServiceFixture, createTestDatabase } = require('../helpers/test-support');

function createRequest(overrides = {}) {
  const request = { ...createServiceFixture(overrides) };
  delete request.paid;
  return request;
}

describe('Service CRUD HTTP integration', () => {
  let databaseContext;
  let app;

  beforeEach(() => {
    databaseContext = createTestDatabase();
    const repository = createServiceRepository(databaseContext.database);
    const serviceService = createServiceService(
      repository,
      () => new Date(2026, 8, 4, 12)
    );
    app = createApp({
      serviceService,
      logger: { log: jest.fn() }
    });
  });

  afterEach(() => {
    databaseContext.cleanup();
  });

  test('creates, retrieves, updates, marks paid, and deletes a durable Service', async () => {
    const creation = await request(app)
      .post('/api/services')
      .send(createRequest({ dueDate: '2026-09-10' }))
      .expect(201);

    expect(creation.body.data).toMatchObject({
      id: expect.any(Number),
      paid: false,
      status: 'urgent'
    });
    expect(creation.body.data.createdAt).toMatch(/Z$/);

    const id = creation.body.data.id;
    await request(app)
      .get(`/api/services/${id}`)
      .expect(200)
      .expect(({ body }) => expect(body.data.name).toBe('Electricity bill'));

    const update = await request(app)
      .patch(`/api/services/${id}`)
      .send({ amount: 500, paid: true, paymentDate: '2026-01-01' })
      .expect(200);
    expect(update.body.data).toMatchObject({
      amount: 500,
      paid: true,
      paymentDate: '2026-09-04',
      status: 'paid'
    });

    await request(app).delete(`/api/services/${id}`).expect(204);
    await request(app)
      .get(`/api/services/${id}`)
      .expect(404)
      .expect({ error: 'NotFoundError', message: 'Service not found' });
  });

  test('rejects invalid input without persisting partial state', async () => {
    await request(app)
      .post('/api/services')
      .send(createRequest({ dueDate: '2026-02-31' }))
      .expect(400)
      .expect({ error: 'ValidationError', message: 'dueDate must be a valid YYYY-MM-DD date' });

    const repository = createServiceRepository(databaseContext.database);
    expect(repository.findAll()).toHaveLength(0);
  });

  test('rejects an invalid complete PATCH without changing the stored Service', async () => {
    const created = await request(app)
      .post('/api/services')
      .send(createRequest({ dueDate: '2026-09-10' }));

    await request(app)
      .patch(`/api/services/${created.body.data.id}`)
      .send({ paymentDate: '2026-09-11' })
      .expect(400);

    const stored = await request(app).get(`/api/services/${created.body.data.id}`).expect(200);
    expect(stored.body.data.paymentDate).toBeNull();
  });

  test('persists data after closing and reopening the SQLite connection', () => {
    const repository = createServiceRepository(databaseContext.database);
    const created = repository.create(createServiceFixture());
    const databasePath = databaseContext.databasePath;
    databaseContext.database.close();

    const { createDatabaseConnection } = require('../../db/connection');
    const reopenedDatabase = createDatabaseConnection({
      databasePath,
      environment: { NODE_ENV: 'test' }
    });
    const reopenedRepository = createServiceRepository(reopenedDatabase);

    expect(reopenedRepository.findById(created.id)).toMatchObject({ id: created.id, name: 'Electricity bill' });
    reopenedDatabase.close();
  });

  test('returns client-safe errors for malformed IDs and unexpected failures', async () => {
    await request(app)
      .get('/api/services/not-an-id')
      .expect(400)
      .expect({ error: 'ValidationError', message: 'id must be a positive integer' });

    const brokenApp = createApp({
      serviceService: { getById: () => { throw new Error('/private/secret.db'); } },
      logger: { log: jest.fn() }
    });
    await request(brokenApp)
      .get('/api/services/1')
      .expect(500)
      .expect({ error: 'InternalServerError', message: 'An unexpected error occurred' });
  });
});

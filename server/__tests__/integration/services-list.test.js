/* eslint-env jest */

const request = require('supertest');

const { createApp } = require('../../app');
const { createServiceRepository } = require('../../repositories/service.repository');
const { createServiceService } = require('../../services/service.service');
const { createServiceFixture, createTestDatabase } = require('../helpers/test-support');

function createRequest(overrides = {}) {
  const service = { ...createServiceFixture(overrides) };
  delete service.paid;
  return service;
}

describe('Service list HTTP integration', () => {
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
      logger: { log: jest.fn() },
      clientOrigin: 'http://localhost:3000'
    });
  });

  afterEach(() => {
    databaseContext.cleanup();
  });

  test('allows requests from the configured client origin', async () => {
    const response = await request(app)
      .get('/api/services')
      .set('Origin', 'http://localhost:3000');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  async function createServices() {
    const services = [
      { name: 'August water', type: 'water', dueDate: '2026-08-31' },
      { name: 'September lower boundary', type: 'water', dueDate: '2026-09-01' },
      { name: 'September urgent first created', type: 'water', dueDate: '2026-09-10' },
      { name: 'September urgent second created', type: 'water', dueDate: '2026-09-10' },
      { name: 'September normal internet', type: 'internet', dueDate: '2026-09-30' },
      { name: 'October water', type: 'water', dueDate: '2026-10-01' }
    ];

    for (const service of services) {
      await request(app).post('/api/services').send(createRequest(service)).expect(201);
    }

    const paid = await request(app)
      .post('/api/services')
      .send(createRequest({ name: 'September paid water', type: 'water', dueDate: '2026-09-10' }))
      .expect(201);

    await request(app)
      .patch(`/api/services/${paid.body.data.id}`)
      .send({ paid: true })
      .expect(200);
  }

  test('filters by month and applies deterministic urgency ordering', async () => {
    await createServices();

    const response = await request(app).get('/api/services?month=2026-09').expect(200);

    expect(response.body.data.map(({ name, status }) => ({ name, status }))).toEqual([
      { name: 'September lower boundary', status: 'overdue' },
      { name: 'September urgent first created', status: 'urgent' },
      { name: 'September urgent second created', status: 'urgent' },
      { name: 'September normal internet', status: 'normal' },
      { name: 'September paid water', status: 'paid' }
    ]);
  });

  test('uses inclusive ranges and combines date, type, and paid filters with AND', async () => {
    await createServices();

    const range = await request(app)
      .get('/api/services?from=2026-09-01&to=2026-09-30&type=water&paid=false')
      .expect(200);

    expect(range.body.data.map(({ name }) => name)).toEqual([
      'September lower boundary',
      'September urgent first created',
      'September urgent second created'
    ]);

    const paid = await request(app)
      .get('/api/services?from=2026-09-01&to=2026-09-30&type=water&paid=true')
      .expect(200);

    expect(paid.body.data.map(({ name }) => name)).toEqual(['September paid water']);
  });

  test('rejects malformed and ambiguous list queries', async () => {
    const cases = [
      ['?month=2026-13', 'month must be a valid YYYY-MM'],
      ['?from=2026-09-01', 'from and to must be supplied together'],
      ['?from=2026-09-01&to=2026-09-30&month=2026-09', 'month cannot be combined with from or to'],
      ['?paid=yes', 'paid must be true or false'],
      ['?type=trash', 'type must be a supported service type']
    ];

    for (const [query, message] of cases) {
      await request(app)
        .get(`/api/services${query}`)
        .expect(400)
        .expect({ error: 'ValidationError', message });
    }
  });
});

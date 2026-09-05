/* eslint-env jest */

const request = require('supertest');

const { createApp } = require('../../app');
const { createServiceRepository } = require('../../repositories/service.repository');
const { createServiceService } = require('../../services/service.service');
const { createStatsService } = require('../../services/stats.service');
const { createPdfService } = require('../../services/pdf.service');
const { createServiceFixture, createTestDatabase } = require('../helpers/test-support');

function createRequest(overrides = {}) {
  const service = { ...createServiceFixture(overrides) };
  delete service.paid;
  return service;
}

describe('Statistics and PDF HTTP integration', () => {
  let databaseContext;
  let app;

  beforeEach(() => {
    databaseContext = createTestDatabase();
    const repository = createServiceRepository(databaseContext.database);
    const clock = () => new Date(2026, 8, 4, 12);
    const serviceService = createServiceService(repository, clock);
    app = createApp({
      serviceService,
      statsService: createStatsService(repository, clock),
      pdfService: createPdfService(serviceService),
      logger: { log: jest.fn() }
    });
  });

  afterEach(() => {
    databaseContext.cleanup();
  });

  test('returns contract-shaped, zero-filled statistics and validates the query', async () => {
    await request(app)
      .post('/api/services')
      .send(createRequest({ type: 'internet', amount: 60, dueDate: '2026-08-10' }))
      .expect(201);

    await request(app)
      .get('/api/services/stats/type/internet?periods=3')
      .expect(200)
      .expect({
        data: {
          type: 'internet',
          periods: [
            { period: '2026-06', amount: 0 },
            { period: '2026-07', amount: 60 },
            { period: '2026-08', amount: 0 }
          ],
          average: 20
        }
      });

    await request(app)
      .get('/api/services/stats/type/unknown?periods=3')
      .expect(400)
      .expect({ error: 'ValidationError', message: 'type must be a supported service type' });
    await request(app)
      .get('/api/services/stats/type/internet?periods=13')
      .expect(400)
      .expect({ error: 'ValidationError', message: 'periods must be an integer between 1 and 12' });
  });

  test('returns a filtered binary PDF and a valid empty PDF for valid zero-result filters', async () => {
    await request(app)
      .post('/api/services')
      .send(createRequest({ name: 'September water', type: 'water', amount: 10, dueDate: '2026-09-10' }))
      .expect(201);

    const filtered = await request(app)
      .get('/api/services/export/pdf?month=2026-09&type=water')
      .expect(200)
      .expect('Content-Type', /application\/pdf/);
    expect(filtered.body.toString('latin1')).toContain('September water');

    const empty = await request(app)
      .get('/api/services/export/pdf?month=2026-08&type=water')
      .expect(200)
      .expect('Content-Type', /application\/pdf/);
    expect(empty.body.toString('latin1')).toContain('No services match the selected filters.');

    await request(app)
      .get('/api/services/export/pdf?month=2026-09&from=2026-09-01&to=2026-09-30')
      .expect(400)
      .expect({
        error: 'ValidationError',
        message: 'month cannot be combined with from or to'
      });
  });
});

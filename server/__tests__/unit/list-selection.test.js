/* eslint-env jest */

const request = require('supertest');

const { createApp } = require('../../app');
const { createServiceService } = require('../../services/service.service');

function createRepository(services) {
  return {
    findAll: jest.fn(() => services)
  };
}

function createService(overrides = {}) {
  return {
    id: 1,
    name: 'Service',
    type: 'electricity',
    amount: null,
    paymentDate: null,
    dueDate: '2026-09-10',
    paid: false,
    createdAt: '2026-09-04T12:00:00.000Z',
    updatedAt: '2026-09-04T12:00:00.000Z',
    ...overrides
  };
}

describe('list selection', () => {
  const clock = () => new Date(2026, 8, 4, 12);

  test('groups services by status then due date and id deterministically', () => {
    const repository = createRepository([
      createService({ id: 8, name: 'Paid first by due date', dueDate: '2026-08-01', paid: true }),
      createService({ id: 6, name: 'Normal', dueDate: '2026-09-20' }),
      createService({ id: 2, name: 'Urgent higher id', dueDate: '2026-09-08' }),
      createService({ id: 4, name: 'Overdue later', dueDate: '2026-09-03' }),
      createService({ id: 1, name: 'Urgent lower id', dueDate: '2026-09-08' }),
      createService({ id: 3, name: 'Overdue earlier', dueDate: '2026-09-01' }),
      createService({ id: 7, name: 'Paid second by due date', dueDate: '2026-09-30', paid: true })
    ]);
    const service = createServiceService(repository, clock);

    expect(service.list().map(({ id, status }) => ({ id, status }))).toEqual([
      { id: 3, status: 'overdue' },
      { id: 4, status: 'overdue' },
      { id: 1, status: 'urgent' },
      { id: 2, status: 'urgent' },
      { id: 6, status: 'normal' },
      { id: 8, status: 'paid' },
      { id: 7, status: 'paid' }
    ]);
  });

  test('passes the combined validated filters to the repository', () => {
    const repository = createRepository([]);
    const service = createServiceService(repository, clock);
    const filters = {
      from: '2026-09-01',
      to: '2026-09-30',
      type: 'water',
      paid: false
    };

    expect(service.list(filters)).toEqual([]);
    expect(repository.findAll).toHaveBeenCalledWith(filters);
  });

  test('rejects a mixed month and range filter before listing services', async () => {
    const serviceService = { list: jest.fn() };
    const app = createApp({ serviceService, logger: { log: jest.fn() } });

    await request(app)
      .get('/api/services?month=2026-09&from=2026-09-01&to=2026-09-30')
      .expect(400)
      .expect({
        error: 'ValidationError',
        message: 'month cannot be combined with from or to'
      });

    expect(serviceService.list).not.toHaveBeenCalled();
  });
});

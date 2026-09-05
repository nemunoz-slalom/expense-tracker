/* eslint-env jest */

const { NotFoundError, ValidationError } = require('../../services/errors');
const { createServiceService } = require('../../services/service.service');

function createRepository() {
  const services = new Map();
  let nextId = 1;

  return {
    create: jest.fn((service) => {
      const now = '2026-09-04T12:00:00.000Z';
      const created = { ...service, id: nextId++, createdAt: now, updatedAt: now };
      services.set(created.id, created);
      return created;
    }),
    delete: jest.fn((id) => services.delete(id)),
    findById: jest.fn((id) => services.get(id) || null),
    update: jest.fn((id, service) => {
      const updated = { ...service, id, createdAt: services.get(id).createdAt, updatedAt: '2026-09-04T13:00:00.000Z' };
      services.set(id, updated);
      return updated;
    })
  };
}

describe('Service CRUD business logic', () => {
  const clock = () => new Date(2026, 8, 4, 12);

  test('creates unpaid Services and projects a status', () => {
    const repository = createRepository();
    const service = createServiceService(repository, clock);

    expect(service.create({ name: ' CFE ', type: 'electricity', amount: 450, paymentDate: '2026-09-03', dueDate: '2026-09-10' }))
      .toMatchObject({ id: 1, name: 'CFE', paid: false, status: 'urgent' });
  });

  test('validates the complete merged Service before a PATCH write', () => {
    const repository = createRepository();
    const service = createServiceService(repository, clock);
    const created = service.create({ name: 'CFE', type: 'electricity', dueDate: '2026-09-10' });

    expect(() => service.update(created.id, { paymentDate: '2026-09-11' })).toThrow(ValidationError);
    expect(repository.update).not.toHaveBeenCalled();
  });

  test('sets server-local payment date for a false-to-true paid transition', () => {
    const repository = createRepository();
    const service = createServiceService(repository, clock);
    const created = service.create({ name: 'CFE', type: 'electricity', dueDate: '2026-09-10' });

    expect(service.update(created.id, { paid: true, paymentDate: '2026-01-01' }))
      .toMatchObject({ paid: true, paymentDate: '2026-09-04', status: 'paid' });
  });

  test('gets and deletes a service or reports it missing', () => {
    const repository = createRepository();
    const service = createServiceService(repository, clock);
    const created = service.create({ name: 'CFE', type: 'electricity', dueDate: '2026-09-10' });

    expect(service.getById(created.id).id).toBe(created.id);
    expect(service.remove(created.id)).toBeUndefined();
    expect(() => service.getById(created.id)).toThrow(NotFoundError);
    expect(() => service.remove(created.id)).toThrow(NotFoundError);
  });
});

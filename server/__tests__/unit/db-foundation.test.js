/* eslint-env jest */
const { existsSync } = require('fs');

const { resolveDatabasePath } = require('../../db/connection');
const { createServiceRepository } = require('../../repositories/service.repository');
const {
  createServiceFixture,
  createTelegramStub,
  createTestDatabase,
  resetDatabase
} = require('../helpers/test-support');

describe('database foundation', () => {
  let testDatabase;

  beforeEach(() => {
    testDatabase = createTestDatabase();
  });

  afterEach(() => {
    testDatabase.cleanup();
  });

  test('selects a separate test database by default', () => {
    expect(resolveDatabasePath({ environment: { NODE_ENV: 'test' } })).toMatch(/services\.test\.db$/);
    expect(() => resolveDatabasePath({
      environment: { DATABASE_PATH: 'services.db', NODE_ENV: 'test' }
    })).toThrow('Test environments must not use the development database.');
  });

  test('maps repository records to domain objects and supports isolated resets', () => {
    const repository = createServiceRepository(testDatabase.database);
    const created = repository.create(createServiceFixture({ amount: 0 }));

    expect(created).toMatchObject({
      amount: 0,
      paid: false,
      paymentDate: null
    });
    expect(created).toHaveProperty('createdAt');
    expect(created).toHaveProperty('updatedAt');

    resetDatabase(testDatabase.database);

    expect(repository.findAll()).toEqual([]);
  });

  test('enforces storage constraints and leaves failed transactions unchanged', () => {
    const repository = createServiceRepository(testDatabase.database);

    expect(() => repository.transaction(() => {
      repository.create(createServiceFixture());
      repository.create(createServiceFixture({ name: 'Invalid type', type: 'other' }));
    })).toThrow();
    expect(repository.findAll()).toEqual([]);
  });

  test('records Telegram stub messages without contacting an external service', async () => {
    const telegram = createTelegramStub();

    await telegram.sendMessage('A test message');

    expect(telegram.messages).toEqual(['A test message']);
    expect(existsSync(testDatabase.databasePath)).toBe(true);
  });
});

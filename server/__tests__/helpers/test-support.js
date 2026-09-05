const { mkdtempSync, rmSync } = require('fs');
const { tmpdir } = require('os');
const path = require('path');

const { createDatabaseConnection } = require('../../db/connection');
const { initializeSchema } = require('../../db/schema');

function createServiceFixture(overrides = {}) {
  return {
    name: 'Electricity bill',
    type: 'electricity',
    amount: 450,
    paymentDate: null,
    dueDate: '2026-10-15',
    paid: false,
    ...overrides
  };
}

function createTestDatabase() {
  const directory = mkdtempSync(path.join(tmpdir(), 'expense-tracker-'));
  const databasePath = path.join(directory, 'services.test.db');
  const database = createDatabaseConnection({
    databasePath,
    environment: { NODE_ENV: 'test' }
  });

  initializeSchema(database);

  return {
    database,
    databasePath,
    cleanup() {
      database.close();
      rmSync(directory, { force: true, recursive: true });
    }
  };
}

function resetDatabase(database) {
  database.exec('DELETE FROM services;');
}

function createTelegramStub(options = {}) {
  const messages = [];
  const error = options.error;

  return {
    messages,
    async sendMessage(message) {
      messages.push(message);

      if (error) {
        throw error;
      }
    }
  };
}

module.exports = {
  createServiceFixture,
  createTelegramStub,
  createTestDatabase,
  resetDatabase
};

const { createDatabaseConnection } = require('./connection');
const { initializeSchema } = require('./schema');

function migrateDatabase(options = {}) {
  const database = createDatabaseConnection(options);

  try {
    initializeSchema(database);
  } finally {
    database.close();
  }
}

module.exports = {
  migrateDatabase
};

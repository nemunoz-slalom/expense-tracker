const Database = require('better-sqlite3');
const path = require('path');

const DEVELOPMENT_DATABASE = 'services.db';
const TEST_DATABASE = 'services.test.db';

function resolveDatabasePath(options = {}) {
  const environment = options.environment || process.env;
  const databasePath = options.databasePath || environment.DATABASE_PATH;
  const isTestEnvironment = environment.NODE_ENV === 'test';
  const resolvedDatabasePath = path.resolve(
    databasePath || (isTestEnvironment ? TEST_DATABASE : DEVELOPMENT_DATABASE)
  );

  if (isTestEnvironment) {
    const resolvedDevelopmentPath = path.resolve(DEVELOPMENT_DATABASE);
    if (resolvedDatabasePath === resolvedDevelopmentPath || path.basename(resolvedDatabasePath) === DEVELOPMENT_DATABASE) {
      throw new Error('Test environments must not use the development database.');
    }
  }

  return resolvedDatabasePath;
}

function createDatabaseConnection(options = {}) {
  const databasePath = resolveDatabasePath(options);
  const database = new Database(databasePath);

  database.pragma('foreign_keys = ON');
  database.pragma('journal_mode = WAL');

  return database;
}

module.exports = {
  DEVELOPMENT_DATABASE,
  TEST_DATABASE,
  createDatabaseConnection,
  resolveDatabasePath
};

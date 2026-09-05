require('dotenv').config();

const { loadConfig } = require('./config/env');
const { createDatabaseConnection } = require('./db/connection');
const { migrateDatabase } = require('./db/migrate');
const { createServiceRepository } = require('./repositories/service.repository');
const { createApp } = require('./app');
const { createServiceService } = require('./services/service.service');
const { createLogger } = require('./utils/logger');

function startServer(app, config, logger) {
  return app.listen(config.port, () => {
    logger.log('server.started', { port: config.port });
  });
}

function createServer() {
  const logger = createLogger();
  const config = loadConfig(process.env, logger);
  migrateDatabase({ databasePath: config.databasePath });
  const database = createDatabaseConnection({ databasePath: config.databasePath });
  const repository = createServiceRepository(database);
  const serviceService = createServiceService(repository);
  const app = createApp({ serviceService, logger });

  return { app, config, database, logger };
}

if (require.main === module) {
  const { app, config, database, logger } = createServer();
  const server = startServer(app, config, logger);
  const stop = () => {
    logger.log('server.stopping');
    server.close(() => {
      database.close();
      logger.log('server.stopped');
    });
  };

  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
}

module.exports = { createServer, startServer };

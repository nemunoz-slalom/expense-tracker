const express = require('express');
const cors = require('cors');

const { isDomainError } = require('./services/errors');
const { createServicesRouter } = require('./routes/services.routes');
const { createLogger } = require('./utils/logger');

function createApp({ serviceService, logger = createLogger(), clientOrigin }) {
  const app = express();

  app.use(express.json());
  app.use(cors({ origin: clientOrigin }));
  app.use('/api/services', createServicesRouter(serviceService));
  app.use((error, request, response, next) => {
    void next;

    if (isDomainError(error)) {
      logger.log('request.rejected', { error: error.error, statusCode: error.statusCode });
      response.status(error.statusCode).json({ error: error.error, message: error.message });
      return;
    }
    logger.log('request.failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    response.status(500).json({ error: 'InternalServerError', message: 'An unexpected error occurred' });
  });

  return app;
}

module.exports = { createApp };

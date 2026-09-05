const express = require('express');

const { parseIdentifier } = require('../utils/dates');
const { parseFilters } = require('../utils/filters');
const { validateCreate, validateUpdate } = require('../utils/validation');

function createServicesRouter(serviceService) {
  const router = express.Router();

  router.get('/', (request, response, next) => {
    try {
      const filters = parseFilters(request.query);
      response.json({ data: serviceService.list(filters) });
    } catch (error) {
      next(error);
    }
  });

  router.post('/', (request, response, next) => {
    try {
      const service = serviceService.create(validateCreate(request.body));
      response.status(201).json({ data: service });
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id', (request, response, next) => {
    try {
      const service = serviceService.getById(parseIdentifier(request.params.id));
      response.json({ data: service });
    } catch (error) {
      next(error);
    }
  });

  router.patch('/:id', (request, response, next) => {
    try {
      const service = serviceService.update(
        parseIdentifier(request.params.id),
        validateUpdate(request.body)
      );
      response.json({ data: service });
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:id', (request, response, next) => {
    try {
      serviceService.remove(parseIdentifier(request.params.id));
      response.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { createServicesRouter };

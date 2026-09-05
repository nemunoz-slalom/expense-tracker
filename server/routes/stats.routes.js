const express = require('express');

const { ValidationError } = require('../services/errors');
const { SERVICE_TYPES } = require('../utils/validation');

function parsePeriods(query) {
  const keys = Object.keys(query);
  if (keys.some((key) => key !== 'periods')) {
    throw new ValidationError('periods is the only supported query parameter');
  }
  const value = query.periods;
  if (Array.isArray(value) || (value !== undefined && !/^\d+$/.test(value))) {
    throw new ValidationError('periods must be an integer between 1 and 12');
  }
  const periods = value === undefined ? 6 : Number(value);
  if (periods < 1 || periods > 12) {
    throw new ValidationError('periods must be an integer between 1 and 12');
  }
  return periods;
}

function createStatsRouter(statsService) {
  const router = express.Router();

  router.get('/type/:type', (request, response, next) => {
    try {
      const { type } = request.params;
      if (!SERVICE_TYPES.includes(type)) {
        throw new ValidationError('type must be a supported service type');
      }
      response.json({ data: statsService.getByType(type, parsePeriods(request.query)) });
    } catch (error) {
      next(error);
    }
  });

  router.use((request, response) => {
    response.status(404).json({ error: 'NotFoundError', message: 'Not found' });
  });

  return router;
}

module.exports = { createStatsRouter, parsePeriods };

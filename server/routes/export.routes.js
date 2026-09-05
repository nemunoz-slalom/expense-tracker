const express = require('express');

const { parseFilters } = require('../utils/filters');

function createExportRouter(pdfService) {
  const router = express.Router();

  router.get('/pdf', (request, response, next) => {
    try {
      const pdf = pdfService.render(parseFilters(request.query));
      response
        .status(200)
        .type('application/pdf')
        .attachment('services-report.pdf')
        .send(pdf);
    } catch (error) {
      next(error);
    }
  });

  router.use((request, response) => {
    response.status(404).json({ error: 'NotFoundError', message: 'Not found' });
  });

  return router;
}

module.exports = { createExportRouter };

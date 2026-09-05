const { NotFoundError } = require('./errors');
const { localToday } = require('../utils/dates');
const { projectService, sortServices } = require('../utils/sorting');
const { validateCreate, validateService, validateUpdate } = require('../utils/validation');

function createServiceService(repository, clock = () => new Date(), notificationService) {
  function project(service) {
    return projectService(service, localToday(clock()));
  }

  function create(input) {
    const service = input.paid === false
      ? validateService(input)
      : validateCreate(input);
    return project(repository.create(service));
  }

  function list(filters = {}) {
    const today = localToday(clock());
    const services = repository.findAll(filters).map((service) => projectService(service, today));
    return sortServices(services, today);
  }

  function getById(id) {
    const service = repository.findById(id);
    if (!service) {
      throw new NotFoundError();
    }
    return project(service);
  }

  function update(id, changes) {
    const existing = repository.findById(id);
    if (!existing) {
      throw new NotFoundError();
    }

    const updates = validateUpdate(changes);
    const paidTransition = !existing.paid && updates.paid === true;
    const completeService = validateService({
      ...existing,
      ...updates,
      paymentDate: paidTransition ? localToday(clock()) : (updates.paymentDate ?? existing.paymentDate)
    });

    const updated = repository.update(id, completeService);
    if (!updated) {
      throw new NotFoundError();
    }
    const projected = project(updated);
    if (paidTransition && notificationService) {
      Promise.resolve()
        .then(() => notificationService.sendPaid(projected))
        .catch(() => undefined);
    }
    return projected;
  }

  async function notify(id) {
    const service = getById(id);
    if (notificationService) {
      await notificationService.sendCreation(service);
    }
  }

  function remove(id) {
    const deleted = repository.delete(id);
    if (!deleted) {
      throw new NotFoundError();
    }
  }

  return { create, getById, list, notify, remove, update };
}

module.exports = { createServiceService };

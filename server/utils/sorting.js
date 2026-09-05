const { localToday } = require('./dates');

const STATUS_RANK = { overdue: 0, urgent: 1, normal: 2, paid: 3 };

function getStatus(service, today = localToday()) {
  if (service.paid) {
    return 'paid';
  }
  if (service.dueDate < today) {
    return 'overdue';
  }

  const urgentUntil = new Date(`${today}T12:00:00`);
  urgentUntil.setDate(urgentUntil.getDate() + 7);
  if (service.dueDate <= localToday(urgentUntil)) {
    return 'urgent';
  }

  return 'normal';
}

function projectService(service, today) {
  return { ...service, status: getStatus(service, today) };
}

function compareServices(left, right, today) {
  const rankDifference = STATUS_RANK[getStatus(left, today)] - STATUS_RANK[getStatus(right, today)];
  if (rankDifference !== 0) {
    return rankDifference;
  }
  if (left.dueDate !== right.dueDate) {
    return left.dueDate.localeCompare(right.dueDate);
  }
  return left.id - right.id;
}

function sortServices(services, today) {
  return [...services].sort((left, right) => compareServices(left, right, today));
}

module.exports = { compareServices, getStatus, projectService, sortServices };

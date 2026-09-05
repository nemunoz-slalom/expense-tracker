function mapServiceRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    type: row.type,
    amount: row.amount,
    paymentDate: row.payment_date,
    dueDate: row.due_date,
    paid: Boolean(row.paid),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function createServiceRepository(database) {
  const findByIdStatement = database.prepare(`
    SELECT id, name, type, amount, payment_date, due_date, paid, created_at, updated_at
    FROM services
    WHERE id = ?
  `);
  const insertStatement = database.prepare(`
    INSERT INTO services (name, type, amount, payment_date, due_date, paid)
    VALUES (@name, @type, @amount, @paymentDate, @dueDate, @paid)
  `);
  const updateStatement = database.prepare(`
    UPDATE services
    SET name = @name,
        type = @type,
        amount = @amount,
        payment_date = @paymentDate,
        due_date = @dueDate,
        paid = @paid,
        updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = @id
  `);
  const deleteStatement = database.prepare('DELETE FROM services WHERE id = ?');

  function findById(id) {
    return mapServiceRow(findByIdStatement.get(id));
  }

  function findAll(filters = {}) {
    const conditions = [];
    const parameters = {};

    if (filters.type !== undefined) {
      conditions.push('type = @type');
      parameters.type = filters.type;
    }

    if (filters.paid !== undefined) {
      conditions.push('paid = @paid');
      parameters.paid = filters.paid ? 1 : 0;
    }

    const from = filters.from || filters.dueDateFrom;
    if (from !== undefined) {
      conditions.push('due_date >= @from');
      parameters.from = from;
    }

    const to = filters.to || filters.dueDateTo;
    if (to !== undefined) {
      conditions.push('due_date <= @to');
      parameters.to = to;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const statement = database.prepare(`
      SELECT id, name, type, amount, payment_date, due_date, paid, created_at, updated_at
      FROM services
      ${whereClause}
      ORDER BY due_date ASC, id ASC
    `);

    return statement.all(parameters).map(mapServiceRow);
  }

  function create(service) {
    const createService = database.transaction((input) => {
      const result = insertStatement.run({
        name: input.name,
        type: input.type,
        amount: input.amount ?? null,
        paymentDate: input.paymentDate ?? null,
        dueDate: input.dueDate,
        paid: input.paid ? 1 : 0
      });

      return findById(result.lastInsertRowid);
    });

    return createService(service);
  }

  function update(id, service) {
    const updateService = database.transaction((inputId, input) => {
      const result = updateStatement.run({
        id: inputId,
        name: input.name,
        type: input.type,
        amount: input.amount ?? null,
        paymentDate: input.paymentDate ?? null,
        dueDate: input.dueDate,
        paid: input.paid ? 1 : 0
      });

      return result.changes === 0 ? null : findById(inputId);
    });

    return updateService(id, service);
  }

  function remove(id) {
    return deleteStatement.run(id).changes > 0;
  }

  function transaction(work, ...args) {
    return database.transaction(work)(...args);
  }

  return {
    create,
    delete: remove,
    findAll,
    findById,
    transaction,
    update
  };
}

module.exports = {
  createServiceRepository,
  mapServiceRow
};

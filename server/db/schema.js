const SERVICE_TYPES = ['electricity', 'gas', 'internet', 'mobile', 'water'];

function initializeSchema(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL CHECK (length(trim(name)) > 0),
      type TEXT NOT NULL CHECK (type IN ('electricity', 'gas', 'internet', 'mobile', 'water')),
      amount REAL CHECK (amount IS NULL OR amount >= 0),
      payment_date TEXT,
      due_date TEXT NOT NULL,
      paid INTEGER NOT NULL DEFAULT 0 CHECK (paid IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE INDEX IF NOT EXISTS idx_services_due_date ON services (due_date);
    CREATE INDEX IF NOT EXISTS idx_services_type_due_date ON services (type, due_date);
    CREATE INDEX IF NOT EXISTS idx_services_paid_due_date ON services (paid, due_date);
  `);
}

module.exports = {
  SERVICE_TYPES,
  initializeSchema
};

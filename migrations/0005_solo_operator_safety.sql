CREATE TABLE IF NOT EXISTS outbound_suppressions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'manual',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_outbound_suppressions_email_active ON outbound_suppressions(email, active);

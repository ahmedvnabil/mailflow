CREATE TABLE IF NOT EXISTS outbound_email_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  text_body TEXT NOT NULL DEFAULT '',
  html_body TEXT NOT NULL DEFAULT '',
  variables_json TEXT NOT NULL DEFAULT '[]',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS outbound_email_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_id INTEGER,
  status TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'cloudflare_email',
  error TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  sent_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES outbound_email_templates(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS outbound_daily_usage (
  day TEXT NOT NULL,
  api_key_id TEXT NOT NULL,
  recipient_hash TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, api_key_id, recipient_hash)
);

CREATE INDEX IF NOT EXISTS idx_outbound_email_logs_created_at ON outbound_email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outbound_daily_usage_day_key ON outbound_daily_usage(day, api_key_id);

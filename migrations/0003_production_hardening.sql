CREATE UNIQUE INDEX IF NOT EXISTS idx_emails_message_id_unique ON emails(message_id);
CREATE INDEX IF NOT EXISTS idx_email_events_message_id ON email_events(message_id);

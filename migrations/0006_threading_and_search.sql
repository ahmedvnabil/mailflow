-- Email threading + search support
-- Adds reply-tracking headers to inbound emails so customer replies attach to
-- the existing ticket instead of spawning a new one, plus indexes that keep
-- the unified search endpoint fast.

ALTER TABLE emails ADD COLUMN in_reply_to TEXT;
ALTER TABLE emails ADD COLUMN references_ids TEXT;

CREATE INDEX IF NOT EXISTS idx_emails_in_reply_to ON emails(in_reply_to);
CREATE INDEX IF NOT EXISTS idx_emails_subject ON emails(subject);
CREATE INDEX IF NOT EXISTS idx_tickets_contact_id ON tickets(contact_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);

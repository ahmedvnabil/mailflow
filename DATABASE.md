# Database

D1 migrations create the required MailFlow Studio tables:

- `users`: role-ready user records for admin, manager, agent, viewer.
- `inboxes`: logical inboxes and routed addresses.
- `emails`: canonical stored inbound emails with metadata, body fields, headers, tags, and contact/inbox links.
- `contacts`: automatically upserted sender records.
- `tickets`: email-derived work items.
- `ticket_messages`: conversation timeline rows.
- `rules`: priority rule engine definitions.
- `workflows`: trigger/action automation definitions.
- `workflow_runs`: execution history.
- `attachments`: R2 object metadata and scan placeholder status.
- `logs`: searchable audit log.
- `settings`: masked configuration values.
- `api_keys`: role-ready API key metadata.
- `ai_providers`: provider/model/capability metadata with masked credentials.
- `outbound_email_templates`: reusable transactional templates with subject, text, HTML, variables, and active status.
- `outbound_email_logs`: one row per outbound attempt with sender, recipient, subject, template, status, provider, redacted error, metadata, and sent timestamp.
- `outbound_daily_usage`: daily counters by API key and recipient hash for basic outbound rate limiting.

`email_events` and `action_logs` are retained as a compatibility/audit trail for low-level Email Worker processing.

## Outbound Migration

`migrations/0004_outbound_email_sending.sql` adds:

- `outbound_email_templates`
- `outbound_email_logs`
- `outbound_daily_usage`
- Indexes for outbound log ordering and daily usage lookup

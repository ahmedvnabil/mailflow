# Architecture

MailFlow Studio has two runtime entry points in one Worker export:

- `fetch`: Hono dashboard and JSON API.
- `email`: Cloudflare Email Worker handler.

Inbound email flow:

1. Parse MIME with `postal-mime`.
2. Store email event audit row.
3. Upsert contact.
4. Store canonical email row.
5. Store attachment metadata and R2 objects when available.
6. Load active rules ordered by priority.
7. Execute actions and processor side effects such as ticket creation.
8. Run active workflows.
9. Write action logs, workflow runs, and searchable audit logs.

The frontend is server-served HTML with Tailwind, HTMX, and Alpine.js. Data-heavy module screens call `/api/v1` endpoints directly.

Security architecture:

- Admin login and API key middleware.
- Optional KV-backed rate limiting.
- Secret masking in settings and AI provider responses.
- Role tables and API key tables are present for multi-user expansion.

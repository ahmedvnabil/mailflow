# MailFlow Studio API

Base path: `/api/v1`

Auth:

- Header: `x-api-key: <ADMIN_API_KEY>`
- Or dashboard session cookie from `/login`

## Core

- `GET /health`
- `GET /stats`
- `GET /analytics`

## Email Operations

- `GET /emails`
- `POST /test-email`
- `POST /send-email`
- `GET /logs`
- `GET /logs/:id`
- `GET /audit-logs?status=&keyword=`

### Send Outbound Email

`POST /api/v1/send-email` requires `x-api-key` or a dashboard session cookie.

```json
{
  "from": "noreply@yourdomain.com",
  "to": "user@example.com",
  "subject": "Welcome",
  "text": "Hello",
  "html": "<p>Hello</p>",
  "template_id": null,
  "data": {}
}
```

Response on success:

```json
{
  "ok": true,
  "status": "sent",
  "logId": 1,
  "recipients": ["user@example.com"]
}
```

Safe failure responses include `email_binding_not_configured`, `sender_not_allowed`, `invalid_recipient`, `too_many_recipients`, `daily_send_limit_exceeded`, `recipient_daily_limit_exceeded`, `invalid_subject`, `empty_body`, and `body_too_large`. Every attempt is written to `outbound_email_logs`.

See `examples/outbound-use-cases.json` for OTP, contact form reply, ticket notification, workflow alert, and welcome email payloads.

## Outbound Email Templates

- `GET /outbound/settings`
- `GET /outbound/templates`
- `POST /outbound/templates`
- `GET /outbound/templates/:id`
- `PUT /outbound/templates/:id`
- `DELETE /outbound/templates/:id`
- `GET /outbound/logs?limit=100`

Template payload:

```json
{
  "name": "OTP email",
  "subject": "Your code is {{code}}",
  "text_body": "Use {{code}} to sign in.",
  "html_body": "<p>Use <strong>{{code}}</strong> to sign in.</p>",
  "variables_json": ["code"],
  "active": true
}
```

## Inboxes

- `GET /inboxes`
- `POST /inboxes`

Example:

```json
{
  "name": "Support",
  "description": "Customer support inbox",
  "email_addresses": "support@example.com,help@example.com",
  "assigned_team": "Support",
  "color": "#2563eb",
  "priority": 10,
  "status": "active"
}
```

## Rules

- `GET /rules`
- `POST /rules`
- `GET /rules/:id`
- `PUT /rules/:id`
- `DELETE /rules/:id`

Conditions include recipient/sender/subject/body contains, keywords, attachment exists, header contains, domain matches, and regex.

Actions include forward, move to inbox, create ticket, Telegram, Slack, webhook, API call, store attachment, tag email, assign user, create/update contact, mark spam, ignore, auto reply, and AI actions.

## Tickets

- `GET /tickets`
- `GET /tickets/:id`

Tickets are created by rule or workflow actions.

## Contacts

- `GET /contacts`

Contacts are created automatically from inbound senders.

## Workflows

- `GET /workflows`
- `POST /workflows`
- `GET /workflow-runs`

Workflow triggers: `new_email`, `attachment_received`, `keyword_match`.

## Attachments

- `GET /attachments`

Attachments are indexed in D1 and stored in R2 when configured.

## AI

- `GET /ai/providers`
- `POST /ai/providers`

Provider credentials are write-only/masked.

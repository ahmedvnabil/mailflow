# Workflows

Workflows are lightweight trigger/action automations.

Triggers:

- `new_email`
- `attachment_received`
- `keyword_match`
- Future-ready: contact created, ticket created, rule match.

Actions reuse the rule engine action catalog:

- Webhook/API call
- Telegram
- Slack
- Ticket/contact actions
- Database update placeholders
- Delay/branch placeholders for future Durable Object or queue-backed execution

Every execution writes `workflow_runs` and `logs`.

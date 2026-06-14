# MailFlow Studio

MailFlow Studio is a Cloudflare-native Email Operations Platform. It sits between incoming business email and the final destination, then stores, routes, classifies, automates, and logs every message.

This repo is a production-oriented MVP built on:

- Cloudflare Workers and Email Workers
- Hono and TypeScript
- Cloudflare D1
- Cloudflare KV for API rate limiting when configured
- Cloudflare R2 for attachment storage when configured
- Plain HTML, Tailwind CDN, HTMX, and Alpine.js

No React. No Vue.

## Modules

- Dashboard
- Inboxes
- Email Rules
- Workflows
- Tickets and ticket detail view (agent replies + internal notes)
- Contacts
- Attachments
- Outbound Emails
- Unified Search
- AI Automation
- Logs
- Analytics
- Settings

## Conversation threading and ticket replies

Inbound replies are threaded automatically. When a customer answers an existing
conversation, MailFlow matches the message by `In-Reply-To` / `References`
headers (falling back to a normalized subject for the same contact) and appends
it to the existing ticket instead of opening a duplicate.

From the ticket detail view you can reply to the customer
(`POST /api/v1/tickets/:id/reply`, sent through the outbound binding with
threading headers and logged on the timeline), add a private internal note
(`POST /api/v1/tickets/:id/note`), update status/priority/assignee
(`PUT /api/v1/tickets/:id`), and insert a saved template as a canned response.

## Unified search

`GET /api/v1/search?q=...` (and the `/search` page) searches across inbound
emails, tickets, and contacts in one query.

## Local Setup

```bash
npm install
cp .dev.vars.example .dev.vars
cp wrangler.toml.example wrangler.toml
npm run migrate:local
npm run dev
```

Open the local URL printed by Wrangler. The local fallback login key is `dev-admin-key` unless `ADMIN_API_KEY` is set in `.dev.vars`.

Both `.dev.vars` and `wrangler.toml` are gitignored. Every contributor maintains their own copy with their `database_id`, custom domain, and provider credentials. The `.example` files are the single source of truth for the template shape — keep them in sync when you add new fields.

## Cloudflare Email Workers

Cloudflare Email Workers receive routed email through an `email(message, env, ctx)` handler. MailFlow parses the raw MIME stream, stores email metadata/body preview, creates or updates a contact, stores attachment metadata/R2 objects, evaluates rules, executes workflows, creates tickets when configured, and writes audit logs.

Local Email Worker simulation:

```bash
curl --request POST 'http://localhost:8787/cdn-cgi/handler/email?from=sender@example.com&to=support@example.com' \
  --data-raw 'From: Sender <sender@example.com>
To: support@example.com
Subject: Invoice question
Message-ID: <local-test@example.com>
Content-Type: text/plain; charset=utf-8

Can you send a quote today?'
```

## Cloudflare Setup

Create D1:

```bash
npx wrangler d1 create email_gateway_studio
npm run migrate:remote
```

Create KV:

```bash
npx wrangler kv namespace create CONFIG_CACHE
```

Create R2:

```bash
npx wrangler r2 bucket create mailflow-attachments
```

Set secrets:

```bash
npx wrangler secret put ADMIN_API_KEY
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put OPENROUTER_API_KEY
```

Deploy:

```bash
npm run deploy
```

Then route addresses such as `support@`, `sales@`, `billing@`, and `jobs@` to the deployed Worker in Cloudflare Email Routing.

## Native Outbound Email Sending

MailFlow Studio can send transactional email through Cloudflare Email Service / Workers email binding. Add a `send_email` binding in `wrangler.toml`:

```toml
[[send_email]]
name = "EMAIL"
allowed_sender_addresses = ["noreply@yourdomain.com", "support@yourdomain.com"]
```

Then configure Settings:

- `outbound_enabled=true`
- `default_from_email=noreply@yourdomain.com`
- `allowed_sender_addresses=noreply@yourdomain.com,support@yourdomain.com`
- `max_recipients_per_request=10`
- `daily_send_limit=500`

Use `/outbound` to send from the dashboard, `/outbound/templates` to manage templates, `/outbound/logs` to inspect attempts, and `/outbound/test` for a controlled send test. If the `EMAIL` binding is missing, MailFlow does not crash; it returns `email_binding_not_configured` and logs the failed attempt.

Recommended use cases: OTP email, welcome email, ticket notifications, workflow alerts, and contact form replies. This native binding is best for transactional mail from verified Cloudflare-managed domains. It is not a bulk newsletter system yet; use SES, Resend, Mailgun, or a dedicated ESP when you need advanced deliverability controls, suppression lists, marketing analytics, high-volume campaigns, or list management.

## Verification

```bash
npm test
npm run typecheck
npm run migrate:local
```

## Production Settings

The Settings page/API supports:

- Default inbox
- Default ticket status and priority
- Log retention days
- Attachment retention days
- Global AI enable/disable
- Auto-ticket creation enable/disable
- Workflow/webhook retry count
- Max stored body preview length
- Max API request body bytes
- Max attachment bytes
- Outbound enabled
- Default outbound from email
- Allowed outbound sender addresses
- Max recipients per outbound request
- Daily outbound send limit
- Verified sender warning

## Limitations

- AI actions call OpenAI/OpenRouter/Ollama when the corresponding environment configuration is present and AI is globally enabled. Anthropic/Gemini are represented in the provider abstraction and can be added with provider-specific request adapters.
- Auto-reply can be backed by the outbound module, but rule-level auto-reply still needs explicit product wiring before enabling automatic replies.
- R2 attachment objects are stored only when the `ATTACHMENTS` binding exists and MIME content is available.
- Secrets are masked in UI/API responses. Production credential encryption should use a dedicated key management flow before multi-tenant rollout.
- Cloudflare native email sending is recommended for transactional messages, not bulk newsletters.

## Contributing

Pull requests, issues, and discussion are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup, test expectations, and PR guidelines. For security issues, follow the disclosure process in [SECURITY.md](SECURITY.md) rather than opening a public issue.

## License

MailFlow Studio is released under the MIT License. See [LICENSE](LICENSE) for the full text.

# Production Checklist

## Cloudflare Resources

- [ ] Create D1: `npx wrangler d1 create email_gateway_studio`
- [ ] Set D1 `database_id` in `wrangler.toml`
- [ ] Create KV: `npx wrangler kv namespace create CONFIG_CACHE`
- [ ] Set KV namespace ID in `wrangler.toml`
- [ ] Create R2: `npx wrangler r2 bucket create mailflow-attachments`
- [ ] Set R2 bucket binding in `wrangler.toml`
- [ ] Onboard the outbound sending domain in Cloudflare
- [ ] Configure `[[send_email]]` with binding name `EMAIL`
- [ ] Set `allowed_sender_addresses` to verified senders only

## Required Secrets

- [ ] `npx wrangler secret put ADMIN_API_KEY`
- [ ] `npx wrangler secret put TELEGRAM_BOT_TOKEN` if Telegram actions are used
- [ ] `npx wrangler secret put TELEGRAM_CHAT_ID` if Telegram actions are used
- [ ] `npx wrangler secret put OPENAI_API_KEY` if OpenAI actions are used
- [ ] `npx wrangler secret put OPENROUTER_API_KEY` if OpenRouter actions are used

## Migrations

- [ ] `npm run migrate:remote`
- [ ] Confirm migrations `0001_initial.sql`, `0002_mailflow_modules.sql`, `0003_production_hardening.sql`, and `0004_outbound_email_sending.sql` applied

## Email Routing Setup

- [ ] Onboard the domain in Cloudflare Email Routing
- [ ] Verify destination addresses needed for forwarding
- [ ] Create routing rules for `support@`, `sales@`, `billing@`, `jobs@`, or catch-all
- [ ] Route each address to the MailFlow Studio Worker

## Worker Route Setup

- [ ] Deploy with `npm run deploy`
- [ ] Attach a custom route or Workers domain for the dashboard
- [ ] Login with the production `ADMIN_API_KEY`
- [ ] Create a test inbox and rule
- [ ] Configure outbound settings: default sender, allowed senders, recipients/request, daily limit

## Local Testing

- [ ] `npm install`
- [ ] `cp .dev.vars.example .dev.vars`
- [ ] `npm run migrate:local`
- [ ] `npm test`
- [ ] `npm run typecheck`
- [ ] `npm run dev`
- [ ] Simulate `/api/v1/test-email`
- [ ] Simulate `/cdn-cgi/handler/email`

## Production Testing

- [ ] Send a real email to a routed address
- [ ] Confirm an email row appears
- [ ] Confirm a contact is created
- [ ] Confirm ticket creation works when enabled
- [ ] Confirm workflow runs are logged
- [ ] Confirm failed webhooks retry and then log failure
- [ ] Confirm secret fields are masked in Settings
- [ ] Confirm audit logs do not contain API keys/tokens
- [ ] Send an outbound test from `/outbound/test`
- [ ] Confirm success or clear `email_binding_not_configured` safe failure
- [ ] Confirm outbound logs are written and errors are redacted
- [ ] Confirm sender validation blocks unapproved `from` addresses
- [ ] Confirm daily send limits block excess sends

## Backup Notes

- [ ] Schedule D1 exports
- [ ] Define R2 retention/lifecycle policy
- [ ] Record resource IDs outside the repo
- [ ] Keep migrations in source control
- [ ] Monitor D1 size, R2 usage, Worker errors, and failed workflow runs

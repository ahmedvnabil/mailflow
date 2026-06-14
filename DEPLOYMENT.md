# Deployment

## Local

```bash
npm install
cp .dev.vars.example .dev.vars
npm run migrate:local
npm run dev
```

## Production

1. Create D1, KV, and R2 resources.
2. Copy IDs/names into `wrangler.toml`.
3. Set secrets with `wrangler secret put`.
4. Run `npm run migrate:remote`.
5. Deploy with `npm run deploy`.
6. Route Cloudflare Email Routing addresses to the Worker.
7. Configure the `[[send_email]]` binding if outbound transactional email is enabled.
8. Confirm `ADMIN_API_KEY` is configured before exposing the dashboard.
9. Configure production settings for body size, attachment size, retention, retries, AI enablement, and outbound send limits.

## Cloudflare Email Sending

Cloudflare native outbound sending requires a verified/domain-onboarded Cloudflare email setup and allowed sender addresses in Wrangler:

```toml
[[send_email]]
name = "EMAIL"
allowed_sender_addresses = ["noreply@yourdomain.com", "support@yourdomain.com"]
```

Production setup:

1. Onboard the sending domain in Cloudflare.
2. Confirm the sender addresses are allowed by Cloudflare and match `allowed_sender_addresses`.
3. Add the `[[send_email]]` binding to `wrangler.toml`.
4. Deploy the Worker.
5. In Settings, set `default_from_email`, `allowed_sender_addresses`, `max_recipients_per_request`, and `daily_send_limit`.
6. Use `/outbound/test` for a live transactional send.

Cloudflare native email sending is a good fit for OTP, welcome, notification, ticket, and workflow alert mail. Compared with SES, Resend, and Mailgun, it is simpler and Cloudflare-native but currently lacks the broader ESP feature set for bulk newsletters, suppression management, advanced deliverability tooling, campaign analytics, and high-volume marketing operations.

## Backup Strategy

- Export D1 on a schedule with Wrangler or Cloudflare backup tooling.
- Keep R2 lifecycle policies for attachment retention.
- Store `wrangler.toml` resource IDs in deployment secrets/docs.

## Monitoring Strategy

- Use Cloudflare Worker logs and analytics.
- Track failed rows in `logs`, `action_logs`, and `workflow_runs`.
- Add alerts for failed automation spikes and D1/R2 quota pressure.
- Review `PRODUCTION_CHECKLIST.md` before each production deploy.

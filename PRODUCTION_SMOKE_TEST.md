# Production Smoke Test Notes

## 2026-06-14 Native Outbound Smoke Test

Status: blocked before production changes.

Findings:

- `wrangler.toml` still contains placeholder outbound sender addresses: `noreply@yourdomain.com` and `support@yourdomain.com`.
- The local shell is not authenticated with Wrangler.
- `CLOUDFLARE_API_TOKEN` is not set in the environment.
- `npm run migrate:remote` stopped before applying remote D1 migrations.
- `npm run deploy` stopped before deploying the Worker.
- Cloudflare Email Sending/domain enablement could not be confirmed from this shell.
- No production dashboard smoke test, outbound send, outbound log verification, or daily usage verification was performed.

Local verification completed:

- `npm test`
- `npm run typecheck`
- `npm audit --omit=dev`

Required before retry:

1. Replace placeholder `[[send_email]].allowed_sender_addresses` with real verified sender addresses.
2. Authenticate Wrangler in this environment with `CLOUDFLARE_API_TOKEN` or an interactive `wrangler login`.
3. Confirm Cloudflare Email Sending is enabled for the sending domain.
4. Re-run `npm run migrate:remote`, `npm run deploy`, and the `/outbound` production smoke test.

## 2026-06-14 Resume Attempt With Real Credentials

Status: still blocked before production changes.

Fresh checks at `2026-06-14 00:30:23 +04`:

- `wrangler.toml` still contains placeholder outbound sender addresses: `noreply@yourdomain.com` and `support@yourdomain.com`.
- `CLOUDFLARE_API_TOKEN`, `CF_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and local `ADMIN_API_KEY` were not present in the shell environment.
- Cloudflare Email Sending/domain enablement could not be confirmed because Wrangler is not authenticated.
- `npm test` passed with 22 tests across 5 files.
- `npm run typecheck` passed.
- `npm audit --omit=dev` reported 0 vulnerabilities.
- `npm run migrate:remote` stopped before remote D1 changes because `CLOUDFLARE_API_TOKEN` is missing.
- `npm run deploy` stopped before deploy because `CLOUDFLARE_API_TOKEN` is missing.
- `/outbound` was not opened against production because no deployment or authenticated production URL/API key was available.
- No production recipient was used, no outbound email was sent, no production outbound log row was created, and no production daily usage row was created.
- No secrets were printed in command output; no production logs were available to inspect for recipient-sensitive data.

Required before retry:

1. Replace `[[send_email]].allowed_sender_addresses` with real verified sender addresses.
2. Provide `CLOUDFLARE_API_TOKEN` through the shell/session only.
3. Provide or make available the production admin/API key needed to log in or call `/api/v1/*`.
4. Confirm the sending domain has Cloudflare Email Sending enabled.
5. Re-run remote migration, deploy, `/outbound` template/send smoke test, outbound log verification, daily usage verification, and log leak review.

# Security

MailFlow Studio now applies the following production hardening controls:

- Admin API authentication uses constant-time string comparison.
- The fallback `dev-admin-key` only works for localhost requests when no admin key is configured.
- API routes require authentication and rate limiting.
- KV-backed rate limiting is used when `CONFIG_CACHE` exists; an isolate-local fallback is used when KV is missing.
- Request body size is capped through `max_request_body_bytes`.
- Webhook, Slack, and API-call actions require HTTPS and block localhost, private IPv4 ranges, link-local metadata IPs, `.local` hosts, and URL credentials.
- Action logs and audit logs redact common secret formats.
- Secret settings are write-only in the UI/API response.
- AI automation is globally disabled by default and must be enabled with `ai_enabled=true`.
- HTML email bodies are sanitized before storage.
- Attachments above `max_attachment_bytes` are not stored.
- Duplicate message IDs are ignored idempotently.
- `POST /api/v1/send-email` requires admin/API authentication.
- Outbound senders must match `allowed_sender_addresses` and the Wrangler `[[send_email]]` binding.
- Outbound recipients are validated, recipient counts are capped, and subjects/bodies have size limits.
- Outbound attempts are rate limited per API key, per recipient, and per day through `outbound_daily_usage`.
- Outbound errors and metadata are redacted before they are stored in logs.
- Missing `EMAIL` binding returns `email_binding_not_configured` and records a failed log instead of crashing.

## Remaining Production Notes

- D1 settings marked secret are masked but not cryptographically encrypted. Prefer Wrangler secrets for production provider credentials.
- Multi-user RBAC tables exist, but the current dashboard still uses a single admin session key.
- Outbound auto-reply still needs explicit rule-level product wiring before enabling automatic replies.
- Do not expose public unauthenticated send forms directly to `/api/v1/send-email`; that would create open relay risk.

## Reporting a Vulnerability

If you discover a security issue, please do not open a public GitHub issue. Instead, open a private security advisory through the repository's GitHub Security tab, or contact the maintainers directly. Include a description, reproduction steps, and the commit you tested against. We will acknowledge receipt within a few days and coordinate a fix and disclosure timeline with you.

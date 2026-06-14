# Contributing to MailFlow Studio

Thanks for your interest in improving MailFlow Studio. This project is a small, focused Cloudflare Workers application — contributions that keep it that way are the most welcome.

## Local development

```bash
npm install
cp .dev.vars.example .dev.vars
cp wrangler.toml.example wrangler.toml
npm run migrate:local
npm run dev
```

Open the local URL printed by Wrangler. The fallback login key is `dev-admin-key` unless `ADMIN_API_KEY` is set in `.dev.vars`.

`wrangler.toml` is gitignored — keep your real `database_id`, custom domain, and per-account values in your local copy. Only edit `wrangler.toml.example` when the template shape needs to change.

## Tests and type checks

Every change must keep these clean:

```bash
npm test            # vitest run
npm run typecheck   # tsc --noEmit
```

Add tests for new behaviour. For bug fixes, add a regression test that fails before the fix and passes after.

## Pull request style

- Keep PRs focused. One feature or one fix per PR.
- Small, readable diffs over large refactors.
- Update `APIs.md` if you add, change, or remove an HTTP endpoint.
- Update `README.md` if user-facing setup changes.
- No commits with real secrets, real database IDs, or production hostnames.

## Code style

- TypeScript, ESM, no transpiler beyond `tsc`.
- Hono routes live in `src/index.ts`; data access in `src/db.ts`; UI templates in `src/ui.ts`.
- Prefer small functions over deep abstractions. Match the surrounding style.
- No new runtime dependencies without a clear reason.

## Reporting security issues

Please do not file public GitHub issues for vulnerabilities. See `SECURITY.md` for the disclosure process.

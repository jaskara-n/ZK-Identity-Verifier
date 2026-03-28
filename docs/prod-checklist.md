# Production Checklist

## Security
- Replace all default secrets in `.env`.
- Rotate `INTERNAL_API_KEY` and verifier API keys on schedule.
- Use strong `JWT_SECRET` and short JWT TTL with refresh strategy.
- Enforce HTTPS at ingress.
- Restrict `CORS_ORIGIN` to known app domains.

## Data durability
- Replace in-memory challenge/session/credential storage with Postgres.
- Add Redis for cache/nonce/session acceleration.
- Add migrations and schema versioning.

## Credential lifecycle
- Persist credential issuance and revocation events.
- Add audit log entries for revocation actor/time/reason.
- Add idempotency on revoke endpoint.

## Reliability
- Add retry + timeout budgets for service calls.
- Add structured error codes in API responses.
- Add background job for expiry cleanup.

## Observability
- Centralized logs with request ID.
- Metrics: request volume, auth failures, verification success rate, revoke rate, p95 latency.
- Alerts on error spikes and elevated 5xx rates.

## CI/CD
- Gate on TS typecheck + tests + lint + Rust build.
- Add contract tests for challenge and credential lifecycle.
- Add versioned API changelog.

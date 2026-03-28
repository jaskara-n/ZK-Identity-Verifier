# Architecture

## Monorepo layout
- `apps/api`: Express backend, verifier APIs, credential lifecycle.
- `apps/web`: Product demo dashboard and user-facing workflow.
- `apps/verifier`: Partner/verifier app that consumes backend APIs.
- `crates/zk-core`: Rust proof core implementation.
- `crates/zk-node`: N-API binding that exposes Rust to Node.

## Main flow
1. Internal system registers verifier client (`/api/verifier/clients/register`).
2. Verifier app exchanges API key for JWT (`/api/verifier/auth/token`).
3. Verifier creates challenge (`/api/verifier/challenges`).
4. User app generates proof (`/api/proofs`) and submits (`/api/verifier/challenges/:id/submit`).
5. Challenge resolves to `verified`, `rejected`, or `expired`.
6. On `verified`, backend issues a verifier credential record.
7. Verifier can list and revoke credentials (`/api/verifier/credentials*`).

## Data model (current MVP)
- Verifier clients: in-memory map.
- Challenges: in-memory map.
- Credentials: in-memory map (`active` or `revoked`).
- Sessions: in-memory map.

## Security
- `helmet`
- CORS via `CORS_ORIGIN`
- rate limiting
- `x-internal-api-key` for client registration
- verifier API key -> JWT (`authorization: Bearer <token>`)

## Production hardening note
This repo is MVP-ready for local/demo use. For production scale:
- replace in-memory stores with Postgres + Redis
- add key management and rotation workflows
- add audit/event log pipeline
- add background cleanup jobs for expired sessions/challenges

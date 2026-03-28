# ZK Identity API

Main backend for verifier onboarding, challenge lifecycle, proof verification, and credential revocation.

## Run
```bash
yarn dev:api
```

## Endpoint groups

### Health
- `GET /api/health`
- `GET /api/ready`

### Proof engine
- `POST /api/sessions`
- `POST /api/proofs`
- `POST /api/verify`

### Verifier onboarding/auth
- `POST /api/verifier/clients/register` (`x-internal-api-key` required)
- `POST /api/verifier/auth/token` (`x-verifier-api-key` required)

### Verifier challenges
- `POST /api/verifier/challenges` (Bearer token)
- `GET /api/verifier/challenges/:challengeId` (Bearer token)
- `GET /api/verifier/challenges/:challengeId/public` (public)
- `POST /api/verifier/challenges/:challengeId/submit` (public submit endpoint)

### Verifier credentials
- `GET /api/verifier/credentials` (Bearer token)
- `POST /api/verifier/credentials/:credentialId/revoke` (Bearer token)

## Security controls
- `helmet`
- CORS policy via `CORS_ORIGIN`
- global rate limiting
- internal key auth for client registration
- verifier auth via API key -> short-lived JWT

## Environment
- `HOST` (default `0.0.0.0`)
- `PORT` (default `5000`)
- `SESSION_TTL_MINUTES` (default `10`)
- `PROOF_SECRET` (default dev value)
- `JWT_SECRET` (default dev value)
- `JWT_TTL_SECONDS` (default `3600`)
- `CORS_ORIGIN` (default `*`)
- `INTERNAL_API_KEY` (default dev value)

## Current storage model
Challenge/session/credential stores are in-memory (MVP mode). Replace with durable DB/Redis before production.

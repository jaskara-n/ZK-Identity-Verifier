# ZK Identity API (Express)

## Run
```bash
yarn dev:api
```

## Endpoints
- `GET /api/health`
- `POST /api/sessions`
- `POST /api/proofs`
- `POST /api/verify`

## Env
- `HOST` (default `0.0.0.0`)
- `PORT` (default `5000`)
- `SESSION_TTL_MINUTES` (default `10`)
- `PROOF_SECRET` (default `dev-only-change-me-please`)

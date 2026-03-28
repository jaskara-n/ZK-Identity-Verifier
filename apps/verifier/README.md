# Third-Party Verifier App

Demo integrator app that consumes `apps/api` verifier endpoints.

## Run
```bash
yarn dev:verifier
```

## What it simulates
- Partner onboarding (register verifier client)
- Auth token issuance
- Challenge creation
- User proof submission
- Verifier decision tracking
- Credential listing and revocation

## Local UI
- `http://localhost:5050`

## Proxy endpoints exposed by this app
- `GET /health`
- `POST /register-client`
- `POST /auth/token`
- `POST /challenges`
- `GET /challenges/:challengeId`
- `POST /simulate-submit`
- `GET /credentials`
- `POST /credentials/:credentialId/revoke`

## Environment
- `BACKEND_URL` (default `http://localhost:5000`)
- `INTERNAL_API_KEY` (must match backend)
- `PORT` (default `5050`)
- `HOST` (default `0.0.0.0`)

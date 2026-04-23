# Runbook

## Prerequisites
- Node.js 20+
- Yarn 4 (Corepack-managed)
- Rust stable toolchain (optional but recommended for native `zk-node` build)

## Install
```bash
yarn install
```

## Start all services
```bash
bash ./scripts/dev-all.sh
```

## URLs
- API: `http://localhost:5001/api/health`
- Web dashboard: `http://localhost:5173/dashboard`
- Web user app: `http://localhost:5173/user-app`
- Third-party verifier UI: `http://localhost:5050`

## Full local demo checklist
1. Register client.
2. Issue verifier token.
3. Create challenge.
4. Generate + submit proof.
5. Confirm challenge status is `verified` or `rejected`.
6. Fetch issued credentials.
7. Revoke one credential.
8. Refresh credentials list and confirm `revoked`.

## Useful debug checks
- API health:
```bash
curl http://localhost:5001/api/health
```
- Ready:
```bash
curl http://localhost:5001/api/ready
```
- Cargo installed:
```bash
cargo --version
```

## Required env vars for production
- `PROOF_SECRET`
- `JWT_SECRET`
- `INTERNAL_API_KEY`
- `CORS_ORIGIN`
- `PORT`
- `HOST`

# ZK Identity Verifier Monorepo

Industry-style monorepo for a ZK identity verification MVP.

## What this project demonstrates
- User proves age eligibility (for example `age >= 18`) without sharing raw passport data with verifier.
- Verifier gets a signed proof decision (`verified` or `rejected`).
- Verifier can list issued credentials and revoke them.
- End-to-end demo with product UI + third-party verifier UI.

## Monorepo structure
- `apps/api`: Main Express backend and verifier credential lifecycle.
- `apps/web`: Product dashboard and demo UX.
- `apps/verifier`: Third-party verifier app (simulates integrator partner app).
- `crates/zk-core`: Rust proof core.
- `crates/zk-node`: Rust N-API bridge for Node.js API usage.

## Local start
```bash
yarn install
bash ./scripts/dev-all.sh
```

Open:
- Web dashboard: `http://localhost:5173/dashboard`
- Web user app: `http://localhost:5173/user-app`
- Third-party verifier app: `http://localhost:5050`
- API health: `http://localhost:5001/api/health`

## Demo flow (short)
1. Dashboard: Register client -> Issue token -> Create challenge -> Generate + submit proof.
2. Show challenge status becomes `verified` or `rejected`.
3. Open verifier app and fetch issued credentials.
4. Revoke one credential and refresh list to show `revoked`.

## Core scripts
- `yarn dev:all`
- `yarn dev:api`
- `yarn dev:web`
- `yarn dev:verifier`
- `yarn build:zk`

## Environment
Use `.env.example` as baseline. For production, replace all default secrets and keys.

## Documentation
- `docs/architecture.md`
- `docs/api-reference.md`
- `docs/third-party-integration.md`
- `docs/runbook.md`
- `docs/prod-checklist.md`
- `docs/feature-spec.md`

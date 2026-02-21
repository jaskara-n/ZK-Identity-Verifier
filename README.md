# ZK Identity Verifier

Professional monorepo with a TypeScript API, Rust ZK core, and a web client.

## Structure
- `apps/api`: Express API (JWT/auth ready, session orchestration)
- `apps/web`: Frontend (Vite)
- `crates/zk-core`: Rust ZK core (proof types + logic)
- `crates/zk-node`: N-API bridge to use Rust core from Node

## Quick Start
```bash
# Install JS deps

yarn install

# Build Rust bridge

yarn build:zk

# Run API

yarn dev:api

# Run Web

yarn dev:web
```

## API
See `apps/api/README.md`.

# Feature Spec (Current MVP)

## Added capabilities
- Verifier onboarding with internal-key protected client registration.
- Verifier JWT auth flow.
- Challenge creation and public challenge fetch.
- ZK proof generation + challenge proof submit.
- Challenge status tracking (`pending`, `verified`, `rejected`, `expired`).
- Credential issuance on successful verification.
- Credential listing per verifier client.
- Credential revocation with reason.
- Mock chain selector in UI for demo context.
- Dashboard local verification history display.
- Third-party verifier app with guided UX and decision panel.

## API specs added recently
- `GET /api/verifier/credentials`
- `POST /api/verifier/credentials/:credentialId/revoke`

## Frontend specs added recently
- Dashboard section: `Issued Credentials (Server)` with revoke action.
- Verifier app step: `Credential Management` with fetch + revoke.
- Verifier app decision card shows final status clearly.

## Non-goals in current MVP
- On-chain settlement/attestation.
- Persistent storage in backend.
- Multi-tenant admin portal.

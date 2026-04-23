# API Reference

Base URL: `http://localhost:5001/api`

## Health
- `GET /health`
- `GET /ready`

## Proof engine

### `POST /sessions`
Creates verification session.

### `POST /proofs`
Generates proof from user input.

### `POST /verify`
Verifies proof directly.

## Verifier onboarding/auth

### `POST /verifier/clients/register`
Headers:
- `x-internal-api-key: <INTERNAL_API_KEY>`
Body:
```json
{ "name": "merchant-app" }
```

### `POST /verifier/auth/token`
Headers:
- `x-verifier-api-key: <VERIFIER_API_KEY>`
Response:
```json
{ "tokenType": "Bearer", "accessToken": "...", "expiresIn": 3600, "clientId": "..." }
```

## Verifier challenges

### `POST /verifier/challenges`
Headers:
- `authorization: Bearer <ACCESS_TOKEN>`
Body:
```json
{ "verifierId": "merchant-123", "ageThreshold": 18 }
```

### `GET /verifier/challenges/:challengeId`
Headers:
- `authorization: Bearer <ACCESS_TOKEN>`

### `GET /verifier/challenges/:challengeId/public`
No auth required.

### `POST /verifier/challenges/:challengeId/submit`
Body:
```json
{
  "passportNumber": "P1234567",
  "proof": {
    "proofId": "...",
    "payload": {
      "sessionId": "...",
      "verifierId": "merchant-123",
      "ageThreshold": 18,
      "statement": "age >= 18",
      "nullifier": "...",
      "issuedAt": "..."
    },
    "signature": "..."
  }
}
```

## Verifier credentials

### `GET /verifier/credentials`
Headers:
- `authorization: Bearer <ACCESS_TOKEN>`
Response:
```json
{
  "items": [
    {
      "credentialId": "...",
      "challengeId": "...",
      "verifierId": "merchant-123",
      "ageThreshold": 18,
      "status": "active",
      "nullifier": "...",
      "issuedAt": "...",
      "revokedAt": null,
      "revokeReason": null
    }
  ]
}
```

### `POST /verifier/credentials/:credentialId/revoke`
Headers:
- `authorization: Bearer <ACCESS_TOKEN>`
Body:
```json
{ "reason": "User requested revocation" }
```

## Common statuses
- `200` success
- `201` created
- `400` bad request
- `401` unauthorized
- `403` forbidden
- `404` not found
- `409` conflict
- `422` validation error

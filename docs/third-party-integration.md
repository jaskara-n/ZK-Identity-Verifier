# Third-Party Integration Flow

This is the full verifier-side integration sequence.

## 1) Register verifier client (one-time)
```bash
curl -X POST http://localhost:5000/api/verifier/clients/register \
  -H 'content-type: application/json' \
  -H 'x-internal-api-key: <INTERNAL_API_KEY>' \
  -d '{"name":"merchant-app"}'
```
Save `apiKey`.

## 2) Exchange verifier API key for access token
```bash
curl -X POST http://localhost:5000/api/verifier/auth/token \
  -H 'x-verifier-api-key: <VERIFIER_API_KEY>'
```
Save `accessToken`.

## 3) Create challenge
```bash
curl -X POST http://localhost:5000/api/verifier/challenges \
  -H 'content-type: application/json' \
  -H 'authorization: Bearer <ACCESS_TOKEN>' \
  -d '{"verifierId":"merchant-123","ageThreshold":18}'
```
Save `challengeId` and `sessionId`.

## 4) User app loads challenge metadata
```bash
curl http://localhost:5000/api/verifier/challenges/<CHALLENGE_ID>/public
```

## 5) User app generates proof
```bash
curl -X POST http://localhost:5000/api/proofs \
  -H 'content-type: application/json' \
  -d '{"sessionId":"<SESSION_ID>","verifierId":"merchant-123","ageThreshold":18,"birthDate":"2000-01-01","passportNumber":"P1234567"}'
```

## 6) User app submits proof
```bash
curl -X POST http://localhost:5000/api/verifier/challenges/<CHALLENGE_ID>/submit \
  -H 'content-type: application/json' \
  -d '{"passportNumber":"P1234567","proof":<PROOF_JSON>}'
```

## 7) Verifier checks final challenge status
```bash
curl http://localhost:5000/api/verifier/challenges/<CHALLENGE_ID> \
  -H 'authorization: Bearer <ACCESS_TOKEN>'
```

## 8) Verifier lists issued credentials
```bash
curl http://localhost:5000/api/verifier/credentials \
  -H 'authorization: Bearer <ACCESS_TOKEN>'
```

## 9) Verifier revokes credential
```bash
curl -X POST http://localhost:5000/api/verifier/credentials/<CREDENTIAL_ID>/revoke \
  -H 'content-type: application/json' \
  -H 'authorization: Bearer <ACCESS_TOKEN>' \
  -d '{"reason":"User requested revocation"}'
```

## State transitions
- Challenge: `pending -> verified | rejected | expired`
- Credential: `active -> revoked`

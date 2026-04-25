# UNNSSAA API Reference (Initial)

Base URL: `/api`

## Health
- `GET /health`

## Authentication
- `POST /auth/register`
  - Body: `{ "fullName": "...", "email": "...", "password": "..." }`
- `POST /auth/login`
  - Body: `{ "email": "...", "password": "..." }`
- `POST /auth/refresh`
  - Body: `{ "refreshToken": "..." }`
- `POST /auth/logout`
  - Body: `{ "refreshToken": "..." }`
- `GET /auth/me`
  - Header: `Authorization: Bearer <accessToken>`

## Content Modules
Route pattern: `/{entity}` and `/{entity}/{id}` under `/content`

Supported entities:
- `members`
- `events`
- `donations`
- `grievances`
- `whistle-reports`
- `careers`
- `mentors`
- `registrations`

### Public reads
- `GET /content/{entity}`
- `GET /content/{entity}/{id}`

List query parameters:
- `page` (default: 1)
- `pageSize` (default: 20, max: 100)
- `q` (optional text search)

### Admin writes
Requires JWT bearer token and role `ADMIN` or `SUPERADMIN`.

- `POST /content/{entity}`
- `PUT /content/{entity}/{id}`
- `DELETE /content/{entity}/{id}`
- `POST /content/import`
  - Body: `{ "entities": { "members": [...], "events": [...], "donations": [...], "grievances": [...], "whistle-reports": [...], "careers": [...], "mentors": [...] } }`
  - Performs bulk import with per-entity summary.

## Payments (Paystack scaffold)
- `POST /payments/initialize`
  - Body: `{ "email": "...", "amount": 25000, "donorName": "...", "classYear": "...", "details": "...", "callbackUrl": "https://your-domain.com/giveback.html" }`
  - Returns authorization URL and reference for redirect.
- `GET /payments/verify/{reference}`
  - Verifies transaction status with Paystack and updates local donation record on successful charge.
  - Returns receipt-friendly fields such as `donorName`, `donorEmail`, `amountKobo`, `gatewayStatus`, `channel`, `paidAt`, and `currency`.
- `POST /payments/webhook/paystack`
  - Paystack webhook endpoint for updating donation status after successful charge.

## Frontend Integration
- Login page now posts to backend via [login.js](login.js).
- Client helper for API and token persistence is in [api-client.js](api-client.js).

## Recommended next integration tasks
1. Replace `localStorage` reads in dashboard pages with `/api/content/*` fetch calls.
2. Add admin management screens for create/update/delete operations.
3. Add token refresh flow and auto-logout on invalid refresh token.

# Hostinger Business Plan Node.js Deployment (UNNSSAA)

This guide is for Hostinger hPanel Node.js app hosting on Business Web Hosting, not VPS.

For VPS deployment instead, use `deployment/DEPLOY_HOSTINGER_VPS.md`.

## 1. Platform assumptions
- You are deploying with Hostinger hPanel Node.js App Manager.
- Your app is started by hPanel (no PM2, no Nginx config required).
- You are using an external PostgreSQL provider for Prisma (for example Neon, Supabase, Railway, Render, Aiven).

## 2. Prepare production environment values

Create production values from `.env.example`:

- `NODE_ENV=production`
- `PORT` can be any value in `.env`; Hostinger provides runtime port to Node process.
- `DATABASE_URL` must be a reachable managed PostgreSQL connection string.
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` must be strong random secrets.
- `CORS_ORIGIN` should include your hosted domain(s), comma separated.
- Set Paystack keys/webhook secret for live donations.

Important: This app fails fast at startup if `DATABASE_URL`, `JWT_ACCESS_SECRET`, or `JWT_REFRESH_SECRET` are missing.

## 3. Build deployment package locally

From project root:

```bash
npm ci
npm run prisma:generate
npm test
```

Create a zip package without local dependencies:

```bash
zip -r unnssaa-hostinger.zip . -x "node_modules/*" ".git/*" "dist/*"
```

On Windows PowerShell:

```powershell
Compress-Archive -Path * -DestinationPath unnssaa-hostinger.zip -Force
```

If using PowerShell zip, remove `node_modules` and `.git` first (or package from a clean export directory).

## 4. Upload and configure in hPanel

1. Go to Hostinger hPanel -> Websites -> Manage -> Advanced -> Node.js.
2. Create a new Node.js application.
3. Set:
	 - Node version: 20.x (or latest supported LTS)
	 - Application root: folder where project is extracted
	 - Startup file: `src/server.js`
4. Upload and extract `unnssaa-hostinger.zip` into the app root.
5. Open Terminal in hPanel (or SSH if enabled), then run:

```bash
npm ci --omit=dev
npm run prisma:generate
npm run prisma:deploy
```

6. Add environment variables in Node.js app settings (same keys as `.env.example`).
7. Restart the Node.js app from hPanel.

Optional first-time bootstrap data:

```bash
npm run prisma:seed
```

Run seed once only in production.

## 5. Domain and routing
- Point domain/subdomain to the Node.js app in hPanel.
- Keep API and frontend on same origin for simplest CORS setup.
- Ensure callback URL for Paystack is set to:
	- `https://your-domain.com/giveback.html`

## 6. Smoke checks after deployment

```bash
curl -i https://your-domain.com/api/health
curl -i https://your-domain.com/
```

Expected:
- `/api/health` returns 200 JSON.
- `/` serves the web application.

## 7. Ongoing operations on Business plan
- Redeploy by uploading a new zip, then running `npm ci --omit=dev` and `npm run prisma:deploy`.
- Rotate JWT and payment secrets periodically.
- Backup managed PostgreSQL automatically at provider level.
- Use hPanel app logs to diagnose crashes/start failures.

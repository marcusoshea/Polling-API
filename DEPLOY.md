# Deploying Polling-API

Manual deploy: build locally, upload `dist/` with Transmit (SFTP), restart on the server.

## Server facts
- Host: AWS Lightsail / Bitnami. SSH as `bitnami@`.
- App path: `/opt/bitnami/applications/PollingAPI/`
- Process manager: **pm2**, process name `PollingAPI`
- nginx sits in front. A **502** almost always means the Node process is
  crash-looping — check `pm2 logs PollingAPI` first (a browser "CORS" error is
  usually just a downstream symptom of the API being down).

## Deploy steps
1. **Build locally** (clean — `prebuild` runs `rm -rf dist`):
   ```bash
   npm run build
   ```
2. **Upload** the local `dist/` to `/opt/bitnami/applications/PollingAPI/dist/` via Transmit.
3. **On the server (SSH):**
   ```bash
   cd /opt/bitnami/applications/PollingAPI
   npm install --omit=dev        # ONLY if dependencies changed (see gotcha #1)
   pm2 restart PollingAPI
   pm2 logs PollingAPI --lines 20 # expect "Nest application successfully started"
   ```
4. **Verify** from anywhere:
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" https://api-polling.aethelmearc.org/pollingorder
   ```
   Non-502 = backend healthy.

## Gotchas (these have bitten us)

1. **New dependencies require `npm install` on the server.**
   Only `dist/` is uploaded — `node_modules` is NOT. If a deploy adds a runtime
   dependency, the server crashes with `Cannot find module '<pkg>'` → 502.
   Fix: `npm install --omit=dev` on the server, then restart.
   (Plain `npm install` works now — the old eslint peer conflict that required
   `--legacy-peer-deps` was fixed.)

2. **Env files are bundled into `dist/common/envs/`**, not read from `src/`.
   `nest-cli.json`'s `assets: ["common/envs/*"]` copies them in at build time,
   and `app.module.ts` loads them via `${__dirname}/common/envs` (→ `dist/common/envs`
   in prod, `src/common/envs` in dev). Do NOT change that back to `process.cwd()`.
   - Keep BOTH `.env` and `development.env` set to the **AWS production values**
     before building for prod. If you point `development.env` at localhost for
     local dev, that localhost copy gets bundled into `dist` — don't deploy it.
   - Symptom of env not loading: TypeORM `ECONNREFUSED 127.0.0.1:5432`
     (DATABASE_HOST undefined → pg defaults to localhost).

## Local development
- API: `npm run start:dev` (watch mode; auto-frees port 3000).
- To hit a local API+DB, set `development.env` to localhost values — but revert
  to AWS values before building a prod `dist`.

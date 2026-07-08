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
   - **If dependencies changed** (anything in `package.json`), ALSO upload
     `package.json` and `package-lock.json` to the project root — otherwise the
     server's `npm install` runs against stale metadata (see gotcha #1).
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

1. **New dependencies require uploading the package files AND `npm install` on the server.**
   Only `dist/` is uploaded by default — `node_modules`, `package.json`, and
   `package-lock.json` are NOT. So a dependency change has two failure modes:
   - If you skip `npm install`: server crashes with `Cannot find module '<pkg>'` → 502.
   - If you run `npm install` but didn't upload the new `package.json`/`package-lock.json`:
     it resolves against the STALE package.json and may fail (e.g. an old peer
     conflict reappears) or install the wrong versions.
   Fix: upload `package.json` + `package-lock.json` to the project root, THEN
   `npm install --omit=dev`, then restart. With the current package.json, plain
   `npm install` resolves cleanly (the old eslint v7 peer conflict is fixed in v8);
   only a stale server package.json brings that conflict back.

2. **Env files are bundled into `dist/common/envs/`**, not read from `src/`.
   `nest-cli.json`'s `assets: ["common/envs/*"]` copies them in at build time,
   and `app.module.ts` loads them via `${__dirname}/common/envs` (→ `dist/common/envs`
   in prod, `src/common/envs` in dev). Do NOT change that back to `process.cwd()`.
   - Keep BOTH `.env` and `development.env` set to the **AWS production values**
     before building for prod. If you point `development.env` at localhost for
     local dev, that localhost copy gets bundled into `dist` — don't deploy it.
   - Symptom of env not loading: TypeORM `ECONNREFUSED 127.0.0.1:5432`
     (DATABASE_HOST undefined → pg defaults to localhost).

3. **`JWT_SECRET` must be set in the env file.** The signing secret is loaded
   from `JWT_SECRET` (not hardcoded). `constants.ts` throws at startup if it's
   missing, so the app won't boot without it. Changing the value invalidates all
   existing tokens → every user is logged out and must re-log in. Keep the same
   value across deploys unless you intend to force a global logout.

## Local development
- API: `npm run start:dev` (watch mode; auto-frees port 3000).
- To hit a local API+DB, set `development.env` to localhost values — but revert
  to AWS values before building a prod `dist`.

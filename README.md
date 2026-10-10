# Bidder — frontend

Next.js 16 (App Router) client for the Bidder auction platform. It talks to the backend only
through the API gateway (`backend/api-gateway`), authenticating with the gateway's `token` cookie.

Requires Node.js 20.9+.

## Configuration

One variable, read in `lib/config.ts`:

| Variable                   | Purpose                                       | Local                   | Production                  |
| -------------------------- | --------------------------------------------- | ----------------------- | --------------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | API gateway base URL, no trailing slash       | `http://localhost:8080` | e.g. `https://api.your-domain.com` |

`NEXT_PUBLIC_*` values are **inlined into the browser bundle at build time**. Changing the
API URL means rebuilding, and one build or image serves exactly one API URL.

| File                     | Committed | Used by                                                       |
| ------------------------ | --------- | ------------------------------------------------------------- |
| `.env.development`       | yes       | `npm run dev`; points at `http://localhost:8080`               |
| `.env.production`        | yes       | `npm run build`; intentionally has no URL (see below)          |
| `.env.example`           | yes       | Reference for every variable                                  |
| `.env*.local`, `.env`    | no        | Per-machine overrides and anything secret                     |

A production build fails immediately with a clear error if `NEXT_PUBLIC_API_BASE_URL` isn't set,
so a bundle pointing at nothing (or at localhost) can't ship by accident.

## Local development

```bash
npm install
npm run dev          # http://localhost:3000 → API at http://localhost:8080
```

Start the backend first (gateway on `:8080`). The gateway's CORS allows exactly one origin
(`client.url`, `http://localhost:3000` in its local profile), so run the frontend on port 3000.

To point at a different API locally, create `.env.development.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://192.168.1.20:8080
```

Other scripts: `npm run lint`, `npm run typecheck`.

## Production

### Node server

```bash
NEXT_PUBLIC_API_BASE_URL=https://api.your-domain.com npm run build
npm start            # or: node .next/standalone/server.js (copy .next/static and public in first)
```

### Docker

```bash
docker build --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.your-domain.com -t bidder-frontend .
docker run -p 3000:3000 bidder-frontend
```

The image uses Next's standalone output, runs as a non-root user, and listens on `PORT`
(default 3000).

### Hosting platforms (Vercel etc.)

Set `NEXT_PUBLIC_API_BASE_URL` as a **build-time** environment variable in the project settings.

## Backend settings that must match production

These live in the gateway's config, not here, but the frontend breaks without them:

- **`client.url`**: set it to the frontend's production origin (e.g. `https://app.your-domain.com`).
  It's the only origin CORS allows.
- **`cookies.secure: true`**: required on HTTPS.
- **`cookies.httpOnly: true`**: the frontend never reads the `token` cookie, so there's no reason
  to expose it to JavaScript. The local profile has `false`.
- **Same site**: serve the frontend and gateway from the same registrable domain
  (`app.your-domain.com` + `api.your-domain.com`). With `sameSite: Lax` the auth cookie is only
  sent on same-site requests. Putting them on unrelated domains would need `SameSite=None`, and
  browsers increasingly block those third-party cookies anyway.

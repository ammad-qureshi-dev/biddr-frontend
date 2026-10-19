# Bidder — frontend

Next.js 16 (App Router) client for the Bidder auction platform. It talks to a single backend, the
monolith in `backend/application`, authenticating with its `token` cookie.

Requires Node.js 20.9+.

## Configuration

One variable, read in `next.config.ts`:

| Variable  | Purpose                                                    | Local                   | Production                                  |
| --------- | ---------------------------------------------------------- | ----------------------- | ------------------------------------------- |
| `API_URL` | Backend monolith base URL (proxied at /api), no trailing slash | `http://localhost:8080` | `https://bidder-application.onrender.com` |

The browser never calls the backend directly: it calls `/api/*` on the frontend's own origin and
Next proxies those requests to `API_URL`. That keeps the auth cookie first-party (the frontend and
backend are on different `onrender.com` subdomains, which browsers treat as separate sites). The
rewrite is **fixed at build time**, so changing the URL means rebuilding, and one build or image
serves exactly one backend.

`API_GATEWAY_URL` and `NEXT_PUBLIC_API_BASE_URL` are the pre-monolith names and still work as
fallbacks, but `API_URL` wins when it's set (including from the committed `.env.*` files).

| File                     | Committed | Used by                                                       |
| ------------------------ | --------- | ------------------------------------------------------------- |
| `.env.development`       | yes       | `npm run dev`; points at the local monolith (`:8080`)         |
| `.env.production`        | yes       | `npm run build`; points at the deployed monolith              |
| `.env.example`           | yes       | Reference for every variable                                  |
| `.env*.local`, `.env`    | no        | Per-machine overrides and anything secret                     |

A build-time `API_URL` (CI, `--build-arg`, `.env.production.local`) overrides `.env.production`.
A production build fails with a clear error if no URL is set.

### Backend routes

The monolith keeps the old gateway's URL layout, so API paths in `lib/api.ts` are unchanged:
`/identity-and-auth/**`, `/catalog/**` and `/bidding/**` are served by the monolith itself, and
`/notification/**` is forwarded to notification-service, which is still a separate deployment.

Deployed (Render):

| Service       | URL                                              |
| ------------- | ------------------------------------------------ |
| Client        | https://biddr-frontend.onrender.com              |
| Monolith      | https://bidder-application.onrender.com          |
| Notification  | https://bidder-notification-service.onrender.com |

## Local development

```bash
npm install
npm run dev          # http://localhost:3000 → API at http://localhost:8080
```

Start the monolith first (`backend/application`, profile `local`, port 8080) and notification-service
on 8081 if you need the inbox. `API_URL` is read when `next dev` starts, so restart it after
changing the value.

To point at a different backend, create `.env.development.local`:

```bash
API_URL=http://192.168.1.20:8080
```

Other scripts: `npm run lint`, `npm run typecheck`.

## Production

### Node server

```bash
API_URL=https://api.your-domain.com npm run build
npm start            # or: node .next/standalone/server.js (copy .next/static and public in first)
```

### Docker

```bash
docker build --build-arg API_URL=https://api.your-domain.com -t bidder-frontend .
docker run -p 3000:3000 bidder-frontend
```

The image uses Next's standalone output, runs as a non-root user, and listens on `PORT`
(default 3000).

### Hosting platforms (Vercel etc.)

Set `API_URL` as a **build-time** environment variable in the project settings.

## Backend settings that must match production

These live in the monolith's config (`application-prod.yaml`), not here, but the frontend breaks without them:

- **`client.url`**: set it to the frontend's production origin (e.g. `https://app.your-domain.com`).
  It's the only origin CORS allows.
- **`cookies.secure: true`**: required on HTTPS.
- **`cookies.httpOnly: true`**: the frontend never reads the `token` cookie, so there's no reason
  to expose it to JavaScript. The local profile has `false`.
- **Same site**: serve the frontend and backend from the same registrable domain
  (`app.your-domain.com` + `api.your-domain.com`). With `sameSite: Lax` the auth cookie is only
  sent on same-site requests. Putting them on unrelated domains would need `SameSite=None`, and
  browsers increasingly block those third-party cookies anyway.

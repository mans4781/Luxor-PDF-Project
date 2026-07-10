---
name: Deployment NODE_ENV pitfall
description: Replit autoscale deployments do not set NODE_ENV=production automatically; prod-gated code silently disables.
---

Replit autoscale deployments run the artifact's `start` command with NODE_ENV **unset** — nothing sets it to "production" automatically.

**Why:** The Clerk proxy middleware (and any `NODE_ENV === "production"` gate) silently no-ops in the published app, so `/api/__clerk/*` fell through to Express 404 and the sign-in page hung forever with no error.

**How to apply:**
- The api-server `start` script defaults NODE_ENV to production via `NODE_ENV="${NODE_ENV:-production}"`; the dev script's `export NODE_ENV=development` still wins in dev. Keep this pattern for any new server artifact.
- Diagnostic tell: if deployment logs are pino-pretty/colorized instead of JSON, the deployed server is NOT in production mode.
- A fast (1–2 ms) 404 on a proxied path with the cors `access-control-allow-credentials` header = request fell through the proxy mount into Express's own 404, i.e. the proxy middleware is inactive — not an upstream 404.
- Never customize clerkProxyMiddleware away from the skill's canonical template (it warns about this); resync it instead — the template gains load-bearing fixes over time (e.g. response buffering because the deployment edge rejects chunked responses).

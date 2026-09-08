# Security posture

## Implemented

| Area | Control |
|------|---------|
| Authentication | Stateless JWT (HS384), access + refresh tokens, configurable TTL; refresh rejected for disabled accounts |
| Password storage | BCrypt, work factor 12 |
| Brute force | `LoginAttemptLimiter` — 5 failed logins per username → 15-minute lock (single-node, in-memory) |
| Authorisation | `@PreAuthorize` permission check on **every** mutating endpoint; `RequirePermission` in the UI only hides controls — the backend is authoritative |
| RBAC | 8 roles / 43 fine-grained permissions, seeded as reference data (`V2__rbac_baseline.sql`) |
| Transport of errors | No stack traces, messages or binding errors leaked (`server.error.include-* = never`); uniform `ApiError` contract |
| CSRF | Not applicable — stateless, token in `Authorization` header, no cookies |
| CORS | Origin **patterns**, env-driven (`CORS_ALLOWED_ORIGINS`); defaults to `http://localhost:[*]` for dev only — **must be locked down per environment** |
| SQL injection | All queries are JPQL / parameterised; no string-built SQL |
| Mass assignment | Request DTOs everywhere; JPA entities are never bound to request bodies |
| Sensitive data | Result/report documents are served only through authenticated, permission-checked endpoints; no public/guessable document URLs |
| Auditing | Every sensitive operation writes an append-only `audit_log` row (actor, action, before/after snapshot, IP, user-agent) |
| Actuator | Only `health` and `info` exposed; health shows no component/detail |
| Secrets | `JWT_SECRET`, DB credentials, `IRD_*` are environment variables; `application-local.yml` is git-ignored; nothing committed |
| Financial integrity | All money is computed by a single server-side calculator; invoices immutable once issued; refunds require a separate approver (segregation of duties) |

## Deploy checklist

- [ ] Set a strong `JWT_SECRET` (≥ 32 bytes, e.g. `openssl rand -base64 48`)
- [ ] Set `CORS_ALLOWED_ORIGINS` to the exact frontend origin(s)
- [ ] Run behind TLS (terminate at the load balancer / reverse proxy)
- [ ] Use a dedicated DB user with least privilege; not `root`
- [ ] Point the app at a managed MySQL with backups and at-rest encryption
- [ ] Review and disable the `local`/`dev` profile so `DevDataSeeder` does not run
- [ ] Rotate the seed passwords / delete seed accounts

## Known limitations / future work

- Login throttle is per-node in memory — move to Redis for multi-node.
- No refresh-token revocation list (logout is client-side only); add a denylist if server-side revocation is required.
- IRD / CBMS integration is **not implemented or certified** — see [README](README.md#ird--e-billing).
- Rate limiting is only on login; consider a global API rate limit at the gateway.

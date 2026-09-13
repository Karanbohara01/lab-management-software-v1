# Environment variables

Every setting the backend reads, grouped by concern. All of them have a dev-safe default in
`backend/src/main/resources/application.yml` (`${VAR:default}` syntax) — nothing here is
*required* to run the app locally; the ones marked **required in production** only need setting
when you actually deploy. Every optional integration (IRD, SMS, WhatsApp, eSewa, Khalti) stays
honestly disabled — transmitting nothing — until its variables are set; see each feature's own
gateway class for the exact behavior when unconfigured.

Every one of these integration settings is this **deployment's shared fallback only**. Any clinic
can set its own credentials from Settings → Laboratory profile, which take priority over these
values for that clinic alone — a clinic that never configures anything keeps using whatever is set
here, unchanged.

## Core

| Variable | Default | Notes |
|---|---|---|
| `SERVER_PORT` | `8080` | The backend's HTTP port. The frontend's Vite dev proxy defaults to `8088` — either change one to match the other, or set this explicitly when running locally outside Docker. |
| `SPRING_PROFILES_ACTIVE` | `local` | Set to anything other than `local` (e.g. `docker`) in any real deployment — `local` only disables the dev data seeder, but leaving it unset is easy to mistake for "no profile set." No `application-docker.yml`/`application-prod.yml` file exists or is needed; every setting is already externalised here. |
| `DB_URL` | `jdbc:mysql://localhost:3307/lims?...` | Full JDBC URL. The `docker-compose.prod.yml` backend service points this at its own `mysql` container automatically. |
| `DB_USERNAME` / `DB_PASSWORD` | `lims` / `lims` | **Change the password in production.** |
| `JWT_SECRET` | a throwaway dev-only string | **Required in production** — generate a real one, e.g. `openssl rand -base64 48`. Anyone who knows this can forge valid login tokens. |
| `CRYPTO_KEY` | a throwaway dev-only string, published in this repo's `application.yml` | **Required in production** — generate with the same command as `JWT_SECRET` above, but use a *different* value. Encrypts every clinic's own payment/IRD/SMS/WhatsApp credentials at rest (`np.com.lims.common.crypto.CryptoService`, AES-256-GCM). Changing this after clinics have saved their own credentials makes those saved values permanently unreadable — treat it like a real secret, back it up, never rotate casually. |
| `JWT_ACCESS_TTL` / `JWT_REFRESH_TTL` | `PT30M` / `P7D` | ISO-8601 durations. |
| `APP_PUBLIC_URL` | `http://localhost:5173` | The real, user-facing URL of the deployed frontend. Used to build links sent in outbound SMS/WhatsApp report notifications and as the default for Khalti's `website_url`/return URL. **Required in production.** |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:[*]` | Comma-separated origin patterns. Set to your real frontend origin(s) in production — the dev default allows any localhost port, which is far too permissive to ship. |

## Backups (मन्दायी — दफा ६(ढ)/८(घ) of the e-invoice procedure)

| Variable | Default | Notes |
|---|---|---|
| `BACKUP_DIRECTORY` | `./backups` | Where the nightly/on-demand database dump is written. In `docker-compose.prod.yml` this is a named volume (`lims_backups`) mounted at `/backups` — don't lose that volume, it's the only copy. |
| `BACKUP_CRON` | `0 0 2 * * *` (2am daily) | Standard Spring cron expression. |

Backups are **data-only** (no schema) — restoring means letting Flyway recreate the schema on a
fresh database first, then loading the backup file into it. See
`np.com.lims.backup.DatabaseBackupService`'s class javadoc for the full explanation and a
verified restore procedure.

## Subscription billing (what a clinic owes THIS deployment, not its own patients)

| Variable | Default | Notes |
|---|---|---|
| `SUBSCRIPTION_BILLING_CRON` | `0 30 2 * * *` (2:30am daily) | Runs `np.com.lims.platform.SubscriptionBillingService`'s daily sweep: issues each clinic's next billing-period invoice once its current period ends, marks unpaid invoices overdue past their due date, and suspends an organization (blocking login — see `AuthService`) after a further 14 days of continued non-payment. Collected via the eSewa credentials below — a clinic's OWN eSewa/Khalti account (per-clinic override) is never used to pay the platform, only for that clinic's own patient billing. A platform admin can also trigger the sweep on demand: `POST /platform/billing/run-sweep`. |

## IRD / CBMS e-billing

| Variable | Default | Notes |
|---|---|---|
| `IRD_ENABLED` | `false` | Nothing is transmitted until this is `true` AND every other `IRD_*` value below is set. |
| `IRD_ENVIRONMENT` | *(blank → shown as "LIVE")* | Free-text label shown in the UI (`TEST`/`LIVE`) — doesn't change behavior. |
| `IRD_BASE_URL` | `https://cbapi.ird.gov.np` | CBMS's real base URL — same URL for sandbox and live traffic; what changes is the credentials below. |
| `IRD_USERNAME` / `IRD_PASSWORD` | *(blank)* | Your IRD Taxpayer Login credentials — **not** a separate API key. |
| `IRD_SELLER_PAN` | *(blank)* | Must exactly match the PAN tied to the login above, or every submission is rejected. |

Being able to submit here does **not** by itself mean you're officially registered with IRD for
e-billing — that registration (Anusuchi-1/2/3 of the procedure) is a separate paperwork process
you do directly with IRD.

## SMS / WhatsApp report delivery

| Variable | Default | Notes |
|---|---|---|
| `SMS_ENABLED` | `false` | Nothing is transmitted until this is `true` AND `SMS_BASE_URL`/`SMS_API_KEY`/`SMS_FROM` are all set. |
| `SMS_PROVIDER` / `SMS_BASE_URL` / `SMS_API_KEY` / `SMS_FROM` | *(all blank, `SMS_BASE_URL` defaults to Sparrow SMS's documented v2 endpoint)* | `SparrowSmsGateway` — **not fully live-verified**: the documented endpoint (`api.sparrowsms.com/v2/sms/`) returned a bare `404` on a live connectivity check (2026-09-11); confirm the real working URL from a real Sparrow account's own dashboard before enabling in production (see the gateway's javadoc). |
| `WHATSAPP_ENABLED` | `false` | Nothing is transmitted until this is `true` AND `WHATSAPP_PHONE_NUMBER_ID`/`WHATSAPP_ACCESS_TOKEN` are both set. |
| `WHATSAPP_PHONE_NUMBER_ID` / `WHATSAPP_ACCESS_TOKEN` | *(blank)* | `WhatsAppCloudApiGateway` (Meta WhatsApp Business Cloud API) — built from Meta's published API reference but **not live-tested**: unlike the other integrations here, Meta's Cloud API has no anonymous/shared sandbox, so send one real test message from a verified Business account's own dashboard before enabling in production. |
| `WHATSAPP_API_VERSION` | `v20.0` | |

## Online payment — eSewa

| Variable | Default | Notes |
|---|---|---|
| `ESEWA_ENABLED` | `false` | This is also the ONLY account `PlatformEsewaClient` uses to collect recurring subscription billing from clinics (see the Subscription billing section above) — it matters for platform revenue even if every clinic ends up configuring its own eSewa for patient billing. |
| `ESEWA_ENVIRONMENT` | `TEST` | Label only. |
| `ESEWA_FORM_ACTION` | eSewa's public UAT form endpoint | Switch to the production endpoint (`https://epay.esewa.com.np/...`) for real traffic. |
| `ESEWA_VERIFY_BASE_URL` | eSewa's public UAT status-check endpoint | Same — switch to production for real traffic. |
| `ESEWA_MERCHANT_CODE` | `EPAYTEST` | eSewa's published UAT merchant code — genuinely still works against their sandbox as of 2026-09-10 (verified live). Use your real merchant code in production. |
| `ESEWA_SECRET_KEY` | eSewa's published UAT secret key | Same caveat — real merchant key required for production. |

## Online payment — Khalti

| Variable | Default | Notes |
|---|---|---|
| `KHALTI_ENABLED` | `false` | |
| `KHALTI_ENVIRONMENT` | `TEST` | Label only. |
| `KHALTI_BASE_URL` | `https://dev.khalti.com/api/v2` | Sandbox. Switch to Khalti's production base URL for real traffic. |
| `KHALTI_SECRET_KEY` | *(blank — no default)* | **Khalti no longer publishes a shared sandbox key** (confirmed live 2026-09-10: an older commonly-documented value now gets a real 401). Sign up at `test-admin.khalti.com` (OTP `987654`) for a sandbox `live_secret_key`, or use a real merchant key from `admin.khalti.com` for production. |
| `KHALTI_WEBSITE_URL` | `${APP_PUBLIC_URL}` | Usually leave this alone — it defaults to the same public URL as everything else. |

## Docker Compose specifics (`docker-compose.prod.yml` only)

| Variable | Default | Notes |
|---|---|---|
| `DB_ROOT_PASSWORD` | *(required, no default)* | The MySQL root password — only the prod compose file's `mysql` service uses this (not the app itself). |
| `HTTP_PORT` | `80` | The host port the frontend/nginx container is published on. |

See `.env.prod.example` for a ready-to-copy template of everything above.

# Pathology & Laboratory Management System (LIMS)

Production-grade Laboratory Information Management System for diagnostic centers in Nepal.

## Stack

| Layer     | Technology |
|-----------|-----------|
| Frontend  | React 18, TypeScript (strict), Vite, Tailwind CSS, React Router, Redux Toolkit, React Hook Form, Zod, Axios |
| Backend   | Java 21, Spring Boot 3.4, Spring Web, Spring Data JPA, Spring Security, Bean Validation, JWT |
| Database  | MySQL 8, Flyway migrations |
| Infra     | Docker Compose (MySQL + Adminer) |

## Repository layout

```
backend/      Spring Boot API (layered: controller / service / repository / entity / dto)
frontend/     React + Vite SPA (feature-oriented)
docker-compose.yml
```

## Phase status

- [x] **Phase 1 — Foundation**: monorepo, Docker DB, JWT auth, RBAC, global error handling, design system, app shell
- [x] **Phase 2 — Patients, Doctors, Departments, Test Catalog, Lab Orders** (MRN/order sequencing, nested test parameters + reference/critical ranges, server-authoritative order pricing engine with discount/tax, DRAFT→CONFIRMED→CANCELLED state machine, audit, RBAC)
- [x] **Phase 3 — Laboratory Workflow** (samples + Code128 barcodes + tracking timeline, department result queues, reference-range resolution & abnormal/critical flagging, `PENDING→ENTERED→VERIFIED→APPROVED` results with amendment history, consolidated report generation from approved results with print/PDF layout + release/delivery tracking, editable laboratory profile / letterhead)
- [x] **Phase 4 — Billing** (draft invoices from confirmed orders, adjustable discount/tax, per-fiscal-year immutable invoice numbering, partial/full payments with overpayment guard, controlled refunds with request→approve segregation of duties, backend-authoritative money via the shared pricing engine)
- [x] **Phase 5 — IRD / e-Billing integration layer** (isolated `IrdGateway` port, `UnconfiguredIrdGateway` transmits nothing, per-invoice submission tracking auto-created on issue, honest states `NOT_SUBMITTED/PENDING/SUBMITTED/ACCEPTED/FAILED/DUPLICATE/CANCELLED`, per-attempt log, no auto-retry / no resubmit past success, "record as manually filed" path, invoice-cancel cascade). **Not IRD-registered or certified** — architecture only.
- [x] **Phase 6 — Inventory** (suppliers, stock items by category, batches with expiry, FEFO issue, signed stock-movement ledger with running balance, computed EXPIRED/OUT/LOW/EXPIRING/IN-STOCK status + alert strip, batch adjust/discard, purchase orders → submit → receive-into-inventory)
- [x] **Phase 7 — Administration** (audit log UI with before/after diff, user & role management, live dashboard KPIs, operational notifications with topbar bell + scheduled sweeps, analytics — revenue trend / tests by department / top tests / referrals)
- [~] Phase 8 — Quality pass: **route code-splitting, vendor chunking, modal focus-trap, skip link, login brute-force lock, actuator hardening, SECURITY.md, Testcontainers auth/RBAC integration test, more unit tests** done; formal a11y/perf audit + full code/security review outstanding

## Getting started (local dev)

### 1. Start infrastructure

```bash
docker compose up -d
```

MySQL is exposed on `localhost:3306` (db `lims`, user `lims` / `lims`), Adminer on http://localhost:8081.

### 2. Backend

```bash
cd backend
cp src/main/resources/application-local.yml.example src/main/resources/application-local.yml   # then edit secrets
./mvnw spring-boot:run
```

API: http://localhost:8080/api  •  Flyway migrations run automatically on boot (schema + dev seed).

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Public landing page: http://localhost:5173/  •  Application: http://localhost:5173/app  •  Sign in: http://localhost:5173/login

## Seed accounts (development only)

All seed users have password **`Passw0rd!`**. Seed users are created by `DevDataSeeder`, which runs
**only** under the `local` / `dev` Spring profiles. RBAC (roles/permissions) is reference data in
Flyway migration `V2__rbac_baseline.sql`.

| Username        | Role                     |
|-----------------|--------------------------|
| `superadmin`    | SUPER_ADMIN              |
| `labadmin`      | LAB_ADMINISTRATOR        |
| `reception`     | RECEPTIONIST             |
| `technician`    | LAB_TECHNICIAN           |
| `pathologist`   | PATHOLOGIST              |
| `accountant`    | ACCOUNTANT               |
| `collector`     | SAMPLE_COLLECTION_STAFF  |

## Deployment

`docker-compose.prod.yml` builds and runs the whole stack (backend + frontend + MySQL) from this
repo's own `backend/Dockerfile` / `frontend/Dockerfile`:

```bash
cp .env.prod.example .env.prod   # fill in real values — see docs/ENVIRONMENT.md
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

See `docs/ENVIRONMENT.md` for every environment variable this app reads, what it does, and what
happens if it's left unset (every optional integration — IRD, SMS, WhatsApp, eSewa, Khalti —
stays honestly disabled until configured). `.github/workflows/ci.yml` builds and tests both
sides (including a Docker image build) on every push/PR.

`docker-compose.yml` (no `-prod` suffix) stays for local dev — just the MySQL + Adminer
containers, running the app itself via `./mvnw spring-boot:run` / `npm run dev` for fast reload.

## IRD / e-Billing

**This system is not IRD-registered or certified — being able to submit here does not by itself
mean official IRD registration exists.** That registration (Anusuchi-1/2/3 of the e-invoice
procedure) is a separate paperwork process done directly with IRD. The integration itself is real
and verified live against IRD's CBMS sandbox:

- `IrdGateway` port (`np.com.lims.ird.gateway`) is the single seam. Invoice creation and payments
  never call it — submission is a separate, explicit action, so a slow/unavailable IRD service can
  never block billing.
- `UnconfiguredIrdGateway` is the active bean until `IRD_ENABLED=true` and every `IRD_*` credential
  is set — every attempt before that is logged as a transport error with a clear message, never a
  silent fake success. `CbmsIrdGateway` is the real implementation, including a verified Bikram
  Sambat date conversion (`np.com.lims.common.calendar.BikramSambatCalendar`) CBMS requires.
- A per-invoice tracking record is created when an invoice is **issued** (state
  `NOT_SUBMITTED → PENDING → SUBMITTED/ACCEPTED/FAILED/DUPLICATE/CANCELLED`); every attempt is
  recorded with request/response status. Resubmission past a successful/duplicate state is blocked.
- Cancelling an invoice that was already filed with IRD flags a credit note as needed — filing it
  (reversing the original bill with IRD) is, again, a separate explicit action.
- Bills can be marked as **filed manually** via the IRD portal when the integration is unavailable.

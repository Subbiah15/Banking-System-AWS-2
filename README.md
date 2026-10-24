# Banking System

A simulated, full-stack banking platform built to demonstrate clean architecture,
correct money handling (double-entry ledger), security, and a real deployment.

> ⚠️ Simulated bank — no real money. Cards/payments use **Stripe test mode** (added in Phase 4).

- **Backend:** Java 21, Spring Boot 3.5, Spring Security, JPA, PostgreSQL, Redis, Kafka, Flyway, springdoc/OpenAPI
- **Frontend:** React 19 + TypeScript, Vite, Tailwind CSS, React Query, React Router
- **Infra:** Docker Compose (Postgres + Redis + Kafka), GitHub Actions CI, Testcontainers

See [`PROJECT_PLAN.md`](./PROJECT_PLAN.md) for the full architecture and phased roadmap.

## Project status

- **Phase 0 — Scaffold & infra ✅**
- **Phase 1 — Auth & users ✅** — registration, login, JWT access + rotating
  refresh tokens (Redis), RBAC, demo customer profiles and admin-managed customer creation.
- **Phase 2 — Accounts & ledger ✅** — open accounts, deposits/withdrawals on a
  **double-entry ledger** (balanced debit/credit entries, `BigDecimal`, pessimistic
  locking, running balance), dashboard + account detail UI with transaction history.
- **Phase 3 — Transfers & beneficiaries ✅** — account-to-account transfers with
  **idempotency keys** (a retried request never double-spends), saved payees, transfer UI.
- **Phase 4 — Cards & payments ✅** — tokenized **virtual cards** (one-time PAN, freeze/cancel,
  monthly spend limits), card purchases that debit the account, and **account top-ups** through a
  **Stripe**-or-simulated payment gateway (idempotent fulfilment).
- **Phase 5 — Loans & interest ✅** — demo loan applications, admin approval that
  generates an **amortization schedule** and disburses the principal, installment **repayments**,
  and a **scheduled job** that flags overdue installments. All disbursements/repayments flow
  through the ledger. Loans UI + (admin) approvals panel.
- **Phase 6 — Notifications & audit ✅** (current) — **event-driven** via **Kafka**: services
  publish domain events that independent consumers turn into in-app **notifications** (+ email)
  and an append-only **audit log**. Notifications bell + page; admin audit viewer.

Remaining roadmap: observability and deployment.

### Notifications & Audit API (Phase 6)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/v1/notifications` | bearer | List my notifications |
| GET | `/api/v1/notifications/unread-count` | bearer | Unread count (bell badge) |
| POST | `/api/v1/notifications/{id}/read` `/read-all` | bearer | Mark read |
| GET | `/api/v1/admin/audit` | ADMIN | Recent audit entries |

Domain events flow over Kafka topic `banking.events`; two consumer groups
(`notifications`, `audit`) process every event independently and idempotently (deduped by
`eventId`). Email is **simulated by default**; set `SPRING_MAIL_HOST` (e.g. Mailtrap) for real SMTP.

### Loans API (Phase 5)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/v1/loans` | bearer | Apply for a demo loan |
| GET | `/api/v1/loans` `/{id}` | bearer | List / view loan + amortization schedule |
| POST | `/api/v1/loans/{id}/repay` | bearer | Pay the next installment |
| GET | `/api/v1/admin/loans` | ADMIN | List loans (optional `?status=PENDING`) |
| POST | `/api/v1/admin/loans/{id}/approve` `/reject` | ADMIN | Approve (disburse + schedule) / reject |

Applicants enter an annual interest rate from 0% to 100% when applying; if omitted by older API
clients, the backend uses `app.loans.annual-rate` (default 12%). Equal monthly payments use the
standard amortization formula (`BigDecimal`). A daily `@Scheduled` job marks overdue installments.
Loan summaries show the projected/full-term interest cost and account currency; expanded
amortization schedules show each installment's principal, interest, and total payment.
The application request accepts `annualRatePercent` (for example, `8.5` means 8.5% per year).

### Cards & Payments API (Phase 4)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/v1/cards` | bearer | Issue a virtual card (full number returned once) |
| GET | `/api/v1/cards` | bearer | List my cards |
| POST | `/api/v1/cards/{id}/freeze` `/unfreeze` `/cancel` | bearer | Card lifecycle |
| POST | `/api/v1/cards/{id}/pay` | bearer | Card purchase (debits the account) |
| POST | `/api/v1/payments/top-up` | bearer | Start a top-up (gateway intent) |
| POST | `/api/v1/payments/{id}/confirm` | bearer | Confirm a top-up (simulated gateway) |
| POST | `/api/v1/payments/webhook` | public | Stripe-signed webhook (real mode) |

**Payment gateway:** runs in **simulated** mode by default (no secrets — top-ups confirm via
the `/confirm` endpoint). Set `STRIPE_SECRET_KEY` to switch to **real Stripe test mode**
(PaymentIntents + signature-verified webhooks):

```bash
# .env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
# forward Stripe webhooks to the app, then pay with test card 4242 4242 4242 4242
stripe listen --forward-to localhost:8080/api/v1/payments/webhook
```

### Transfers API (Phase 3)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/v1/transfers` | bearer | Transfer money (send `Idempotency-Key` header) |
| GET | `/api/v1/beneficiaries` | bearer | List saved payees |
| POST | `/api/v1/beneficiaries` | bearer | Save a payee |
| DELETE | `/api/v1/beneficiaries/{id}` | bearer | Delete a payee |

Supplying an `Idempotency-Key` makes a transfer safe to retry: the server posts the
underlying ledger transaction at most once per key.

### Accounts API (Phase 2)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/v1/accounts` | bearer | Open a demo account (CHECKING/SAVINGS, INR by default) |
| GET | `/api/v1/accounts` | bearer | List my accounts |
| GET | `/api/v1/accounts/{id}` | bearer | Get one account |
| POST | `/api/v1/accounts/{id}/deposit` | bearer | Deposit (amount) |
| POST | `/api/v1/accounts/{id}/withdraw` | bearer | Withdraw (amount, no overdraft) |
| GET | `/api/v1/accounts/{id}/transactions` | bearer | Transaction history (newest first) |

Every money movement posts a balanced set of ledger entries (debits + credits net to
zero) against the customer account and a system settlement account, in one DB transaction.

### Auth API (Phase 1)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/v1/auth/register` | public | Create a customer, returns tokens |
| POST | `/api/v1/auth/login` | public | Authenticate, returns tokens |
| POST | `/api/v1/auth/refresh` | public | Rotate refresh token → new pair |
| POST | `/api/v1/auth/logout` | public | Revoke a refresh token |
| GET | `/api/v1/users/me` | bearer | Current user + KYC profile |
| PUT | `/api/v1/users/me/profile` | bearer | Update KYC profile |
| GET | `/api/v1/admin/users` | ADMIN | List all customer profiles |
| POST | `/api/v1/admin/users` | ADMIN | Create customer profile + INR bank account + optional opening deposit |
| POST | `/api/v1/admin/users/{id}/kyc` | ADMIN | Update optional demo profile status (not a banking-action gate) |

**Demo admin** (seeded at startup): `admin@bank.local` / `Admin123!`
(override via `ADMIN_EMAIL` / `ADMIN_PASSWORD`). Five fictional bank customers with funded INR
accounts are seeded when `SEED_DEMO=true`; they all use `Demo123!`:
`demo.sbi@bank.local`, `demo.iob@bank.local`, `demo.hdfc@bank.local`,
`demo.icici@bank.local`, and `demo.axis@bank.local`.
Their sample opening balances are SBI ₹25,000, IOB ₹18,450, HDFC ₹61,200, ICICI ₹38,750,
and Axis ₹94,300.
These are simulations only; they do not connect to SBI, IOB, HDFC, ICICI, or Axis.

## Prerequisites

- Java 21, Maven (the `./mvnw` wrapper is included), Node 20+, Docker.

## Run locally (PowerShell)

The project requires PostgreSQL, Redis, Java 21+, and Node 20+. If using the existing local
PostgreSQL/Redis services, ensure the `banking` database/user exist and Redis listens on `6379`.

Start the backend in PowerShell terminal 1:

```powershell
cd backend
$env:DB_URL = "jdbc:postgresql://localhost:5432/banking"
$env:DB_USERNAME = "banking"
$env:DB_PASSWORD = "banking"
$env:REDIS_HOST = "localhost"
$env:REDIS_PORT = "6379"
$env:EVENTS_ENABLED = "false"
$env:SEED_DEMO = "true"
$env:CORS_ALLOWED_ORIGINS = "http://localhost:5174"
.\mvnw.cmd spring-boot:run
```

Start the frontend in PowerShell terminal 2:

```powershell
cd frontend
npm ci
npm run dev -- --host 127.0.0.1 --port 5174
```

Open <http://localhost:5174/login>. The seeded admin is `admin@bank.local` / `Admin123!`.
Five sample customer accounts use the shared password `Demo123!`; their emails are listed above.
Sign in as a customer to see a funded INR account and try transfers between the sample accounts.
Use only fictional profile details. SBI, IOB, HDFC, ICICI, and Axis are demo labels and do not
connect to those banks.

Check backend health at <http://localhost:8080/actuator/health>. Stop each app with Ctrl+C in its
terminal. To use Docker Compose for local services instead, PostgreSQL is published on host port
5433, while it remains port 5432 inside Docker.

### Run the whole stack in Docker

```bash
docker compose --profile full up --build
```

For seeded sample data with the full local Docker stack, copy `.env.example` to `.env` first; the
Compose backend enables demo seeding by default.

### Observability (local)

```bash
docker compose --profile monitoring up -d   # Prometheus :9090 + Grafana :3000 (admin/admin)
# backend exposes metrics at /actuator/prometheus; Grafana auto-loads the "Banking System" dashboard
```

## AWS deployment

AWS is the only supported deployment target. Alternative hosting-provider configurations have
been removed. Docker Compose remains for local development only.

Recommended production layout:

- **Frontend:** private S3 bucket served through CloudFront; configure SPA fallback to `/index.html`.
- **Backend:** Docker image in Amazon ECR, deployed as an ECS Fargate service behind an Application
  Load Balancer. The ALB health check path is `/actuator/health`.
- **Database:** Amazon RDS for PostgreSQL. Keep it private and allow connections only from the
  backend security group.
- **Refresh-token store:** Amazon ElastiCache for Redis, reachable only from the backend.
- **Secrets and logs:** AWS Secrets Manager for credentials and JWT/third-party keys; CloudWatch
  Logs for application logs.
- **Optional integrations:** Amazon MSK if Kafka events are required; otherwise set
  `EVENTS_ENABLED=false`. Configure SES only if real email delivery is needed.

See [`deploy/aws/README.md`](./deploy/aws/README.md) for the AWS deployment checklist and required
environment variables. The repository does not yet contain AWS infrastructure-as-code or an
automated AWS deployment workflow; provision the AWS resources and configure secrets before
deploying. Do not use the local `.env` file as an AWS secrets store.

## Test

```bash
cd backend && ./mvnw verify   # runs the Testcontainers smoke test (real Postgres)
cd frontend && npm run build  # type-check + production build
```

## Layout

```
backend/     Spring Boot (modular packages under com.bank.*)
frontend/    React + TypeScript (Vite)
docker-compose.yml
.github/workflows/ci.yml
PROJECT_PLAN.md
```

# Banking Simulator

A Java/Spring Boot and React/TypeScript educational banking simulator backed by
PostgreSQL. All identities, balances, account activity, and card activity are fictional.
This is not a bank or payment service: it does not move real money, connect to banks or
payment networks, or generate usable card credentials.

## Safety and scope

- Transfers and card purchases are internal demo-ledger simulations only.
- Virtual cards are display/control objects labelled `SIMULATED`; no PAN, security code,
  payment-network token, or gateway credential is generated or stored.
- Payment-gateway, loan, and KYC-verification APIs/UI have been removed. Historical
  Flyway migrations (including unused legacy columns/tables) remain for compatibility
  rather than rewriting applied migrations; no loan/gateway services or KYC verification
  endpoint is active.
- Use fictional profile data. Never enter a real password, card, or bank credential.

## Current implementation status

The existing application foundation currently provides registration and sign-in with
JWTs, normalized email addresses, password confirmation and visibility controls, account
views and transaction history, account withdrawals, internal transfers and beneficiaries,
owner-initiated simulated deposits into virtual accounts, simulated virtual-card
controls/purchases, profile screens, notifications, and existing admin user/audit screens.
Account deposits update the ledger and are idempotent when retried with the same request
key. The card metadata migration relabels previously created records as simulated.

This is **not yet the complete approved product specification**. In particular, the
password-recovery demonstration and PIN/session controls; recipient lookup, payment
requests, searchable history, and printable receipts; wallet/add-money, recharge, and
bill simulations; savings goals/calculators, budgets, alerts, and reports; full
beneficiary management; card online/contactless controls; notification/preferences
settings and account deactivation; and the approved admin workflows still need end-to-end
implementation and tests. Do not treat these as available capabilities until their UI,
business logic, persistence, validation, error handling, and tests are delivered together.

The authoritative approved scope is [`./.azure/project-plan.md`](./.azure/project-plan.md).
[`PROJECT_PLAN.md`](./PROJECT_PLAN.md) records implementation status and points back to
that scope.

## Stack

- Backend: Java 21, Spring Boot, Spring Security, REST, JPA, PostgreSQL, Flyway.
- Frontend: React, TypeScript, Vite.
- Local infrastructure: Docker Compose (PostgreSQL, Redis, Kafka).

## Run locally

Prerequisites: Java 21, Node.js 20+, Docker, and the included Maven wrapper.
Copy `.env.example` to `.env` and change local development values as needed. Keep the
local `.env` out of source control and never copy its contents into documentation.

Start supporting services from the project directory:

```powershell
docker compose up -d postgres redis kafka
```

Start the backend from the project directory:

```powershell
.\backend\mvnw.cmd -f backend\pom.xml spring-boot:run
```

Install and start the frontend from the project directory:

```powershell
npm --prefix frontend ci
npm --prefix frontend run dev
```

Open the local URL printed by Vite. The API health endpoint is
`http://localhost:8080/actuator/health`. Configure database, Redis, Kafka, JWT, and CORS
settings through environment variables as shown in `.env.example`.

Demo seed users are controlled by `SEED_DEMO`. The documented sample credentials are
for local demonstration only; change them before any shared environment and never use
real user credentials. All sample content is fictional.

## Verification

```powershell
.\backend\mvnw.cmd -f backend\pom.xml test
npm --prefix frontend run build
```

Integration tests that use Testcontainers require Docker. The project plan calls for
additional tests around concurrency/idempotency, wallet flows, savings and budgets,
admin access, persistence, and end-to-end verification; these remain incomplete.

## Repository layout

```text
backend/       Spring Boot API and Flyway migrations
frontend/      React + TypeScript application
deploy/        Deployment documentation and configuration
docs/          Operational and architecture documentation
.azure/        Approved specification and workflow artifacts
```

# Digital Banking & Payments Simulator

## Goal

Replace Project 2's existing product scope with a polished, responsive banking and
payments simulator for education and portfolio demonstration. All identities, balances,
cards, deposits, transfers, recharges, and bill payments are fictional and simulated.
The application is not a bank or payment service.

## Approved technology and workspace

- Backend: Java 21, Spring Boot, Spring Security, REST API, and PostgreSQL.
- Frontend: React, TypeScript, and the existing Vite-based web application.
- Workspace: implement in the existing `Project-2` directory.
- Preserve `.git` and the local `.env` file. Reuse existing code only where it complies
  with this plan. Do not expose secrets or include them in source control.

## Non-goals and safety boundaries

- No real bank integrations, payment gateways, payment networks, real-money movement,
  KYC, document/identity verification, or real card credentials.
- Do not enable or retain an external payment-processing path as part of the simulator.
- Loan origination is outside the requested product scope; savings goals and clearly
  illustrative fixed/recurring-deposit calculators and maturity simulations are in scope.
- Every screen and receipt must identify financial activity as simulated.

## Product scope

1. **Accounts and access:** registration, login/logout, password validation and recovery
   demonstration flow, profile editing, optional demo transaction PIN, session handling,
   onboarding, and fictional evaluator/demo accounts.
2. **Dashboard and accounts:** balance summaries, recent transactions, income/expense
   summaries, quick actions, notifications, multiple virtual savings/current accounts,
   masked demo account identifiers, account history, and transfers between a user's own
   accounts.
3. **Payments and ledger:** simulated user-to-user transfers, recipient lookup by demo
   username/payment ID, review and confirmation, unique references, payment requests,
   incoming/outgoing history with search and filters, transaction details, and printable
   or downloadable simulated receipts.
4. **Wallet and bill/recharge simulator:** demo wallet balance and history, add-money
   simulation, wallet-to-wallet transfers, sample mobile recharge and utility bill flows,
   and explicit simulation confirmations.
5. **Beneficiaries:** create, edit, nickname, select, and remove saved demo recipients;
   validate identifiers and show recent recipients.
6. **Savings and personal finance:** savings goals and progress, reminders, clearly
   illustrative fixed/recurring-deposit calculators and maturity simulations, budgets,
   category limits and alerts, categorization, charts, comparisons, and date-range reports.
7. **Virtual cards:** fictional masked card visuals, nickname/status, freeze/unfreeze,
   simulated limits and online/contactless controls, and sample transactions; never create
   payment-network credentials.
8. **Notifications, settings, and security:** notification history/read/clear actions,
   profile and password/PIN changes, theme/language/notification preferences, session
   information, logout, and demo-account deactivation.
9. **Administration:** server-enforced role permissions, demo-user management, aggregate
   simulated transaction reporting, account suspension/reactivation, suspicious-activity
   review, seed-data management, and append-only auditable administrative corrections.

## Architecture and data integrity

- Keep UI, API, and financial business rules separated using the existing Java/Spring
  Boot and React/TypeScript architecture where appropriate.
- PostgreSQL is authoritative for identities, profiles, virtual accounts, wallets,
  beneficiaries, transactions, ledger entries, payment requests, savings goals, budgets,
  cards, notifications, sessions, and admin audit events.
- Use server-side validation, authorization, uniqueness constraints, and consistent API
  errors. Never rely on browser storage as the source of balances or transaction history.
- Process balance-changing operations atomically, protect against concurrent spending,
  require positive amounts and sufficient funds, and make repeated requests idempotent.
- Record immutable transaction/audit history. Failed operations must not debit funds;
  reversals/refunds must create linked ledger entries.
- Store passwords and PINs only as secure hashes; do not log secrets.

## Delivery phases

1. **Specification alignment:** inspect the current app, retain compliant foundation,
   remove out-of-scope payment/loan behavior, and establish the simulator's shared design
   system, navigation, accessibility, and simulation disclosures.
2. **Identity and virtual accounts:** implement user registration/authentication,
   profile/session flows, demo data, virtual accounts, and a live dashboard.
3. **Ledger and transfers:** complete atomic ledger operations, own-account and
   user-to-user transfers, beneficiaries, payment requests, transaction history, and
   receipts.
4. **Wallet simulations:** implement wallet operations, sample bill payments and
   recharges, and their transaction records.
5. **Savings and analytics:** add goals, deposit calculators/simulations, budgets,
   categories, alerts, and reports.
6. **Cards, notifications, and settings:** implement simulated card controls, notification
   center, preferences, security controls, and account deactivation.
7. **Administration and quality:** complete role-protected admin workflows and audit
   events; verify responsive behavior, accessibility, error/empty/loading states, and
   end-to-end consistency.
8. **Delivery readiness:** update README, example environment configuration, database
   initialization/seed instructions, architecture and API documentation, tests,
   deployment/restart guidance, troubleshooting, and backup/restore instructions.

## Verification

Add or update tests for authentication and authorization; valid/invalid and insufficient
funds transfers; duplicate and concurrent requests; failed operations and reversals;
wallet/recharge flows; ledger and transaction-history consistency; admin access controls;
and persistence across restarts. Run the focused backend and frontend checks after each
relevant phase, then run the available complete test/build checks before completion.

Do not claim a feature is complete until its interface, business logic, persistence,
validation, error handling, and relevant tests work together. Clearly label any remaining
incomplete capability as a placeholder.

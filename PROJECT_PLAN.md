# Project scope and implementation status

The approved product specification is [`./.azure/project-plan.md`](./.azure/project-plan.md).
That file is authoritative; this status note does not replace or amend the approval.

Project 2 is a **fictional banking simulator**. Real payment gateways, real-money
movement, payment-network credentials, identity verification, and loan origination are
out of scope. Gateway, loan application, and identity-verification behavior has been
removed; historical Flyway migrations (including unused legacy schema) remain for
compatibility with databases that have already applied them.

The existing Java/Spring Boot + React/TypeScript + PostgreSQL foundation is retained.
The full approved feature set is not yet complete. See the current implementation and
explicitly incomplete features in [`README.md`](./README.md); do not mark an item done
until UI, business logic, persistence, validation, error handling, and relevant tests
work together.

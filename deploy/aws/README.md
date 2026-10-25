# AWS deployment

This is a fictional simulator, not a banking/payment service. Do not configure a
payment gateway, accept real payment details, or use real customer financial data.

AWS is the only production deployment target. This guide describes the recommended layout; it
does not provision resources. This repository currently includes neither AWS infrastructure as
code nor an automated AWS deployment workflow.

## Architecture

- **Frontend:** build the Vite app and publish `frontend/dist` to a private S3 bucket. Serve it
  with CloudFront using Origin Access Control (OAC), HTTPS, and a custom error response that
  serves `/index.html` for SPA routes. Use an ACM certificate in `us-east-1` for CloudFront.
- **Backend:** build `backend/Dockerfile`, push the image to Amazon ECR, and run it on ECS Fargate
  behind an Application Load Balancer. Set the target group's health-check path to
  `/actuator/health`.
- **Database:** Amazon RDS for PostgreSQL, in private subnets. Permit inbound PostgreSQL only from
  the backend task security group.
- **Refresh tokens:** Amazon ElastiCache for Redis, reachable only from backend tasks. Enable
  encryption in transit and authentication where supported by the selected engine/configuration.
- **Secrets and logs:** store passwords and signing keys in AWS Secrets Manager and send
  application logs to CloudWatch Logs. Grant the ECS task role access only to the secrets it needs.
- **Optional integrations:** use Amazon MSK if Kafka-backed notifications/audit are required. If
  Kafka is not provisioned, set `EVENTS_ENABLED=false`. Configure SES only if outbound email is
  required.

Place the Fargate tasks, RDS database, and Redis in private subnets. Expose only the load balancer
to the internet. Use security groups to allow ALB-to-task traffic and task-to-database/cache
traffic; do not make RDS or Redis publicly accessible.

## Backend environment

Configure these as ECS task environment variables. Put credentials and cryptographic
secrets in Secrets Manager and reference them from the task definition instead of plain-text
environment values.

| Variable | Value |
|---|---|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `DB_URL` | `jdbc:postgresql://<rds-endpoint>:5432/<database>?sslmode=require` |
| `DB_USERNAME` / `DB_PASSWORD` | RDS application user and password |
| `REDIS_HOST` / `REDIS_PORT` | ElastiCache primary endpoint and port |
| `REDIS_PASSWORD` | ElastiCache auth token, if configured |
| `REDIS_SSL` | `true` when the ElastiCache configuration uses TLS |
| `JWT_SECRET` | Unique random value of at least 32 characters |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Your admin identity and strong initial password |
| `SEED_DEMO` | `false` for a deployment with your own data |
| `CORS_ALLOWED_ORIGINS` | Exact HTTPS CloudFront or custom frontend origin |
| `EVENTS_ENABLED` | `false` unless Kafka/MSK is configured |
| `SPRING_KAFKA_BOOTSTRAP_SERVERS` | Required only when Kafka is enabled |

The database user must be allowed to create/use the schema objects required by Flyway migrations.
Apply migrations through the application's normal startup process and verify the result before
directing production traffic to the service.

## Frontend build and publish

`VITE_API_BASE_URL` is compiled into the browser bundle; set it in the frontend build environment
to the public HTTPS API origin before building:

```powershell
cd frontend
$env:VITE_API_BASE_URL = "https://<your-api-domain>"
npm ci
npm run build
```

Publish the generated `frontend/dist` directory to S3 and configure CloudFront to use the private
bucket as its origin. Never put backend secrets in Vite variables: all `VITE_*` values are public
to browser users.

## Pre-traffic checks

1. Confirm the ECS service is healthy and `/actuator/health` returns `{"status":"UP"}`.
2. Confirm HTTPS, the frontend API URL, and the backend CORS allow-list use the correct origins.
3. Verify RDS and Redis are private and can only be reached from the backend security group.
4. Verify CloudWatch logs contain no passwords, tokens, or payment secrets.
5. Use your own admin credentials; disable demo seeding and rotate the initial admin password.
6. Configure backups, retention, monitoring, alarms, and a tested restore procedure before using
   real customer data.

This application is a simulated banking demonstration, not a licensed banking system or a
production-ready financial service. Do not use it to store real customer financial data or process
real money without a separate security, compliance, and operational review.

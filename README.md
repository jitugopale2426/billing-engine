# Billing Engine

A SaaS subscription and billing backend built for The Fast Way technical assignment. Handles plans, subscriptions, usage tracking, invoice generation, and automated background jobs.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| NestJS | Backend framework |
| TypeORM | ORM — migrations only, no synchronize |
| PostgreSQL | Main database |
| Redis | Caching + job queue store |
| BullMQ | Background job processing |
| Docker Compose | Single command startup |

---

## Quick Start

Make sure Docker Desktop is running first.
```bash
git clone https://github.com/jitugopale2426/billing-engine.git
cd billing-engine
npm install
docker-compose up -d
npm run migration:run
npm run start:dev
```

Open Swagger docs at `http://localhost:3000/api/docs`

Bull Board dashboard at `http://localhost:3000/admin/queues`

---

## Project Structure
```
src/
├── plans/           → pricing plans CRUD
├── customers/       → customer management + webhook support
├── subscriptions/   → subscription lifecycle management
├── invoices/        → invoice generation with line items
├── usage/           → usage tracking vs plan limits
├── stats/           → admin dashboard (MRR, active subs)
├── jobs/            → BullMQ background processors
├── common/          → interceptors, filters, pagination, webhook service
└── database/        → TypeORM migrations
```

---

## API Endpoints

### Plans
```
POST   /plans          → create plan
GET    /plans          → list all (paginated)
GET    /plans/active   → public active plans list (Redis cached)
GET    /plans/:id      → single plan
PATCH  /plans/:id      → update plan
DELETE /plans/:id      → delete plan (blocked if subscriptions exist)
```

### Customers
```
POST   /customers      → create customer
GET    /customers      → list all (paginated)
GET    /customers/:id  → single customer
PATCH  /customers/:id  → update customer (supports webhook_url)
DELETE /customers/:id  → soft delete (data retained for billing history)
```

### Subscriptions
```
POST   /subscriptions                → subscribe customer to plan
GET    /subscriptions                → list all (paginated)
GET    /subscriptions/:id            → single subscription with plan + customer
GET    /subscriptions/customer/:id   → all subscriptions for a customer
PATCH  /subscriptions/:id/cancel     → cancel subscription
```

### Invoices
```
GET    /invoices/customer/:id  → list invoices by customer (paginated)
GET    /invoices/:id           → single invoice with line items
PATCH  /invoices/:id/pay       → mark invoice as paid (mock)
```

### Usage
```
POST   /usage                          → record a usage event
GET    /usage/:subscriptionId/summary  → current usage vs plan limits (Redis cached 30s)
```

### Stats
```
GET    /stats/admin  → total active subscriptions, MRR, overdue invoice count (Redis cached 2min)
```

### Admin
```
GET    /admin/queues  → Bull Board dashboard for monitoring background jobs
```

---

## Background Jobs

All jobs follow the BullMQ pattern — @Cron only enqueues, processor does the work:
```
@Cron (scheduler)
    ↓
BullMQ Queue
    ↓
@Process (worker) → actual logic runs here
```

| Job | Schedule | What it does |
|---|---|---|
| Renewal | Daily midnight | Finds subscriptions due today → mock payment → generate invoice → advance period |
| Overdue Checker | Every 6 hours | Finds issued invoices past due date → marks overdue → sets subscription past_due |
| Cleanup | Daily 1am | Finds past_due subscriptions beyond grace period → cancels them |

### Mock Payment
- Configurable success rate via `PAYMENT_SUCCESS_RATE` env var (default 80%)
- 3 retry attempts with exponential backoff — 5s, 10s, 20s
- Success → invoice generated + billing period advanced
- Failure → subscription marked past_due

---

## Database Design

### 6 Entities

| Entity | Notes |
|---|---|
| plans | Feature limits stored as JSONB |
| customers | Soft delete, webhook_url support |
| subscriptions | Composite index on status + renewal date |
| invoices | Tracks subtotal, tax, total in paise |
| invoice_line_items | One per invoice line |
| usage_events | Composite index for fast aggregation |

### Indexes
```
idx_plan_is_active            → plans list query
idx_customer_email            → customer lookup by email
idx_sub_next_renewal          → renewal job daily query
idx_sub_status_renewal        → composite — status + renewal date
idx_usage_sub_resource_time   → composite — usage summary aggregation
idx_invoice_due_date          → overdue checker query
idx_invoice_subscription_id   → invoice lookup by subscription
```

### FK Constraints
```
subscriptions → customers       CASCADE
subscriptions → plans           RESTRICT (cannot delete plan with active subs)
usage_events  → subscriptions   CASCADE
invoices      → subscriptions   CASCADE
invoice_line_items → invoices   CASCADE
```

---

## Redis Caching

| What | Key | TTL |
|---|---|---|
| Active plans list | plans:active | Invalidated on plan create/update |
| Admin stats | stats:admin | 2 minutes |
| Usage summary | usage:{subscriptionId} | 30 seconds |

---

## Webhook Notifications (Bonus)

Customers can store a `webhook_url`. When an invoice is generated, the system automatically sends a POST request to that URL with the invoice payload.
```json
{
  "event": "invoice.generated",
  "timestamp": "2026-03-15T11:12:00.190Z",
  "data": {
    "invoice_id": "...",
    "invoice_number": "INV-2026-000001",
    "subscription_id": "...",
    "amount": 353882,
    "status": "issued"
  }
}
```

Webhook failures are logged but do not affect invoice generation.

---

## Unit Tests (Bonus)
```bash
npm test
```

Tests cover the renewal processor:
- Enqueues job for each active subscription due
- Does not enqueue when no subscriptions due
- Generates invoice on payment success
- Marks subscription past_due on payment failure
- Returns early when subscription not found

---

## Architectural Decisions

**TypeORM over Prisma** — Assignment required TypeORM. Used migrations only, synchronize is always false.

**Offset pagination over cursor** — Admin views need to jump to specific pages. Data is not real-time streamed. Simpler total count display for frontend.

**Price stored in paise** — All amounts are bigint in smallest currency unit. Avoids floating point precision issues in billing calculations.

**Soft delete on customers and subscriptions** — Billing history and invoices must be retained even after deletion. Data is never physically removed.

**BullMQ over direct cron** — @Cron only schedules, BullMQ processor handles logic. Gives retry support, visibility via Bull Board, and decoupled processing.

---

## Trade-offs

- No authentication — endpoints are currently open. JWT guards would be added in production.
- MRR is recalculated per request — cached for 2 minutes. A running counter would be more efficient at scale.
- Mock payment has no persistent retry state — retries are handled by BullMQ attempts config.

---

## What I Would Add With More Time

- JWT authentication with role-based guards
- Plan upgrade/downgrade with prorated invoice generation
- Usage-based billing tier for overage charges
- Rate limiting on public endpoints
- End-to-end tests with a test database

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| PORT | 3000 | App port |
| DB_HOST | localhost | PostgreSQL host |
| DB_PORT | 5432 | PostgreSQL port |
| DB_USERNAME | billing_user | Database username |
| DB_PASSWORD | billing_pass | Database password |
| DB_NAME | billing_engine | Database name |
| REDIS_HOST | localhost | Redis host |
| REDIS_PORT | 6379 | Redis port |
| GRACE_PERIOD_DAYS | 7 | Days before past_due sub is cancelled |
| PAYMENT_SUCCESS_RATE | 0.8 | Mock payment success probability |
| TAX_RATE | 0.18 | Invoice tax rate (18% GST) |
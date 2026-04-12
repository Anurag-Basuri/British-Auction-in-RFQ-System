# British Auction RFQ System - Backend Architecture Documentation

This document serves as the comprehensive guide to the architecture, data flow, error handling, and implementation details of the robust Node.js backend for the British Auction RFQ System.

---

## 1. High-Level Architecture

The system is built on a modern **Node.js + Express + TypeScript** stack, specifically engineered for strict typing, scalability, and predictable failure handling. It adheres to a rigorous **Controller-Service-Router** architectural pattern.

### The Stack & Infrastructure
*   **API Framework:** Express.js (v4)
*   **Language:** TypeScript (Strict Mode)
*   **Database ORM:** Prisma
*   **Database Engine:** PostgreSQL (Hosted via Supabase Connection Pooler)
*   **In-Memory Store:** Redis (Hosted via Upstash via `rediss://` TLS)
*   **Background Jobs:** BullMQ
*   **Real-time Synchronization:** Socket.IO
*   **Validation:** Zod

> [!TIP]
> **Bootstrapped Resilience:** The application uses a "Lazy-Loading Boot Sequence". In `src/index.ts`, `bootstrap()` pings both Postgres and Redis. If Redis is down, it gracefully skips booting BullMQ to prevent infinite console spam, but allows the HTTP API to still boot up. 

---

## 2. Directory Structure & Domain Modules

The codebase strictly isolates responsibilities to prevent "fat controllers" and maintain pristine, testable business logic.

```text
src/
├── config/       # Environment parsing (env.ts via Zod)
├── controllers/  # Orchestrates requests (extracts parameters, calls Service, sends Response)
├── lib/          # External connections (Prisma client, Redis instance, Socket.IO, Pino logger)
├── middleware/   # Express Middlewares (Validation, Auth Guards, Error Interceptors)
├── routes/       # Endpoint definitions & Middleware mapping
├── scheduler/    # BullMQ Queues and Background Workers (Reverse auction closures)
├── services/     # Pure Business Logic & Database operations
└── utils/        # Global utilities (ApiResponse, ApiError, asyncHandler)
```

---

## 3. Data Flow Execution

Whenever a client requests an API (e.g., Submitting a new Bid), the process flows linearly through exactly 5 guarded checkpoints:

1.  **Incoming Request (Express):** Global middlewares invoke `helmet` (Security Headers), `express-rate-limit`, and `pino` (Structured Logging).
2.  **Router (`routes/bid.routes.ts`):** 
    *   Hits `authenticate` middleware (Validates JWT Bearer via Supabase secret).
    *   Hits `validateRequest(bidSchema)` middleware. Zod evaluates the JSON body. If it fails, execution halts and returns a structured `400 Bad Request`.
3.  **Controller (`controllers/bid.controller.ts`):** 
    *   No HTTP business logic lives here. The controller hands the clean parameters to the Service Layer.
4.  **Service (`services/bid.service.ts`):**
    *   Heavy lifting occurs here. Queries Prisma to verify RFQ status (`ACTIVE`), checks timestamps against the closure triggers.
    *   If business rules fail, it manually throws `new ApiError(404, "RFQ Expired")`.
    *   If successful, saves to Postgres, emits a real-time event via `lib/socket.ts`, and recalculates potential Time Extensions.
5.  **Response Wrapper:**
    *   Controller catches the result and returns `new ApiResponse(201, result, "Bid Created")`.

---

## 4. Advanced Error Handling & API Response Standardization

The most powerful aspect of this architecture is how it eliminates boilerplate `try/catch` and non-uniform JSON responses.

### The `asyncHandler` Wrapper
Every route controller is wrapped in `import { asyncHandler } from '../utils/asyncHandler.js'`. 
If a promise rejects anywhere in the service layer, `asyncHandler` instantly captures it and forwards it to Express's `next(err)`.

### Global Error Interceptor
In `middleware/error.middleware.ts`, an overriding `.use()` intercepts ALL crashes:
*   **Zod Errors:** Unpacked into a beautifully structured array (e.g., `{ email: "Required" }`).
*   **ApiErrors:** Identifies expected business logic violations and returns the specific status code given in the Service.
*   **Unknown Exceptions:** Converts to `500 Server Error` but prevents Node from crashing.

### The Standard Envelope
The frontend always receives the exact same JSON shape on **every** request, guaranteed:
```json
{
  "success": boolean,
  "data": object | null,
  "message": string,
  "errors": object | array | null
}
```

---

## 5. Security & Validation

*   **Authentication Flow:** Follows stateless JWT design. `auth.controller.ts` issues a signed JWT (`access_token`). The frontend attaches it as `Authorization: Bearer <token>`. The `authenticate` middleware decodes this and injects `req.user` downward.
*   **Zod Validation Guard:** Handlers never write manual `if (!req.body.price)` checks. Data models are strictly modeled in Zod.

---

## 6. Real-Time Interactions (The Reverse Auction Logic)

Because buyers and suppliers need to combat sniper-bids, the backend operates highly asynchronous time logic.

### Dynamic Auction Extensions
During `Bid` insertion (`bid.service.ts`):
1.  The system calculates `time_remaining = close_time - now`.
2.  If the bid happens inside the `trigger_window_mins` and matches the `TriggerType` (e.g., It's the Lowest Bid `L1_CHANGE`), the RFQ's `close_time` automatically increases by `extension_mins`.
3.  An `ExtensionLog` is dynamically written to maintain the audit trail history.

### BullMQ Background Schedulers
A traditional `setTimeout` would be erased if the Node Server restarted. 
1.  **Queue (`scheduler/queue.ts`):** When an RFQ is created or extended, we `auctionQueue.remove('rfq_X')` and recreate an `auctionQueue.add(...)` with the exact millisecond delay until closure.
2.  **Worker (`scheduler/worker.ts`):** BullMQ runs entirely in the background synced to Upstash Redis. The exact millisecond the delay expires, the worker triggers `rfqService.closeAuction(rfqId)`.
3.  **WebSockets:** Inside the worker, `Socket.IO` blasts an `auction_closed` event to all connected frontends, instantly locking the UI.

---

## 7. Configuration Details

The system leverages `zod` to fiercely guard the environment load. If `.env` is missing strings or ports, `config/env.ts` explicitly halts the server with a boot error.

*   `DATABASE_URL`: Connection pooler (Port 6543) for fast runtime queries.
*   `DIRECT_URL`: Isolated pipeline (Port 5432) explicitly for `npx prisma db push`.
*   `REDIS_URL`: Parsed natively by `ioredis` for securely maintaining TLS connections to the queue engine.

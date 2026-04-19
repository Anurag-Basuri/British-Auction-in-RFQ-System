# British Auction RFQ System - Backend Architecture Documentation

This document serves as the comprehensive guide to the architecture, data flow, telemetry handling, and implementation details of the highly scalable Node.js backend for the British Auction RFQ System.

---

## 1. High-Level Architecture & Scalability

The system is built on a modern **Node.js + Express + TypeScript** stack, specifically engineered for strict typing, horizontal horizontal scalability, and predictable failure handling. It adheres to a rigorous **Controller-Service-Router** architectural pattern.

### The Stack & Infrastructure
*   **API Framework:** Express.js (v4)
*   **Language:** TypeScript (Strict Mode)
*   **Database ORM:** Prisma
*   **Database Engine:** PostgreSQL (Hosted via Supabase Connection Pooler)
*   **In-Memory Store:** Redis (Hosted via Upstash via `rediss://` TLS)
*   **Background Jobs:** BullMQ
*   **Real-time Synchronization:** Socket.IO with `@socket.io/redis-adapter`
*   **Validation:** Zod

> [!TIP]
> **Bootstrapped Resilience:** The application uses a "Lazy-Loading Boot Sequence" in `src/index.ts`. `bootstrap()` pings both Postgres and Redis. If Redis is down, it gracefully pauses BullMQ queues to prevent infinite console spam but allows the HTTP API to safely boot up. 

---

## 2. Directory Structure & Domain Modules

The codebase strictly isolates responsibilities to prevent "fat controllers" and maintain pristine, testable business logic.

```text
src/
├── config/       # Environment parsing (env.ts via Zod) ensuring types at runtime
├── controllers/  # Orchestrates requests (extracts parameters, forwards to Service, sends Response)
├── lib/          # External infrastructure (Prisma, Redis, Socket.IO adapter, Pino logger)
├── middleware/   # Express Middlewares (JWT Guards, Rate Limiting, Error Interceptors)
├── routes/       # Endpoint definitions & Schema mapping
├── scheduler/    # BullMQ Queues and Background Workers (Reverse auction closures)
├── services/     # Pure Business Logic, Transactions, & Idempotency checks
└── utils/        # Global utilities (ApiResponse, ApiError, asyncHandler)
```

---

## 3. Data Flow & Transactional Safety

Whenever a client triggers an API (e.g., Submitting a new Bid), the process flows linearly through 5 synchronous checkpoints:

1.  **Incoming Request (Express):** Global middlewares invoke `helmet` (Security Headers), `rate-limit`, and structured routing.
2.  **Router (`routes/bid.routes.ts`):** 
    *   Hits `authenticate` middleware (Validates JWT Bearer).
    *   Hits `validateRequest(bidSchema)` middleware. Zod evaluates the JSON. If it fails, execution halts and returns a structured `400 Bad Request`.
3.  **Controller (`controllers/bid.controller.ts`):** 
    *   Isolates HTTP transport from business logic. Passes the `client_bid_id` and payload strictly down.
4.  **Service (`services/bid.service.ts`):**
    *   **Idempotency Locks:** Queries Postgres via `prisma.$transaction`. Identifies if the `client_bid_id` matches a previous network retry. If found, safely returns the previous state instead of crashing with a duplicate constraint error.
    *   If business rules fail, it manually throws `new ApiError(404, "RFQ Expired")`.
    *   Calculates dynamic Time Extensions and records the causal string into the `ExtensionLog` for audit trails.
5.  **Response Wrapper:**
    *   Controller catches the Prisma transaction buffer and completes the HTTP response.

---

## 4. Unbreakable Error Resilience & Telemetry

The system was heavily audited to eliminate silent node crashes, ensuring standard errors are readable and fatal errors execute failsafe commands. 

### Global Error Interceptor (`error.middleware.ts`)
Instead of ugly server traces leaking to the client, an overriding component intercepts all Node processes:
*   **Zod Errors:** Automatically flattened down to clean readable arrays (e.g., `errors: ["freight_charges: Required field"]`).
*   **Prisma Client Faults:** Dynamically traps logic failures. `P2002` failures generate clean `400 Duplicate Constraint` HTTP responses. `P2025` queries translate into safe `404 Not Found` messages rather than 500 stacks. 
*   **JWT Errors:** Explicitly converts `JsonWebTokenError` class traces into standard 401 Unauthorized API states, allowing logging boundaries to process them as client errors, not system failures.

### High Availability Failsafe Shutdown (`index.ts`)
The server actively traps `uncaughtException` and `unhandledRejection` hooks natively. 
If an arbitrary malfunction threatens the container, the backend utilizes `gracefulShutdown()` to:
1. Lock Express and stop listening to new ports.
2. Notify `Socket.IO` clients to disconnect.
3. Pause active `BullMQ` workers (so jobs aren't corrupted mid-flight).
4. Unpack `Prisma` database channels.
5. Command Node to exit gracefully.

---

## 5. Execution Floor: Real-Time Synchronization 

Because suppliers need to respond instantly to competitive pricing shifts on the Terminal Floor, horizontally scalable web-sockets drive the architecture. 

### The Redis Adapter Setup (`lib/socket.ts`)
Since standard Socket.io breaks inside multi-node Kubernetes clusters (or edge deployments), the architecture leverages `@socket.io/redis-adapter` bridged over an `ioredis` multiplex. When an RFQ triggers an extension on *Server Pod 1*, the `broadcastToRfq` command actually fires a Redis PUB/SUB trace, forcing *Server Pod 2* and *Server Pod 3* to push the websocket update to their respective connected merchants concurrently.

### 6. Background Scheduling Mechanics
A traditional `setTimeout` would be erased if the Node Server rebooted dynamically. Instead, closure triggers are strictly managed off-thread:
1.  **Queue Injection:** When an active RFQ fluctuates limits, we `auctionQueue.remove('rfq_X')` and insert a new delay timestamp onto the Redis pool.
2.  **Stateless Worker:** BullMQ processes the expiration delay entirely in the background synced to Upstash Redis. The exact millisecond the delay expires, the worker triggers `rfqService.closeAuction(rfqId)`.
3.  **Broadcast Pipeline:** Inside the worker, `Socket.IO` blasts the `AUCTION_CLOSED` signal out over the Redis Pub/Sub channels to physically lock the supplier interface buttons for all clients globally.

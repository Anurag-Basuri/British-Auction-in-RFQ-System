# British Auction RFQ System - Backend Architecture Documentation (Go)

This document serves as the comprehensive guide to the architecture, data flow, telemetry handling, and implementation details of the highly scalable Go backend for the British Auction RFQ System.

---

## 1. High-Level Architecture & Scalability

The system is built on a modern **Go (Golang)** stack, specifically engineered for extreme concurrency, strict typing, horizontal scalability, and predictable failure handling. It adheres to a rigorous **Clean Architecture / Domain-Driven Design (DDD)** pattern.

### The Stack & Infrastructure
*   **Language:** Go 1.22+
*   **API Framework:** `go-chi/chi` (Standard library compatible)
*   **Database ORM:** GORM (`gorm.io/gorm`)
*   **Database Engine:** PostgreSQL (Hosted via Supabase Connection Pooler)
*   **In-Memory Store:** Redis (`github.com/redis/go-redis/v9`)
*   **Background Jobs:** Asynq (`github.com/hibiken/asynq`)
*   **Real-time Synchronization:** Gorilla WebSockets (`github.com/gorilla/websocket`) + Redis Pub/Sub
*   **Validation:** Go Playground Validator (`github.com/go-playground/validator/v10`)

> [!TIP]
> **Bootstrapped Resilience:** The application uses structured initialization in `cmd/api/main.go`. It initializes the database, the Redis connection, the Asynq worker server, and the HTTP server independently. It features graceful shutdown with context timeouts to prevent abruptly killed connections.

---

## 2. Directory Structure & Domain Modules

The codebase strictly isolates responsibilities to maintain pristine, testable business logic.

```text
backend/
├── cmd/
│   └── api/          # Application entry point (main.go)
├── internal/
│   ├── api/
│   │   ├── handlers/ # HTTP Handlers (extracts parameters, validates DTOs, calls Services)
│   │   ├── middleware/# Auth (JWT), Role (RBAC), CORS, Error handling
│   │   └── router.go # Endpoint definitions
│   ├── config/       # Environment parsing (env.go) ensuring validation at startup
│   ├── domain/       # Core domain models (User, Rfq, Bid) & Enums
│   ├── repository/   # Data Access Layer (GORM interfaces and implementation)
│   ├── service/      # Pure Business Logic, Transactions, & Extension Engine
│   ├── websocket/    # Real-time Hub, Client connections, and Redis Pub/Sub
│   └── worker/       # Asynq Tasks and Handlers (Reverse auction closures)
├── pkg/
│   ├── errors/       # Generic API Error structs
│   └── utils/        # Global utilities (JSON Decode and Validate)
```

---

## 3. Data Flow & Transactional Safety

Whenever a client triggers an API (e.g., Submitting a new Bid), the process flows linearly:

1.  **Incoming Request:** Global middlewares invoke Logger, Recoverer, and CORS.
2.  **Router (`internal/api/router.go`):** 
    *   Hits `AuthMiddleware` (Validates JWT Bearer).
    *   Hits `RequireRole` middleware.
3.  **Handler (`internal/api/handlers/bid_handler.go`):** 
    *   Uses `utils.DecodeAndValidate` to parse the payload into a strictly-typed DTO (`PlaceBidRequest`). If it fails, returns a structured 400 Bad Request.
4.  **Service (`internal/service/bid_service.go`):**
    *   **Idempotency & Transactions:** Queries Postgres via `gorm.DB.Transaction`. Checks the `client_bid_id` to prevent duplicate network retries.
    *   Evaluates dynamic Time Extensions using the `AuctionService`.
    *   Creates the Bid, updates the RFQ, and creates an Extension Log all within the atomic transaction.
5.  **Post-Transaction Side Effects:**
    *   Broadcasts updates to WebSockets.
    *   Reschedules the Asynq closure job if the auction was extended.
6.  **Response Wrapper:**
    *   Handler completes the HTTP response with a standardized JSON envelope.

---

## 4. Unbreakable Error Resilience & Security

The system was fully audited and re-engineered to eliminate vulnerabilities:

### Security Enhancements
*   **Bcrypt Hashing:** Passwords are never stored in plaintext. They are automatically hashed via a GORM `BeforeSave` hook on the `User` model.
*   **Strict OAuth Verification:** Google Sign-In strictly validates the audience against `GOOGLE_CLIENT_ID` to prevent Confused Deputy attacks.

### Global Error Interceptor
*   A centralized `middleware.HandleError` ensures no raw system traces leak to the client.
*   Validation errors from `validator/v10` are flattened into clean, readable arrays.

### Graceful Shutdown (`main.go`)
The server traps `SIGINT` and `SIGTERM`. Upon shutdown:
1. Signals the HTTP server to stop accepting new requests via `srv.Shutdown(ctx)`.
2. Signals the Asynq worker server to finish executing active jobs.
3. Closes the PostgreSQL connection pool.

---

## 5. Execution Floor: Real-Time Synchronization 

Because suppliers need to respond instantly to competitive pricing shifts, horizontally scalable web-sockets drive the architecture. 

### The Redis Pub/Sub Setup (`internal/websocket/hub_impl.go`)
Standard WebSockets break in multi-node clusters. This architecture leverages Gorilla WebSockets bridged over Redis Pub/Sub. When an RFQ triggers an extension on *Server Instance 1*, it publishes to the `british_auction_rfq_events` Redis channel. All other server instances receive this message and instantly push the websocket update to their respective connected merchants concurrently.

### 6. Background Scheduling Mechanics (Asynq)
Closure triggers are managed off-thread using `hibiken/asynq`:
1.  **Queue Injection:** When an active RFQ fluctuates limits, we execute `queueSvc.ScheduleClosure(rfqId, delayMs)`. This automatically overwrites any pending job for that specific RFQ ID.
2.  **Stateless Worker:** Asynq processes the expiration delay in the background via Redis. The exact millisecond the delay expires, `ClosureHandler.ProcessTask` fires.
3.  **Premature Fire Protection:** If the worker fires early due to clock drift, it calculates the remaining time and dynamically reschedules itself.
4.  **Broadcast Pipeline:** Inside the worker, `wsHub.BroadcastAuctionClosed` blasts the closure signal across Redis Pub/Sub to lock the supplier interface globally.

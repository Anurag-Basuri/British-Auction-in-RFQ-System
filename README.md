# Enterprise British Reverse Auction Platform (RFQ System)

An industry-grade, real-time Reverse Auction platform engineered to facilitate highly competitive B2B sourcing and procurement. Suppliers compete in live, transparent reverse auctions where price and position dynamically update via WebSocket technology. 

Designed for enterprise scale, this platform mathematically enforces auction integrity, handles sub-second bidding contention, and autonomously manages complex time-extension dynamics (British Auctions) without manual intervention.

---

## ⚡ Core Features

- **Real-Time Live Bidding Arenas:** Sub-second latency utilizing **Gorilla WebSockets** bridged over **Redis Pub/Sub** for instantaneous bid unshifting, live timer updates, and contextual leaderboard recalculations. Optimistic UI updates guarantee zero perceived latency for the bidder.
- **Dynamic Auction Extensions (British Mechanics):** Built-in "British Auction" mechanics. If a supplier places a competitive bid within the final `X` minutes (the Trigger Window), the auction autonomously extends by `Y` minutes. This entirely prevents "auction sniping" and encourages true market-value price discovery.
- **Intelligent Scheduling Engine:** Powered by **Redis & Asynq**. The system schedules pinpoint accurate closures using background workers that evaluate state and cleanly transition auction statuses from `ACTIVE` to `CLOSED`. Heavy state modifications are offloaded from the main HTTP request flow.
- **Unique Competitor Leaderboards:** Advanced frontend filtering drops raw bid logs replacing them with true unique competitor mapping, eliminating psychological spoofing from opponents.
- **Premium Glassmorphic UX/UI:** Frontend designed with deep midnight dark-mode aesthetics, custom CSS variable tokens, Framer Motion staggered micro-animations, and exact-dimension skeleton loading states targeting zero layout shifts.
- **Operational UX Controls:** Features aggressive tooling without rule violations. Buyers have a `Force Finalize Market` protocol to freeze auctions manually without breaching maximum limits. Suppliers utilize `-1%`, `-5%`, and `-10%` Quick Action desks for calculated edge-attacks.
- **Strongly Typed Data Fortresses:** End-to-end type safety. Data flows securely from the PostgreSQL Database (via GORM), through Go validation handlers, across the wire, and directly into the Next.js Client `useQuery` hooks.
- **Authentication & RBAC:** Features strict Google OAuth One-Tap sign on alongside Bcrypt-hashed Email/Password protocols. Strict topological separation. **Buyers** can create and monitor auctions, **Suppliers** can bid and scan markets via the Execution Terminal.

---

## 🏗️ Technology Stack

### Backend Infrastructure
| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Language** | Go (Golang 1.22+) | High-performance, concurrent, statically typed backend |
| **API Framework** | go-chi/chi | Standard-library compatible HTTP routing |
| **Database** | PostgreSQL | Relational transactional integrity |
| **ORM** | GORM | Code-first schema management and queries |
| **Message Broker** | Redis | In-memory datastore for fast Socket/Queue bridging |
| **Job Scheduler** | Asynq | Reliable, recurring, and delayed background execution |
| **Real-Time Engine** | Gorilla WebSockets | High-throughput concurrent socket connections |
| **Validation** | validator/v10 | Runtime payload verification (DTOs) |

### Frontend Architecture
| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router) | React framework and routing infrastructure |
| **UI Library** | React 19 | Component lifecycle and DOM management |
| **Server State** | TanStack React Query v5 | Data fetching, caching, synchronization, and optimistic updates |
| **Form Control** | React Hook Form | Performant, uncontrolled form validation without re-renders |
| **Styling** | TailwindCSS v4 | Utility-first CSS styling |
| **Animations** | Framer Motion | Spring-physics based micro-interactions |
| **API Client** | Axios | Configured with Interceptors for global auth token injection |

---

## 📂 Repository Structure

The architecture is strictly divided into a scalable mono-repo, with the primary backend written in Go and the legacy Node.js backend preserved for reference.

For deep technical analysis of how data flows through the Go backend, review our localized architecture document:
- 👉 **[Backend Architecture Documentation](./backend/ARCHITECTURE.md)** — Covers dependency injection, transactions, worker orchestration, and scaling.

```text
british-auction-rfq/
├── backend/                  # (Active) High-Performance Go Backend
│   ├── cmd/api/              # Application entry point (main.go)
│   ├── internal/
│   │   ├── api/              # Route handlers (Controllers) and Middlewares
│   │   ├── config/           # Environment parsing
│   │   ├── domain/           # Core models (User, Rfq, Bid)
│   │   ├── repository/       # Data Access Layer (GORM interfaces)
│   │   ├── service/          # Core business logic (Extension Engine, Bidding logic)
│   │   ├── websocket/        # Real-time Hub, connections, and Redis Pub/Sub
│   │   └── worker/           # Asynq Tasks (Auction closures)
│   └── pkg/                  # Shared utilities and error handling
│
├── backend-node-deprecated/  # (Legacy) Original Express.js Implementation
│
└── frontend/                 # React / Next.js Client
    ├── src/
    │   ├── app/              # Next.js App Router Pages & Layouts
    │   ├── providers/        # Tanstack React Query & Auth global Context Providers
    │   ├── services/         # Typed fetching wrappers mapping exactly to backend DTOs
    │   └── lib/              # Axios API client interceptor logic & Socket client singleton
    └── scratch/              # Contains frontend E2E integration test scripts
```

---

## 🚀 Setup & Installation

### Prerequisites
Before initializing the platform, verify your host machine has:
- **Go** v1.22.0 or higher (for the backend)
- **Node.js** v18.0.0 or higher (for the frontend)
- **PostgreSQL** instance (Local or hosted)
- **Redis** instance (Local or hosted)

### 1. Backend Configuration & Boot Sequence

Initialize the backend first. The Go backend will automatically detect your PostgreSQL database and auto-migrate the schema for you on boot.

You must configure the `.env` file in the `backend` directory.

```env
# backend/.env
PORT=8000
NODE_ENV=development

DATABASE_URL="postgres://postgres:password@localhost:5432/british_auction?sslmode=disable"
REDIS_URL="redis://localhost:6379"

JWT_SECRET="YOUR_SECURE_RANDOMLY_GENERATED_STRING_MINIMUM_16_CHARS"
GOOGLE_CLIENT_ID="your_google_cloud_oauth_client_id.apps.googleusercontent.com"
```

Boot the server:
```bash
cd backend

# Download all Go dependencies
go mod tidy

# Start the server (which will also connect to DB and Redis)
go run cmd/api/main.go
```
Wait to see: `Connected to PostgreSQL database successfully` and `Server starting on :8000`.

### 2. Frontend Configuration & Boot Sequence

Open an independent terminal. The frontend environment dictates its connection paths via `.env.local`.

```env
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_cloud_oauth_client_id.apps.googleusercontent.com
```

Boot the client:
```bash
cd frontend
npm install

# Next.js will launch on http://localhost:3000
npm run dev
```

---

## 🛡️ Security, Authentication & Fault Tolerance

### Authentication Flow
We utilize stateless JWT (JSON Web Tokens).
- **Backend:** The `AuthMiddleware` verifies the JWT signature and injects the authenticated `Claims` payload into the Request Context lifecycle. Google Logins strictly validate against the configured Client ID to prevent Confused Deputy vulnerabilities.
- **Frontend:** An Axios Request Interceptor autonomously extracts the JWT from browser `localStorage` and attaches it as a `Bearer` header to every single outgoing HTTP request.

### Centralized Exception Handling
We enforce a strict `APIError` taxonomy. If a validation fails, or an Unauthorized event occurs, the backend sends a tightly formatted JSON envelope. The frontend Axios Response Interceptor catches `401 Unauthorized` responses and broadcasts an application-wide Window Event. The React `AuthProvider` captures this event, instantly purges local state, and forcibly redirecting the user to `/auth/login` to prevent stale data leaks.

### Transactional Safety
When a bid is placed, the backend uses `gorm.DB.Transaction` to wrap the idempotency check, price validation, auction extension evaluation, and log insertion into a single atomic commit, guaranteeing zero race conditions during high-contention auction closures.

---

## 🤝 Contribution Guidelines

This is an open-source enterprise standard project. Contributions are heavily encouraged. 

**Standard Operating Procedure:**
1. Fork the repository.
2. Create a feature branch tightly scoped to a specific issue (`git checkout -b feature/AmazingFeature`).
3. Ensure absolute Type Safety.
4. Commit your changes utilizing semantic commit messages.
5. Push to the branch and open a Pull Request against `main`.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

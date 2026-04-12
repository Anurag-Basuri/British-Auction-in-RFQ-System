# Enterprise British Reverse Auction Platform (RFQ System)

An industry-grade, real-time Reverse Auction platform engineered to facilitate highly competitive B2B sourcing and procurement. Suppliers compete in live, transparent reverse auctions where price and position dynamically update via WebSocket technology. 

Designed for enterprise scale, this platform mathematically enforces auction integrity, handles sub-second bidding contention, and autonomously manages complex time-extension dynamics (British Auctions) without manual intervention.

---

## ⚡ Core Features

- **Real-Time Live Bidding Arenas:** Sub-second latency utilizing **Socket.IO** for instantaneous bid unshifting, live timer updates, and contextual leaderboard recalculations. Optimistic UI updates guarantee zero perceived latency for the bidder.
- **Dynamic Auction Extensions (British Mechanics):** Built-in "British Auction" mechanics. If a supplier places a competitive bid within the final `X` minutes (the Trigger Window), the auction autonomously extends by `Y` minutes. This entirely prevents "auction sniping" and encourages true market-value price discovery.
- **Intelligent Scheduling Engine:** Powered by **Redis & BullMQ**. The system schedules pinpoint accurate closures using background workers that evaluate state and cleanly transition auction statuses from `ACTIVE` to `CLOSED`. Heavy state modifications are offloaded from the main Node event loop.
- **Premium Glassmorphic UX/UI:** Frontend designed with deep midnight dark-mode aesthetics, custom CSS variable tokens, Framer Motion staggered micro-animations, and exact-dimension skeleton loading states targeting zero layout shifts.
- **Strongly Typed Data Fortresses:** End-to-end type safety. Data flows securely from the PostgreSQL Database (via Prisma ORM), through Express/Zod validation controllers, across the wire, and directly into the Next.js Client `useQuery` hooks with mirrored TypeScript interfaces.
- **Role-Based Access Control (RBAC):** Strict topological separation. **Buyers** can create and monitor auctions but are cryptographically prevented from bidding. **Suppliers** can bid and monitor but cannot initiate auctions.

---

## 🏗️ Technology Stack

### Backend Infrastructure
| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Runtime** | Node.js (Express) | High-performance asynchronous API foundation |
| **Language** | TypeScript | Strict compilation and interface definition |
| **Database** | PostgreSQL | Relational transactional integrity |
| **ORM** | Prisma | Schema management, type-safe queries, migrations |
| **Message Broker** | Redis (Upstash) | In-memory datastore for fast Socket/Queue bridging |
| **Job Scheduler** | BullMQ | Reliable, recurring, and delayed background execution |
| **Real-Time Engine** | Socket.IO | Multiplexed WebSocket broadcasting |
| **Validation** | Zod | Runtime payload verification (DTOs) |

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

The architecture is strictly divided into a scalable mono-repo.

For deep technical analysis of how data flows through each environment, review our localized architecture documents:
- 👉 **[Backend Architecture Documentation](./backend/ARCHITECTURE.md)** — Covers dependency injection, transactions, and worker orchestration.
- 👉 **[Frontend Architecture Documentation](./frontend/ARCHITECTURE.md)** — Covers Service-Oriented Hooks, Socket cache injection, and Context layering.

```text
british-auction-rfq/
├── backend/
│   ├── prisma/             # Schema definitions & PostgreSQL migrations
│   ├── src/
│   │   ├── controllers/    # Route handlers bridging Express Router -> Services
│   │   ├── services/       # Core business logic (Bidding algorithms, RFQ state)
│   │   ├── routes/         # Express endpoint definitions & RBAC Guards
│   │   ├── scheduler/      # BullMQ worker instances (Auction close listeners)
│   │   ├── lib/            # Singletons (Redis client, Socket.IO emitter)
│   │   └── utils/          # Standardized ApiResponse & custom ApiError taxonomy
│   └── scratch/            # Contains backend E2E integration test scripts
│
└── frontend/
    ├── src/
    │   ├── app/            # Next.js App Router Pages & Layouts
    │   ├── providers/      # Tanstack React Query & Auth global Context Providers
    │   ├── services/       # Typed fetching wrappers mapping exactly to backend DTOs
    │   ├── lib/            # Axios API client interceptor logic & Socket.IO client singleton
    │   └── types/          # Typescript interfaces strictly matching Prisma models
    └── scratch/            # Contains frontend E2E integration test scripts
```

---

## 🚀 Setup & Installation

### Prerequisites
Before initializing the platform, verify your host machine has:
- **Node.js** v18.0.0 or higher
- **PostgreSQL** instance (Local or hosted via Supabase / Neon)
- **Redis** instance (Local or hosted via Upstash / AWS ElastiCache)

### 1. Backend Configuration & Boot Sequence

Initialize the backend first. This ensures the database schema is built and the Redis queue is ready.

You must configure the `.env` file in the `backend` directory.
*(Note: If using connection poolers like Supabase's pgBouncer, ensure `DIRECT_URL` points to port 5432 and `DATABASE_URL` points to port 6543).*

```env
# backend/.env
DATABASE_URL="postgresql://postgres.[ID]:[PASSWORD]@aws.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ID]:[PASSWORD]@aws.pooler.supabase.com:5432/postgres"

# Note the rediss:// prefix for secure TLS connections if using managed Redis
REDIS_URL="rediss://default:[PASSWORD]@your-redis-instance.upstash.io:6379"

JWT_SECRET="YOUR_SECURE_RANDOMLY_GENERATED_STRING"
PORT=3000
```

Boot the server:
```bash
cd backend
npm install

# Force the database schema to synchronize (Creates tables locally)
npx prisma db push --accept-data-loss

# Start the development environment (utilizes tsx for hot-reloading)
npm run dev
```
Wait to see: `✅ Connected to PostgreSQL` and `✅ Connected to Redis`.

### 2. Frontend Configuration & Boot Sequence

Open an independent terminal. The frontend environment dictates its connection paths via `.env.local`.

```env
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=http://localhost:3000
```

Boot the client:
```bash
cd frontend
npm install

# Next.js will auto-resolve port conflicts and launch on http://localhost:3001
npm run dev
```

---

## 🛡️ Security, Authentication & Fault Tolerance

### Authentication Flow
We utilize stateless JWT (JSON Web Tokens).
- **Backend:** The `authMiddleware` verifies the JWT signature and injects the authenticated `req.user` payload into the Express request lifecycle.
- **Frontend:** An Axios Request Interceptor autonomously extracts the JWT from browser `localStorage` and attaches it as a `Bearer` header to every single outgoing HTTP request.

### Centralized Exception Handling
We enforce a strict `ApiError` taxonomy. If a Zod validation fails, or an Unauthorized event occurs, the backend sends a tightly formatted JSON envelope. The frontend Axios Response Interceptor catches `401 Unauthorized` responses and broadcasts an application-wide Window Event. The React `AuthProvider` captures this event, instantly purges local state, and forcibly redirecting the user to `/auth/login` to prevent stale data leaks.

---

## 🧪 Validating System Health (E2E Integration)

We provide headless integration scripts to mathematically prove the infrastructure works before executing visual UI testing.

**Test the BullMQ Extension Engine:**
```bash
cd backend
npx tsx scratch/api_test.ts
```
**What this script does:**
1. Generates 2 ephemeral accounts (Buyer + Supplier).
2. The Buyer spins up an RFQ with a 15-second total lifespan and a 5-second trigger window.
3. The script waits precisely 12 seconds (breaching the trigger window).
4. The Supplier fires a bid.
5. The script listens to the backend and proves the BullMQ background worker gracefully extended the auction closure, defying the original hard-close timestamp.

---

## 🤝 Contribution Guidelines

This is an open-source enterprise standard project. Contributions are heavily encouraged. 

**Standard Operating Procedure:**
1. Fork the repository.
2. Create a feature branch tightly scoped to a specific issue (`git checkout -b feature/AmazingFeature`).
3. Ensure absolute Type Safety. Do not use `any` bypasses in TypeScript.
4. If modifying the API layer, ensure you update the Swagger/Zod schema layer first.
5. Commit your changes utilizing semantic commit messages.
6. Push to the branch and open a Pull Request against `main`.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

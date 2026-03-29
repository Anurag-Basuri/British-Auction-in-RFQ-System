<div align="center">

# ⚡ British Auction — Reverse Auction RFQ Platform

**A real-time, time-sensitive Reverse Auction system for Request for Quotation (RFQ) workflows.**

Built with **NestJS** · **Next.js** · **PostgreSQL** · **Redis/BullMQ** · **Socket.IO**

[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

---

*Buyers create time-boxed reverse auctions. Suppliers compete in real-time to offer the lowest price. The system dynamically extends deadlines using configurable British Auction rules — all powered by WebSocket events and transactional bid processing.*

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [Auction Mechanics — The British Auction Rules](#-auction-mechanics--the-british-auction-rules)
- [API Reference](#-api-reference)
- [WebSocket Events](#-websocket-events)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [Frontend Routes](#-frontend-routes)
- [Screenshots](#-screenshots)
- [Design Decisions](#-design-decisions)
- [Future Improvements](#-future-improvements)
- [License](#-license)

---

## 🔍 Overview

In a **Reverse Auction (British Auction)** model applied to RFQ systems, a **Buyer** posts a procurement requirement and multiple **Suppliers** compete by submitting progressively lower bids. The auction has a defined closing time, but the system can **dynamically extend the deadline** if qualifying bids arrive within a configurable trigger window — preventing last-second sniping and ensuring fair price discovery.

This platform implements the complete lifecycle:

1. **Buyer** creates an RFQ with auction parameters (timeline, trigger rules, extension config)
2. **Suppliers** discover active auctions and place bids in real time
3. **Auction engine** evaluates each bid against trigger conditions and extends the deadline when rules are met
4. **BullMQ scheduler** manages automatic auction closure with job rescheduling on extensions
5. **WebSocket layer** pushes live bid updates, time extensions, and closure events to all connected clients

---

## ✨ Key Features

### Buyer Capabilities
- 📝 **Create RFQ Auctions** — Configure title, description, timeline (start/close/forced close), trigger window (X), extension duration (Y), and trigger type
- 📊 **Live Command Console** — Real-time leaderboard of supplier rankings sorted by price and time
- 📈 **Auction Analytics** — View total active suppliers, average bid price, and L1 (lowest) price at a glance
- ⏱️ **Live Countdown** — Per-second countdown timer with hard close time visibility

### Supplier Capabilities
- 🔍 **Marketplace Discovery** — Browse all active/closed auctions with bid counts and close times
- 💰 **Live Bidding Interface** — Submit bids with instant feedback and see your current rank
- 🏆 **Rank Leaderboard** — See your position (L1, L2, …) relative to all other suppliers
- 🔔 **Real-time Updates** — Instant notification of new bids, time extensions, and auction closures

### System Capabilities
- 🔄 **Dynamic Time Extension** — Configurable British Auction extension logic with three trigger types
- 🛡️ **Transactional Bid Processing** — All bid validation and extension evaluation wrapped in Prisma transactions to prevent race conditions
- ⏰ **BullMQ Auction Scheduler** — Reliable delayed job execution for automatic auction closure, with job rescheduling on extensions
- 🌐 **WebSocket Real-time Layer** — Room-based Socket.IO broadcasting for per-auction event isolation
- 🔐 **JWT Authentication** — Stateless auth with role-based access (Buyer / Supplier)
- ✅ **Global DTO Validation** — NestJS ValidationPipe with whitelist and transform enabled

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (Next.js 16)                       │
│                                                                      │
│  ┌──────────┐  ┌──────────────┐  ┌───────────┐  ┌────────────────┐  │
│  │  Auth     │  │ Buyer Portal │  │ Supplier  │  │  Live Auction  │  │
│  │  Pages    │  │  Dashboard   │  │ Dashboard │  │  Pages (WS)    │  │
│  └──────────┘  └──────────────┘  └───────────┘  └────────────────┘  │
│       │               │                │                │            │
│       └───────────────┴────────────────┴────────────────┘            │
│                              │ HTTP + WebSocket                      │
└──────────────────────────────┼───────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                          BACKEND (NestJS 11)                         │
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌───────────────────┐  │
│  │  Auth     │  │   RFQ    │  │    Bid     │  │    Auction        │  │
│  │  Module   │  │  Module  │  │   Module   │  │    Module         │  │
│  │          │  │          │  │            │  │  (Extension Logic) │  │
│  └──────────┘  └──────────┘  └────────────┘  └───────────────────┘  │
│  ┌──────────────────┐  ┌────────────────────┐  ┌─────────────────┐  │
│  │   Notifications   │  │     Scheduler      │  │     Prisma      │  │
│  │   Gateway (WS)    │  │  (BullMQ Queue)    │  │     Module      │  │
│  └──────────────────┘  └────────────────────┘  └─────────────────┘  │
│                               │                        │             │
└───────────────────────────────┼────────────────────────┼─────────────┘
                                │                        │
                    ┌───────────┘                        │
                    ▼                                    ▼
             ┌─────────────┐                    ┌──────────────┐
             │    Redis     │                    │  PostgreSQL   │
             │  (BullMQ)    │                    │  (Database)   │
             └─────────────┘                    └──────────────┘
```

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16, React 19, TypeScript | App Router, client-side pages |
| **Styling** | Tailwind CSS 4 | Utility-first CSS framework |
| **UI Library** | Lucide React, Framer Motion | Icons and animations |
| **Forms** | React Hook Form, Zod | Form management and validation |
| **HTTP Client** | Axios, Fetch API | API communication |
| **Real-time** | Socket.IO Client | WebSocket connection to backend |
| **Backend** | NestJS 11, TypeScript | Modular REST + WebSocket API |
| **ORM** | Prisma (v6) | Type-safe database client |
| **Database** | PostgreSQL | Relational data store |
| **Queue** | BullMQ + Redis (ioredis) | Job scheduling for auction closure |
| **Auth** | @nestjs/jwt | JWT token signing and verification |
| **WebSocket** | @nestjs/websockets + Socket.IO | Real-time event broadcasting |
| **Validation** | class-validator (via NestJS pipes) | DTO request validation |
| **Testing** | Jest, Supertest | Unit and E2E test framework |

---

## 📂 Project Structure

```
British Auction in RFQ System/
├── backend/                          # NestJS API Server
│   ├── prisma/
│   │   └── schema.prisma            # Database schema (User, Rfq, Bid models)
│   ├── src/
│   │   ├── auth/                    # Authentication module
│   │   │   ├── auth.controller.ts   # POST /auth/register, /auth/login
│   │   │   ├── auth.service.ts      # JWT signing, user creation, login
│   │   │   ├── auth.module.ts       # Module wiring (JwtModule config)
│   │   │   ├── jwt-auth.guard.ts    # CanActivate guard for protected routes
│   │   │   └── dto/
│   │   │       └── auth.dto.ts      # RegisterDto, LoginDto
│   │   ├── rfq/                     # RFQ (Request for Quotation) module
│   │   │   ├── rfq.controller.ts    # POST /rfq, GET /rfq, GET /rfq/:id
│   │   │   ├── rfq.service.ts       # CRUD operations + auction job scheduling
│   │   │   ├── rfq.module.ts        # Module wiring
│   │   │   └── dto/
│   │   │       └── rfq.dto.ts       # CreateRfqDto
│   │   ├── bid/                     # Bid processing module
│   │   │   ├── bid.controller.ts    # POST /rfq/:rfqId/bid
│   │   │   ├── bid.service.ts       # Transactional bid creation + extension eval
│   │   │   └── bid.module.ts        # Module wiring
│   │   ├── auction/                 # Auction extension logic
│   │   │   ├── auction.service.ts   # evaluateExtension() — trigger/extension engine
│   │   │   └── auction.module.ts    # Module wiring
│   │   ├── scheduler/               # BullMQ job scheduling
│   │   │   ├── auction-queue.service.ts # scheduleClosure() — add/reschedule jobs
│   │   │   ├── auction.processor.ts     # Worker: close auctions + broadcast events
│   │   │   └── scheduler.module.ts      # Module wiring (BullModule.registerQueue)
│   │   ├── notifications/           # WebSocket notifications
│   │   │   ├── notifications.gateway.ts # Socket.IO gateway (join-rfq, broadcast)
│   │   │   └── notifications.module.ts  # Module wiring
│   │   ├── prisma/                  # Prisma ORM module
│   │   │   ├── prisma.service.ts    # PrismaClient provider
│   │   │   └── prisma.module.ts     # Global Prisma module
│   │   ├── app.module.ts            # Root module (all imports + BullMQ config)
│   │   └── main.ts                  # Bootstrap (CORS, ValidationPipe, port 3000)
│   ├── .env                         # Environment variables
│   ├── package.json                 # Dependencies & scripts
│   └── tsconfig.json                # TypeScript configuration
│
├── frontend/                         # Next.js Frontend
│   ├── src/app/
│   │   ├── auth/
│   │   │   ├── login/page.tsx       # Login page (email + password)
│   │   │   └── register/page.tsx    # Registration page (role selection)
│   │   ├── buyer/
│   │   │   ├── page.tsx             # Buyer Command Center (RFQ cards grid)
│   │   │   ├── new/page.tsx         # Create New RFQ form (auction config)
│   │   │   └── rfq/[id]/page.tsx    # Buyer Live Auction view (read-only ws)
│   │   ├── supplier/
│   │   │   ├── page.tsx             # Supplier Marketplace (active auction list)
│   │   │   └── rfq/[id]/page.tsx    # Supplier Live Auction (bidding + ws)
│   │   ├── header.tsx               # Shared navigation header
│   │   ├── layout.tsx               # Root layout (Geist fonts, metadata)
│   │   ├── page.tsx                 # Root page (auto-redirect by role)
│   │   └── globals.css              # Design tokens & utility classes
│   ├── package.json                 # Dependencies & scripts
│   └── tsconfig.json                # TypeScript configuration
│
└── README.md                        # This file
```

---

## 🗄 Database Schema

The application uses **PostgreSQL** with **Prisma ORM**. Three core models define the data layer:

### Entity Relationship Diagram

```mermaid
erDiagram
    USER ||--o{ RFQ : "creates (as buyer)"
    USER ||--o{ BID : "places (as supplier)"
    RFQ ||--o{ BID : "receives"

    USER {
        int id PK
        string email UK
        string password
        enum role "BUYER | SUPPLIER"
        datetime createdAt
        datetime updatedAt
    }

    RFQ {
        int id PK
        string title
        string description
        datetime start_time
        datetime close_time
        datetime forced_close_time
        int trigger_window_mins "X: window before close"
        int extension_mins "Y: extension duration"
        enum trigger_type "ANY_BID | RANK_CHANGE | L1_CHANGE"
        enum status "DRAFT | ACTIVE | CLOSED"
        int buyerId FK
        datetime createdAt
        datetime updatedAt
    }

    BID {
        int id PK
        int rfqId FK
        int supplierId FK
        float price
        datetime timestamp
    }
```

### Key Design Notes

| Field | Description |
|-------|-------------|
| `close_time` | The **soft deadline** — can be dynamically extended by the auction engine |
| `forced_close_time` | The **hard deadline** — absolute cap; extensions cannot exceed this time |
| `trigger_window_mins` | **X** — if a qualifying bid arrives within X minutes of `close_time`, extension is triggered |
| `extension_mins` | **Y** — the auction is extended by Y minutes when triggered |
| `trigger_type` | Determines **what condition** triggers an extension |
| `@@index([rfqId, price, timestamp])` | Composite index on Bid for efficient L1 lookups and rank ordering |

---

## ⚙ Auction Mechanics — The British Auction Rules

The core of this system is the **dynamic time extension engine** in [`auction.service.ts`](backend/src/auction/auction.service.ts). Here's how it works:

### Extension Flow

```mermaid
flowchart TD
    A[Supplier Submits Bid] --> B{Is RFQ Active?}
    B -->|No| X[❌ Reject: Auction not active]
    B -->|Yes| C{Is bid within trigger window?}
    C -->|"No (more than X mins to close)"| D[✅ Accept bid, no extension]
    C -->|"Yes (≤ X mins to close)"| E{Check trigger condition}
    E -->|ANY_BID| F[Trigger extension]
    E -->|L1_CHANGE| G{Is new bid < current L1?}
    E -->|RANK_CHANGE| H{Does bid change rankings?}
    G -->|Yes| F
    G -->|No| D
    H -->|Yes| F
    H -->|No| D
    F --> I[Calculate new_close = close_time + Y mins]
    I --> J{Is new_close > forced_close_time?}
    J -->|Yes| K[Cap at forced_close_time]
    J -->|No| L[Use new_close]
    K --> M[Update close_time in DB]
    L --> M
    M --> N[Reschedule BullMQ closure job]
    N --> O[Broadcast AUCTION_EXTENDED via WebSocket]
    O --> P[Broadcast BID_PLACED via WebSocket]
    D --> P
```

### The Three Trigger Types

| Trigger Type | Condition | Use Case |
|-------------|-----------|----------|
| `ANY_BID` | **Any bid** within the trigger window triggers extension | Maximum competition — every bid resets the clock |
| `L1_CHANGE` | Only triggers if the bid **becomes the new lowest price** (L1) | Focused — only extends when leadership changes |
| `RANK_CHANGE` | Triggers if the bid **changes the relative ranking** of suppliers | Moderate — extends when meaningful competition occurs |

### Transactional Safety

All bid processing is wrapped in a **Prisma `$transaction`** block:

1. **Validate** — Check RFQ exists and has `ACTIVE` status
2. **Evaluate** — Run extension logic against current state
3. **Mutate** — Update `close_time` if extended, then create bid record
4. **Notify** — Broadcast via WebSocket + reschedule BullMQ job

This ensures no race conditions between concurrent bids competing to extend the same auction.

---

## 📡 API Reference

### Authentication

All endpoints (except auth) require a `Bearer` token in the `Authorization` header.

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | `{ email, password, role }` | Register a new user. Role: `BUYER` or `SUPPLIER` |
| `POST` | `/auth/login` | `{ email, password }` | Login and receive a JWT access token |

**Response (both endpoints):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "buyer@example.com",
    "role": "BUYER"
  }
}
```

---

### RFQ Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/rfq` | ✅ Buyer | Create a new RFQ auction |
| `GET` | `/rfq` | ✅ Any | List all RFQs with buyer info and bid counts |
| `GET` | `/rfq/:id` | ✅ Any | Get full RFQ details with ordered bids |

**Create RFQ Request Body:**
```json
{
  "title": "Raw Materials Sourcing Q4 2026",
  "description": "Procurement of steel and aluminum sheets",
  "start_time": "2026-04-01T09:00:00.000Z",
  "close_time": "2026-04-01T11:00:00.000Z",
  "forced_close_time": "2026-04-01T13:00:00.000Z",
  "trigger_window_mins": 5,
  "extension_mins": 10,
  "trigger_type": "ANY_BID"
}
```

**Get RFQ by ID Response (includes ordered bids):**
```json
{
  "id": 1,
  "title": "Raw Materials Sourcing Q4 2026",
  "status": "ACTIVE",
  "close_time": "2026-04-01T11:10:00.000Z",
  "forced_close_time": "2026-04-01T13:00:00.000Z",
  "buyer": { "email": "buyer@example.com" },
  "bids": [
    {
      "id": 3,
      "price": 4500.00,
      "timestamp": "2026-04-01T10:55:12.000Z",
      "supplier": { "email": "supplier-a@example.com" }
    },
    {
      "id": 1,
      "price": 5000.00,
      "timestamp": "2026-04-01T10:30:00.000Z",
      "supplier": { "email": "supplier-b@example.com" }
    }
  ]
}
```

---

### Bidding

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/rfq/:rfqId/bid` | ✅ Supplier | Place a bid on an active auction |

**Request Body:**
```json
{
  "price": 4200.50
}
```

**Response:**
```json
{
  "bid": {
    "id": 5,
    "rfqId": 1,
    "supplierId": 2,
    "price": 4200.50,
    "timestamp": "2026-04-01T10:58:30.000Z",
    "supplier": { "email": "supplier-a@example.com" }
  },
  "close_time": "2026-04-01T11:08:30.000Z"
}
```

> If the bid triggered an extension, `close_time` reflects the new extended time.

---

## 🔌 WebSocket Events

The system uses **Socket.IO** with room-based broadcasting. Each RFQ has its own room (`rfq-{id}`).

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join-rfq` | `rfqId: number` | Subscribe to real-time updates for a specific auction |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `BID_PLACED` | `Bid` object (with supplier email) | A new bid was placed — update the leaderboard |
| `AUCTION_EXTENDED` | `{ new_close: string }` | The auction deadline was extended — update the countdown |
| `AUCTION_CLOSED` | `{ rfqId, status: 'CLOSED' }` | The auction has ended — disable bidding |

### Connection Example (Client)

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

// Join an auction room
socket.emit('join-rfq', 42);

// Listen for new bids
socket.on('BID_PLACED', (bid) => {
  console.log(`New bid: $${bid.price} by ${bid.supplier.email}`);
});

// Listen for time extensions
socket.on('AUCTION_EXTENDED', ({ new_close }) => {
  console.log(`Deadline extended to: ${new_close}`);
});

// Listen for auction closure
socket.on('AUCTION_CLOSED', () => {
  console.log('Auction has been closed');
});
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

| Requirement | Version | Installation |
|------------|---------|-------------|
| **Node.js** | ≥ 18.x | [nodejs.org](https://nodejs.org/) |
| **PostgreSQL** | ≥ 14 | [postgresql.org](https://www.postgresql.org/download/) |
| **Redis** | ≥ 7 | [redis.io](https://redis.io/download/) or Docker |
| **npm** | ≥ 9 | Bundled with Node.js |

### 1. Clone the Repository

```bash
git clone https://github.com/Anurag-Basuri/nextlearn.git
cd "British Auction in RFQ System"
```

### 2. Set Up PostgreSQL

Create a database for the application:

```sql
CREATE DATABASE rfq_system;
```

### 3. Set Up Redis

Ensure Redis is running on port `6379`:

```bash
# Using Docker (recommended)
docker run -d --name redis -p 6379:6379 redis:7-alpine

# OR using local Redis
redis-server
```

### 4. Install Backend Dependencies

```bash
cd backend
npm install
```

### 5. Configure Environment

Edit `backend/.env` with your credentials:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rfq_system?schema=public
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secure-secret-key-here
```

### 6. Run Database Migrations

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### 7. Install Frontend Dependencies

```bash
cd frontend
npm install
```

---

## ▶ Running the Application

### Start Backend (Port 3000)

```bash
cd backend
npm run start:dev
```

### Start Frontend (Port 3001)

```bash
cd frontend
npm run dev -- -p 3001
```

### Access Points

| Service | URL |
|---------|-----|
| **Frontend** | [http://localhost:3001](http://localhost:3001) |
| **Backend API** | [http://localhost:3000](http://localhost:3000) |
| **WebSocket** | `ws://localhost:3000` (Socket.IO) |

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/rfq_system?schema=public` | PostgreSQL connection string |
| `REDIS_HOST` | `localhost` | Redis server hostname |
| `REDIS_PORT` | `6379` | Redis server port |
| `JWT_SECRET` | — | Secret key for JWT signing (change in production!) |

---

## 🗺 Frontend Routes

| Route | Role | Description |
|-------|------|-------------|
| `/` | Any | Auto-redirect: authenticated users go to their portal; unauthenticated go to login |
| `/auth/login` | Public | Login page with email/password |
| `/auth/register` | Public | Registration with role selection (Buyer/Supplier toggle) |
| `/buyer` | Buyer | **Command Center** — Grid of all RFQs with status badges, bid counts, and close times |
| `/buyer/new` | Buyer | **Create RFQ** — Form with auction timeline, trigger window (X), extension (Y), and trigger type |
| `/buyer/rfq/[id]` | Buyer | **Live Auction Console** — Read-only real-time leaderboard with L1 price, countdown, supplier rankings, and analytics sidebar |
| `/supplier` | Supplier | **Marketplace** — Grid of active/closed auctions available for bidding |
| `/supplier/rfq/[id]` | Supplier | **Live Bidding Arena** — Submit bids, view your rank, live leaderboard, countdown timer |

---

## 🎨 Screenshots

> *Screenshots will be added after initial deployment. The UI features a premium dark theme with:*
> - **Glassmorphism** header with backdrop blur
> - **Indigo/green accent** color palette
> - **Premium card** components with subtle shadows
> - **Animated** loading states and hover effects
> - **Responsive** grid layouts (1/2/3 columns breakpoints)

---

## 🧠 Design Decisions

### Why BullMQ over `setTimeout`?

- **Persistence** — BullMQ jobs survive server restarts; `setTimeout` does not
- **Deduplication** — Job IDs prevent duplicate closure jobs for the same RFQ
- **Rescheduling** — When an extension occurs, the old job is removed and a new delayed job is created with the updated close time
- **Distributed** — In a multi-instance deployment, only one worker processes the closure

### Why Prisma Transactions for Bidding?

Concurrent bid submissions could create a race condition where two bids both read the same `close_time`, both evaluate extensions, and both try to update — leading to a lost extension. Wrapping the entire bid flow in `$transaction` serializes access and guarantees:
- The RFQ status check is consistent
- The extension evaluation uses the latest `close_time`
- The bid record and close time update are atomic

### Why Socket.IO Rooms?

Each auction gets its own room (`rfq-{id}`). This avoids broadcasting all events to all clients — only participants of a specific auction receive its updates. Rooms are joined on the client side via a `join-rfq` event.

### Why No Password Hashing?

This is currently a **development prototype**. In production, passwords should be hashed with bcrypt. The current implementation uses plain-text comparison for rapid development iteration.

---

## 🔮 Future Improvements

- [ ] **Password Hashing** — Integrate bcrypt for secure password storage
- [ ] **Role-based Route Guards** — Enforce buyer/supplier access at the API level
- [ ] **Bid Validation Rules** — Ensure new bids are lower than the supplier's previous bid
- [ ] **Auto-decrement Bidding** — Allow suppliers to set auto-bid rules
- [ ] **Email Notifications** — Notify suppliers of auction closures and results
- [ ] **Audit Trail** — Log all extension events with timestamps and reasons
- [ ] **Multi-lot RFQs** — Support multiple items per RFQ with independent bidding
- [ ] **Deployment** — Docker Compose setup for one-command deployment
- [ ] **E2E Tests** — Playwright tests for the full auction flow
- [ ] **Rate Limiting** — Prevent bid spamming with throttle guards
- [ ] **Supplier Invite System** — Allow buyers to whitelist suppliers per RFQ

---

## 📄 License

This project is **UNLICENSED** — private use only.

---

<div align="center">

**Built with ❤️ for competitive procurement**

*A full-stack implementation of the British Auction model applied to enterprise RFQ workflows.*

</div>

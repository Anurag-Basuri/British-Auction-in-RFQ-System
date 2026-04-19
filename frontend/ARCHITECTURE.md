# Frontend Architecture & Data Flow (Premium v2.0)

This system is built as a **High-Performance Trading Terminal** for British (Reverse) Auctions. It prioritizes sub-second real-time synchronization, defensive error handling, and a professional-grade dark aesthetic.

## 1. Tactical Stack
- **Core**: Next.js 16 (App Router) + React 19.
- **State**: TanStack Query v5 (Server state) & React Context (Auth state).
- **Styling**: TailwindCSS v4 + Framer Motion (Orchestration).
- **Communication**: Socket.IO (Real-time) & Axios (Transactional).

---

## 2. Advanced Error & Validation Architecture
We have implemented a **Diagnostic Fortress** that transforms technical failures into actionable professional guidance.

### 2.1 The `ApiError` Taxonomy
All failures (Network, Validation, Logic) are normalized into the `ApiError` class.
- **Flattened Payloads**: Backend Zod errors are flattened into a simple array of `field: message` strings.
- **Unified Summary**: Form handlers catch both client-side Zod failures and backend API errors, funnealing them into the central `ErrorAlert` component.

### 2.2 Semantic Mapping Engine
The UI contains a logic layer that translates technical database keys into user-friendly "Professional Labels":
- `trigger_window_mins` → **Auction Activity Window**
- `forced_close_time` → **Drop-Dead Finality Time**
- `transit_time` → **Estimated Transit Duration**

### 2.3 Actionable Guidance
Every error alert now calculates **"How to Resolve"** steps based on the status code:
- **400 (Validation)**: Instructs the user on parameter population and temporal boundary logic.
- **401 (Auth)**: Prompts for immediate re-authentication to restore the secure tunnel.
- **500 (System)**: Advises on network stability and synchronization retries.

---

## 3. Real-Time Synchronization Strategy
The frontend utilizes a **Singleton WebSocket Engine** linked to the React Query cache.

1. **Passive Observation**: Users join "RFQ Rooms" via `socket.joinRfqRoom(id)`.
2. **Direct Cache Injection**: When a `BID_PLACED` event arrives, the system doesn't refetch the page. It reaches directly into the TanStack Query cache and performs an atomic `unshift` of the new data.
3. **Reactive UI Components**: Framer Motion listens for these cache changes, triggering "Terminal Pulse" animations and re-ranking the leaderboard with smooth layout transitions.

---

## 4. Premium Design System (Terminal Midnight)
The aesthetic is designed to minimize cognitive load during high-pressure bidding cycles.

### 4.1 Visual Tokens
- **Background**: Deep Onyx (`#05050A`) with a floating mesh gradient (`animate-blob`).
- **Glassmorphism**: Components use 80% opacity with `backdrop-blur-3xl` and thin high-contrast borders (`border-white/5`).
- **Typography**: Strictly monochromatic with high-impact "Outfit" headings for an industrial look.

### 4.2 UX Resilience Patterns
- **Auto-Scroll Orchestration**: Forms are hard-wired to `scrollToError()` handlers. On any validation failure, the viewport smooth-scrolls to the diagnostic summary at the top.
- **Urgency Pulsing**: The auction clock transitions from static white to a pulsing `amber-400` during the "Forced Recovery" window (last 120 seconds).

---

## 5. Directory Mapping
```text
src/
├── app/                  # Next.js App Router boundary
│   ├── auth/             # Login / Register flows
│   ├── buyer/            # Buyer Dashboard & Route protecting
│   ├── supplier/         # Supplier Dashboard & Live Arenas
│   └── globals.css       # Core Design System (Mesh Gradients)
├── components/           # Reusable Atomic Elements
│   └── ui/               # ErrorAlert, Buttons, Inputs
├── lib/                  # Framework initialization
│   ├── api-client.ts     # Axios instance & interceptors
│   ├── api-error.ts      # Custom Error taxonomy
│   └── socket.ts         # Singleton WebSocket connection
├── services/             # Strictly Typed API Callers (Typed Services)
└── types/                # End-to-end TS interfaces mapping to Prisma
```

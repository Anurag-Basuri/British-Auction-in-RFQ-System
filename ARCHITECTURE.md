# System Architecture: British Auction RFQ Platform

This document serves as the finalized architectural overview of the British Auction RFQ platform. It outlines the technical stack, infrastructure, and core business logic implemented across both the Frontend and Backend to satisfy the highly competitive, high-concurrency specifications.

---

## 1. System Infrastructure & Stack

The platform is built as a highly decoupled Monorepo (conceptually), with separate discrete frontend and backend processes communicating over REST and WebSocket channels.

### Frontend
- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Vanilla Tailwind CSS with high-end, premium aesthetic designs (Glassmorphism, Dark Mode, dynamic glows).
- **Animations:** Framer Motion for micro-interactions, layout transitions, and high-adrenaline UI shifts.
- **State Management:** `@tanstack/react-query` for asynchronous server state, unified with generic React Hooks for local UI state.
- **Real-time Engine:** `socket.io-client` listening passively to broadcast channels.
- **Forms:** `react-hook-form` coupled with `@hookform/resolvers/zod` for strict client-edge validation matching backend contracts.

### Backend
- **Core Server:** Express.js + Vite (Node.js runtime) + TypeScript
- **Database:** PostgreSQL accessed via Prisma ORM for type-safe database queries and atomic transactions.
- **Background Tasks (The Engine):** `BullMQ` running on Redis. This is the cornerstone of the auction system, dynamically managing asynchronous timeout delays to securely close auctions.
- **Real-time Server:** `Socket.io` attached to the underlying HTTP server to emit live operational data out to the connected frontend clients.

---

## 2. Core Business Workflows

### 2.1 The British Auction Extension Protocol
The hardest part of a British Auction is managing concurrency and dynamic time. The backend solves this flawlessly:

**a. Thread Safety (Concurrency):**
When two suppliers submit bids at the identical millisecond, the backend wraps the transaction inside Prisma `$transaction`. This inherently serializes the database write, preventing race-conditions. 

**b. Time Extension Logic (`auction.service.ts`):**
Whenever a bid is processed, the system crosses the `close_time` with the `trigger_window_mins`. If the bid falls within that window, the engine evaluates the pre-configured rule (`ANY_BID`, `L1_CHANGE`, or `RANK_CHANGE`). 
- For `RANK_CHANGE`, the backend computes a unique rank shift algorithm to see if the supplier legitimately moved up the competitor orderbook.
- If true, the `close_time` is pushed out by `extension_mins`.

**c. The `BullMQ` Worker Engine:**
When time is magically injected into the auction, the core background `scheduleClosure` queue dynamically **intercepts** the delay. It rips the old closure task structure out of the Redis database and inserts an entirely new delayed tick. The worker strictly verifies that `Current Time >= close_time OR Current Time >= forced_close_time` before sealing the RFQ state to `CLOSED`.

### 2.2 Leaderboard Derivation (The Front Rank Logic)
Instead of relying strictly on flat historical bid logs (which visually floods the UI and demoralizes participants), both the Buyer and Supplier screens compute a **Unique Competitor Leaderboard**:
- Raw socket streams fetch the chronological history array.
- The UI mathematically filters `sortedBids` down to form maps showing the *single lowest active bid* per `supplier_entity`.
- Suppliers actively compare themselves to this compressed algorithm determining their `userRank`.

### 2.3 Strict UX Controls
The system implements tools that increase UX velocity without breaking rigid regulatory rules:
- **Buyer (Force Finalize):** Exposes the `POST /api/rfq/:id/close-early` route. Mathematically safe, as it lowers `close_time` to immediately *now*, which functionally guarantees it complies with the upper threshold `forced_close_time` limit.
- **Supplier (Quick Action Desk):** Computes live `-1%`, `-5%`, and `-10%` deductions to immediately structure the complex mathematical partitions of Freight, Origin, and Destination properties into the form inputs to let a supplier aggressively counter a ticking clock without manually doing arithmetic.

---

## 3. Database Schema Mapping
The underlying Prisma architecture fully complies with the robust RFQ parameters:
- **`Rfq` Table:** Manages the configuration variables (`trigger_window_mins`, `extension_mins`, `extension_rule`) alongside strict tracking of `start_time`, `close_time`, and `forced_close_time`.
- **`Bid` Table:** Moved off of simplified structure and into explicit Quote parameters defined by the spec: `freight_charges`, `origin_charges`, `destination_charges`, `transit_time`, `validity_of_quote`, bundled into a unified aggregated column `price` for quick L1 sorting.

---

## 4. Overall Health & Roadmap
The current architecture is highly performant. The separation of `BullMQ` queueing versus the `Express` core ensures that CPU-intensive task resolutions never block the I/O event loops fetching HTTP JSON payloads.

**Future Scaling Considerations:**
- If scaling horizontally (multiple server nodes), `BullMQ` is already clustered via Redis. The only minimal change required would be swapping the local memory payload of `Socket.io` into `socket.io-redis` adapter to allow WebSocket broadcasts to transparently reach clients connected across multiple distinct hardware load balancers.


---

# Aegis Ledger — Behavioral Execution Firewall & Telemetry Journal

**Aegis Ledger** is an active behavioral enforcement system designed to eliminate emotional trading drift, revenge trading, and execution non-compliance.

Unlike traditional spreadsheets that serve merely as passive, post-facto logging ledgers with high manual entry friction, this application operates as an event-driven **Finite State Machine (FSM)**. It decouples execution compliance from monetary PnL—conditioning traders to optimize for repeatable process adherence rather than short-term financial outcomes.

---

### Core Philosophy

* **Process Over Outcome:** A trade that breaks predefined rules but makes money is logged as a failure; an executed setup that follows complete protocol but hits a stop loss is graded as a success.
* **Frictional Gatekeeping:** Imposes cognitive latency prior to execution via a mandatory multi-timeframe checklist and dialectical (Bull vs. Bear) thesis verification.
* **Automated Telemetry Bridge:** Eliminates manual data entry friction and retrospective record tampering by intercepting broker executions in real time via an MQL5 telemetry bridge.
* **Mechanical Circuit Breakers:** Deterministically enforces a "one-and-done" daily loss policy, locking the platform and endpoint access until 00:00 UTC.

---

### Repository Structure

```text
Trading_Journal/
├── apps/
│   └── journal/             # Next.js frontend, UI FSM, and local persistence layer
├── bridge/
│   ├── mt5-ea/              # MQL5 telemetry bridge (AccountGuardian.mq5)
│   └── daemon/              # OS-level process containment scripts
├── packages/
│   └── telemetry-schema/    # Shared TypeScript contracts and Zod schemas
├── docs/                    # Architecture diagrams, specifications, and setups
├── LICENSE                  # Project licensing terms
└── README.md                # System documentation and operational runbook

```

---
### Finite State Machine (FSM) Invariants

The application resides in exactly one of five operational states at any time:

1. `IDLE` (State 0): HUD and constraint status monitoring.
2. `PRE_FLIGHT` (State 1): Multi-timeframe gatekeeper, dialectical analysis, and risk geometry validation.
3. `IN_PROGRESS` (State 2): Active trade execution lock ("The Void") with immutable pre-flight parameters.
4. `POST_MORTEM` (State 3): Post-trade audit, execution compliance grading, and trade finalization.
5. `LOCKED_CIRCUIT_BREAKER` (State 4): Complete platform and broker containment locked until 00:00:00 UTC.

#### State Transition Matrix

| Source State | Target State | Trigger Condition |
| :--- | :--- | :--- |
| `IDLE` | `PRE_FLIGHT` | User initiates setup wizard |
| `IDLE` | `LOCKED_CIRCUIT_BREAKER` | Active daily loss detected on startup |
| `PRE_FLIGHT` | `IN_PROGRESS` | Pre-flight validation passed & order opened |
| `PRE_FLIGHT` | `IDLE` | User aborts or selects `NO_TRADE_CHOP` |
| `IN_PROGRESS` | `POST_MORTEM` | Broker position liquidation |
| `POST_MORTEM` | `IDLE` | Trade finalized with positive or zero realized R |
| `POST_MORTEM` | `LOCKED_CIRCUIT_BREAKER` | Trade finalized with `LOSS` or `realizedR < 0` |
| `LOCKED_CIRCUIT_BREAKER` | `IDLE` | UTC midnight reset (00:00:00 UTC) |

---

### Implementation Progress

- [x] **Phase 1: Shared Protocol Definition (`packages/protocol`)**
  - [x] Domain entities and validation rules (Zod)
  - [x] Deterministic FSM state machine transitions and guards
  - [x] Ingestion wire schemas for MQL5 broker telemetry
  - [x] Monorepo workspace configuration
- [ ] **Phase 2: Persistence Layer & Database Schemas**
  - [ ] Embedded SQLite setup
  - [ ] Immutable audit logs, setups, and trades schema
  - [ ] UTC-enforced lockout queries
- [ ] **Phase 3: Core FSM Engine & Guard Enforcement**
- [ ] **Phase 4: Telemetry Ingestion Endpoints**
- [ ] **Phase 5: Containment Daemon & MQL5 Bridge**
- [ ] **Phase 6: Frontend HUD & Pre-Flight UI**

---

### Verification & Type-Check

```bash
npm install
npm --workspace=@aegis/protocol run type-check

### Database & Persistence Layer (`packages/db`)

Built on SQLite and Drizzle ORM, the persistence layer provides zero-configuration local storage with ACID compliance and write-ahead logging (WAL) enabled.

- `system_state`: Singleton tracking current FSM state, active setup reference, active ticket, and UTC lockout release timestamp.
- `setups`: Immutable pre-flight validation store capturing multi-timeframe checklist verifications, dialectical theses, and strict risk geometry.
- `trades`: Execution telemetry mapping broker fills, realized PnL, R-multiples, and binary process compliance flags.
- `audit_logs`: Immutable transition history tracking state changes, triggered events, and metadata payloads.

---

### Implementation Progress

- [x] **Phase 1: Shared Protocol Definition (`packages/protocol`)**
- [x] **Phase 2: Persistence Layer & Database Schemas (`packages/db`)**
  - [x] SQLite embedded schema with Drizzle ORM
  - [x] State, Setup, Trade, and Audit Log tables
  - [x] WAL mode configuration for concurrent read/write safety
- [ ] **Phase 3: Core FSM Engine & Guard Enforcement**
- [ ] **Phase 4: Telemetry Ingestion Endpoints**
- [ ] **Phase 5: Containment Daemon & MQL5 Bridge**
- [ ] **Phase 6: Frontend HUD & Pre-Flight UI**

---

### Verification & Type-Check

```bash
npm install
npm --workspace=@aegis/db run type-check

### Core FSM Engine (`packages/engine`)

The FSM Engine executes state transitions, enforces invariant execution rules, and maintains database transaction boundaries.

- **Deterministic Transitions:** Enforces sequential paths ($0 \rightarrow 1 \rightarrow 2 \rightarrow 3 \rightarrow [0 \mid 4]$) and records atomic mutations to `system_state`.
- **Pre-Flight Invalidation:** Prevents order execution until multi-timeframe checks, dialectical arguments, and minimum 1:2 R:R boundaries are satisfied.
- **In-Flight Immutability:** Freezes pre-flight setups to read-only upon transition to `IN_PROGRESS`.
- **Circuit Breaker Tripwire:** Flags trade outcomes yielding $R < 0$ and locks the platform to `LOCKED_CIRCUIT_BREAKER` until 00:00:00 UTC.
- **Audit Logging:** Logs timestamped transition records and triggering events to `audit_logs`.

---

### Implementation Progress

- [x] **Phase 1: Shared Protocol Definition (`packages/protocol`)**
- [x] **Phase 2: Persistence Layer & Database Schemas (`packages/db`)**
- [x] **Phase 3: Core FSM Engine & Guard Enforcement (`packages/engine`)**
  - [x] Atomic state machine dispatcher with transaction rollback
  - [x] Pre-flight immutability locking
  - [x] Daily loss detection and UTC midnight lockout calculation
  - [x] Immutable audit trail logging
- [ ] **Phase 4: Telemetry Ingestion Endpoints**
- [ ] **Phase 5: Containment Daemon & MQL5 Bridge**
- [ ] **Phase 6: Frontend HUD & Pre-Flight UI**

---

### Verification & Type-Check

```bash
npm install
npm --workspace=@aegis/engine run type-check

### Telemetry Ingestion API (`apps/journal/app/api`)

The Next.js backend serves as the ingestion bridge for external trading terminals.

- **`POST /api/telemetry/trade-event`**: Ingests JSON payloads from the MQL5 Expert Advisor. Validates wire schemas via Zod and routes verified events (`POSITION_OPENED`, `POSITION_CLOSED`) into the core FSM Engine to trigger state mutations.
- **`GET /api/telemetry/circuit-status`**: A lightweight, dynamically evaluated endpoint providing real-time system lockout state. Used by both the Next.js frontend HUD and the OS-level containment daemon to verify whether trading execution should be physically blocked.

---

### Implementation Progress

- [x] **Phase 1: Shared Protocol Definition (`packages/protocol`)**
- [x] **Phase 2: Persistence Layer & Database Schemas (`packages/db`)**
- [x] **Phase 3: Core FSM Engine & Guard Enforcement (`packages/engine`)**
- [x] **Phase 4: Telemetry Ingestion Endpoints (`apps/journal`)**
  - [x] Scaffolding Next.js App Router workspace
  - [x] `POST` payload parser and schema validator
  - [x] `GET` dynamic circuit status broadcast
- [ ] **Phase 5: Containment Daemon & MQL5 Bridge**
- [ ] **Phase 6: Frontend HUD & Pre-Flight UI**

### Containment Daemon & Telemetry Bridge (`bridge/`)

Physical execution boundaries are enforced via external OS-level scripts that communicate with the core API.

- **`AccountGuardian.mq5`**: An MQL5 Expert Advisor attached to the MetaTrader 5 terminal. It hooks into `OnTradeTransaction`, tracking historical deal entries and exits to construct JSON payloads, which are pushed to the `POST /api/telemetry/trade-event` endpoint in real-time.
- **`guardian_daemon.py`**: A Python script running in the background, polling the `GET /api/telemetry/circuit-status` endpoint every 5 seconds. If a circuit breaker lock is detected, it utilizes `psutil` to immediately terminate the `terminal64.exe` process, physically preventing further order execution.

---

### Implementation Progress

- [x] **Phase 1: Shared Protocol Definition (`packages/protocol`)**
- [x] **Phase 2: Persistence Layer & Database Schemas (`packages/db`)**
- [x] **Phase 3: Core FSM Engine & Guard Enforcement (`packages/engine`)**
- [x] **Phase 4: Telemetry Ingestion Endpoints (`apps/journal`)**
- [x] **Phase 5: Containment Daemon & MQL5 Bridge (`bridge/`)**
  - [x] Python OS-process containment daemon
  - [x] MQL5 `OnTradeTransaction` HTTP telemetry bridge
- [ ] **Phase 6: Frontend HUD & Pre-Flight UI**

### Frontend UI & HUD (`apps/journal`)

The Next.js App Router serves as the master presentation layer, enforcing FSM constraints strictly via conditional UI rendering.

- **`IDLE`**: Displays high-level compliance stats and the "Initiate" gatekeeper hook.
- **`PRE_FLIGHT`**: The multi-timeframe wizard. Submitting this creates a pending setup in the database and waits for MQL5 MT5 telemetry to lock it.
- **`IN_PROGRESS` ("The Void")**: Strips away all user inputs. Displays a read-only, locked view of the pre-flight risk parameters and a live holding timer.
- **`POST_MORTEM`**: Appears automatically when MT5 sends a `POSITION_CLOSED` payload. Demands compliance grading and psychological debriefing before the platform can reset.
- **`LOCKED_CIRCUIT_BREAKER`**: A dedicated red-screen lockdown view removing all trading UI, displaying a live countdown to `00:00:00 UTC`.

---

### Implementation Progress

- [x] **Phase 1: Shared Protocol Definition (`packages/protocol`)**
- [x] **Phase 2: Persistence Layer & Database Schemas (`packages/db`)**
- [x] **Phase 3: Core FSM Engine & Guard Enforcement (`packages/engine`)**
- [x] **Phase 4: Telemetry Ingestion Endpoints (`apps/journal/api`)**
- [x] **Phase 5: Containment Daemon & MQL5 Bridge (`bridge/`)**
- [x] **Phase 6: Frontend HUD & Pre-Flight UI (`apps/journal/page.tsx`)**
  - [x] Tailwind CSS & Lucide configuration
  - [x] Dynamic FSM state orchestrator component
  - [x] API mutation wrappers for FSM events

### System Completion & Handover

Aegis Ledger is now fully architected. To launch the full stack locally:
1. `npm run dev` (Starts Next.js backend/frontend).
2. `python bridge/daemon/guardian_daemon.py` (Starts OS containment).
3. Attach `AccountGuardian.mq5` to any MetaTrader 5 chart.
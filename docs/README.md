
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

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
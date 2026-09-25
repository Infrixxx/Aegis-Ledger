# Aegis Ledger : Behavioral Execution Firewall & Telemetry Journal

**Aegis Ledger** is an active behavioral enforcement system designed to eliminate emotional trading drift, revenge trading, and execution non-compliance.

Unlike traditional spreadsheets that serve merely as passive, post-facto logging ledgers with high manual entry friction, this application operates as an event-driven **Finite State Machine (FSM)**. It decouples execution compliance from monetary PnL conditioning traders to optimize for repeatable process adherence rather than short-term financial outcomes.

---

## Core Philosophy

* **Process Over Outcome:** A trade that breaks predefined rules but makes money is logged as a failure; an executed setup that follows complete protocol but hits a stop loss is graded as a success.
* **Frictional Gatekeeping:** Imposes cognitive latency prior to execution via a mandatory multi-timeframe checklist and dialectical (Bull vs. Bear) thesis verification.
* **Automated Telemetry Bridge:** Eliminates manual data entry friction and retrospective record tampering by intercepting broker executions in real time via an MQL5 telemetry bridge.
* **Mechanical Circuit Breakers:** Deterministically enforces a "one-and-done" daily loss policy, locking the platform and endpoint access until 00:00 UTC.

---

## System Architecture

Aegis Ledger recently transitioned from a monolithic SQLite app to a highly scalable Data Engineering pipeline. 

1. **Ingestion Layer:** MetaTrader 5 (MQL5 EA) pushes raw trade deals and ticks to a high-throughput FastAPI Python daemon (`guardian_daemon.py`).
2. **Event Streaming (Message Broker):** The Python daemon acts as a producer, serializing payloads and publishing them to an Apache Kafka (KRaft) cluster.
3. **Transactional State (OLTP):** A lightweight SQLite database (managed by Drizzle ORM) strictly handles FSM state transitions and UI locks, preventing race conditions.
4. **Analytical Warehouse (OLAP):** Trade events are routed into a ClickHouse columnar database, allowing the Next.js UI to instantly query massive historical ledger aggregations without impacting the transactional FSM.
5. **Data Lake & ETL:** A PySpark streaming pipeline consumes raw ticks from Kafka, aggregates them into 1-minute OHLCV bars, and writes Parquet files to a MinIO S3-compatible Data Lake.
6. **Frontend HUD:** A Next.js App Router dashboard displays the active FSM constraints and daily ClickHouse ledger queries.

---

## Finite State Machine (FSM) Invariants

The application resides in exactly one of five operational states at any time:

1. `IDLE` (State 0): HUD and constraint status monitoring.
2. `PRE_FLIGHT` (State 1): Multi-timeframe gatekeeper, dialectical analysis, and risk geometry validation.
3. `IN_PROGRESS` (State 2): Active trade execution lock ("The Void") with immutable pre-flight parameters.
4. `POST_MORTEM` (State 3): Post-trade audit, execution compliance grading, and trade finalization.
5. `LOCKED_CIRCUIT_BREAKER` (State 4): Complete platform and broker containment locked until 00:00:00 UTC.

### State Transition Matrix

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

## Quick Start Guide

You will need three terminal windows to launch the full pipeline locally. Ensure you have Node.js, Python 3, and Docker/Podman installed.

### 1. Boot the Storage & Streaming Infrastructure

Spin up Kafka, Kafka UI, ClickHouse, and MinIO.

```bash
podman compose up -d
```

* **Kafka UI:** `http://localhost:8080`
* **MinIO Console:** `http://localhost:9001` (User: `aegis_admin` / Pass: `aegis_secure_password`)

### 2. Start the Telemetry Ingestion Daemon

Initialize your Python environment and start the FastAPI Kafka producer.

```bash
cd bridge/daemon
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn confluent-kafka pydantic
python3 guardian_daemon.py
```

* **Ingestion Endpoint:** `http://localhost:8000/api/v1/telemetry/trade-event`

### 3. Start the Next.js Dashboard

Launch the frontend UI.

```bash
npm install
npm run build --workspaces --if-present
cd apps/journal
npm run dev
```

* **Frontend HUD:** `http://localhost:3000`

### 4. (Optional) Run the PySpark ETL Pipeline

To continuously aggregate MT5 ticks into 1m OHLCV Parquet files in MinIO.

```bash
python3 pipelines/etl_tick_to_ohlcv.py
```

---

## Repository Structure

```
Trading_Journal/
├── apps/
│   └── journal/             # Next.js frontend, UI FSM state controller
├── bridge/
│   ├── mt5-ea/              # MQL5 AccountGuardian EA telemetry bridge
│   └── daemon/              # FastAPI Python ingestion daemon (Kafka Producer)
├── packages/
│   ├── db/                  # SQLite FSM tracking & ClickHouse client
│   ├── engine/              # Core FSM state transition logic
│   └── protocol/            # Shared TypeScript contracts and Zod schemas
├── pipelines/
│   └── etl_tick_to_ohlcv.py # PySpark tick aggregation script
├── docker-compose.yml       # Kafka, ClickHouse, MinIO orchestration
└── README.md                # System documentation
```

---

## System Completion Status

- [x] **Phase 1: Shared Protocol Definition:** Domain entities, FSM guards, and Zod validation.
- [x] **Phase 2: FSM Engine & SQLite:** Atomic state machine dispatcher with transaction rollback.
- [x] **Phase 3: Event Streaming:** FastAPI daemon producing telemetry to Apache Kafka.
- [x] **Phase 4: OLAP Warehouse:** ClickHouse database tracking all historical execution metrics.
- [x] **Phase 5: Frontend BI:** Next.js App Router querying ClickHouse for daily ledger arrays.
- [x] **Phase 6: Data Lake & ETL:** PySpark streaming application writing to MinIO.
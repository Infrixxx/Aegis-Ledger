import Database, { type Database as SqliteDatabase } from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "path";
import * as schema from "./schema";

const dbPath = path.resolve(process.cwd(), "aegis.db");
const sqlite: SqliteDatabase = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS system_state (
    id INTEGER PRIMARY KEY,
    current_state TEXT NOT NULL DEFAULT 'IDLE',
    active_setup_id TEXT,
    active_ticket INTEGER,
    lockout_release_utc TEXT,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS setups (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    d1_macro_trend INTEGER NOT NULL,
    h4_structure_alignment INTEGER NOT NULL,
    h1_intermediate_trend INTEGER NOT NULL,
    m30_support_resistance INTEGER NOT NULL,
    m15_execution_trigger INTEGER NOT NULL,
    bull_thesis TEXT NOT NULL,
    bear_thesis TEXT NOT NULL,
    bias TEXT NOT NULL,
    account_balance REAL NOT NULL,
    risk_amount_currency REAL NOT NULL,
    entry_price REAL NOT NULL,
    stop_loss_price REAL NOT NULL,
    take_profit_price REAL NOT NULL,
    is_locked INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS trades (
    ticket INTEGER PRIMARY KEY,
    setup_id TEXT,
    symbol TEXT NOT NULL,
    order_type TEXT NOT NULL,
    volume REAL NOT NULL,
    price_open REAL NOT NULL,
    price_close REAL,
    sl_price REAL NOT NULL,
    tp_price REAL NOT NULL,
    open_timestamp_utc TEXT NOT NULL,
    close_timestamp_utc TEXT,
    net_profit REAL,
    realized_r REAL,
    outcome TEXT,
    setup_compliant INTEGER,
    risk_compliant INTEGER,
    execution_compliant INTEGER,
    is_fully_compliant INTEGER,
    notes TEXT,
    FOREIGN KEY (setup_id) REFERENCES setups(id)
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp_utc TEXT NOT NULL,
    previous_state TEXT NOT NULL,
    new_state TEXT NOT NULL,
    triggered_event TEXT NOT NULL,
    metadata_json TEXT
  );

  INSERT OR IGNORE INTO system_state (id, current_state, updated_at)
  VALUES (1, 'IDLE', strftime('%Y-%m-%dT%H:%M:%SZ', 'now'));
`);

export const db = drizzle(sqlite, { schema });
export * from "./schema";
export * from "./warehouse";
export { sqlite };
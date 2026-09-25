import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const systemStateTable = sqliteTable("system_state", {
  id: integer("id").primaryKey(),
  currentState: text("current_state").notNull().default("IDLE"),
  activeSetupId: text("active_setup_id"),
  activeTicket: integer("active_ticket"),
  lockoutReleaseUtc: text("lockout_release_utc"),
  updatedAt: text("updated_at").notNull(),
});

export const setupsTable = sqliteTable("setups", {
  id: text("id").primaryKey(),
  createdAt: text("created_at").notNull(),
  d1MacroTrend: integer("d1_macro_trend", { mode: "boolean" }).notNull(),
  h4StructureAlignment: integer("h4_structure_alignment", { mode: "boolean" }).notNull(),
  h1IntermediateTrend: integer("h1_intermediate_trend", { mode: "boolean" }).notNull(),
  m30SupportResistance: integer("m30_support_resistance", { mode: "boolean" }).notNull(),
  m15ExecutionTrigger: integer("m15_execution_trigger", { mode: "boolean" }).notNull(),
  bullThesis: text("bull_thesis").notNull(),
  bearThesis: text("bear_thesis").notNull(),
  bias: text("bias").notNull(),
  accountBalance: real("account_balance").notNull(),
  riskAmountCurrency: real("risk_amount_currency").notNull(),
  entryPrice: real("entry_price").notNull(),
  stopLossPrice: real("stop_loss_price").notNull(),
  takeProfitPrice: real("take_profit_price").notNull(),
  isLocked: integer("is_locked", { mode: "boolean" }).notNull().default(false),
});

export const tradesTable = sqliteTable("trades", {
  ticket: integer("ticket").primaryKey(),
  setupId: text("setup_id").references(() => setupsTable.id),
  symbol: text("symbol").notNull(),
  orderType: text("order_type").notNull(),
  volume: real("volume").notNull(),
  priceOpen: real("price_open").notNull(),
  priceClose: real("price_close"),
  slPrice: real("sl_price").notNull(),
  tpPrice: real("tp_price").notNull(),
  openTimestampUtc: text("open_timestamp_utc").notNull(),
  closeTimestampUtc: text("close_timestamp_utc"),
  netProfit: real("net_profit"),
  realizedR: real("realized_r"),
  outcome: text("outcome"),
  setupCompliant: integer("setup_compliant", { mode: "boolean" }),
  riskCompliant: integer("risk_compliant", { mode: "boolean" }),
  executionCompliant: integer("execution_compliant", { mode: "boolean" }),
  isFullyCompliant: integer("is_fully_compliant", { mode: "boolean" }),
  notes: text("notes"),
});

export const auditLogsTable = sqliteTable("audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  timestampUtc: text("timestamp_utc").notNull(),
  previousState: text("previous_state").notNull(),
  newState: text("new_state").notNull(),
  triggeredEvent: text("triggered_event").notNull(),
  metadataJson: text("metadata_json"),
});

export type SystemStateRecord = typeof systemStateTable.$inferSelect;
export type SetupRecord = typeof setupsTable.$inferSelect;
export type TradeRecord = typeof tradesTable.$inferSelect;
export type AuditLogRecord = typeof auditLogsTable.$inferSelect;
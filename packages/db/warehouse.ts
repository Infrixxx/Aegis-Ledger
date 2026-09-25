import { createClient } from "@clickhouse/client";

export const warehouseClient = createClient({
  host: process.env.CLICKHOUSE_HOST ?? "http://localhost:8123",
  username: process.env.CLICKHOUSE_USER ?? "aegis_user",
  password: process.env.CLICKHOUSE_PASSWORD ?? "aegis_dw_password",
  database: "aegis_analytics",
});

export interface OHLCVBar {
  symbol: string;
  bar_time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  tick_count: number;
}

export async function fetchOHLCV(symbol: string, limit: number = 100): Promise<OHLCVBar[]> {
  const resultSet = await warehouseClient.query({
    query: `
      SELECT 
        symbol,
        formatDateTime(bar_time, '%Y-%m-%dT%H:%i:%sZ') AS bar_time,
        open,
        high,
        low,
        close,
        volume,
        tick_count
      FROM aegis_analytics.ohlcv_1m
      WHERE symbol = {symbol: String}
      ORDER BY bar_time DESC
      LIMIT {limit: UInt32}
    `,
    query_params: { symbol, limit },
    format: "JSONEachRow",
  });

  return await resultSet.json<OHLCVBar>();
}

export async function queryAccountDrawdownMetrics(accountNumber: number) {
  const resultSet = await warehouseClient.query({
    query: `
      SELECT 
        account_number,
        min(balance) AS min_balance,
        max(balance) AS max_balance,
        sum(net_profit) AS total_realized_pnl,
        count(ticket) AS total_trades
      FROM aegis_analytics.fsm_trade_events
      WHERE account_number = {accountNumber: UInt64}
        AND event_type = 'POSITION_CLOSED'
      GROUP BY account_number
    `,
    query_params: { accountNumber },
    format: "JSONEachRow",
  });

  return await resultSet.json<any>();
}
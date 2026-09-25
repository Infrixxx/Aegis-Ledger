import { NextResponse } from "next/server";
import { warehouseClient } from "@aegis/db/warehouse";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const resultSet = await warehouseClient.query({
      query: `
        SELECT 
          ticket,
          symbol,
          order_type AS orderType,
          volume,
          price_open AS priceOpen,
          price_close AS priceClose,
          price_sl AS slPrice,
          price_tp AS tpPrice,
          formatDateTime(event_time, '%Y-%m-%dT%H:%i:%sZ') AS openTimestampUtc,
          formatDateTime(event_time, '%Y-%m-%dT%H:%i:%sZ') AS closeTimestampUtc,
          net_profit AS netProfit
        FROM aegis_analytics.fsm_trade_events
        WHERE event_type = 'POSITION_CLOSED'
        ORDER BY event_time DESC
      `,
      format: "JSONEachRow",
    });

    const rows = await resultSet.json<any>();

    const dailyGroups: Record<string, any> = {};

    for (const row of rows) {
      const dateStr = (row.closeTimestampUtc || row.openTimestampUtc).split("T")[0];
      
      if (!dailyGroups[dateStr]) {
        dailyGroups[dateStr] = {
          date: dateStr,
          netProfit: 0,
          totalTrades: 0,
          compliantTrades: 0,
          trades: [],
        };
      }

      const pnl = row.netProfit ?? 0;
      dailyGroups[dateStr].netProfit += pnl;
      dailyGroups[dateStr].totalTrades += 1;
      
      dailyGroups[dateStr].trades.push(row);
    }

    const calendar = Object.values(dailyGroups).sort((a: any, b: any) => b.date.localeCompare(a.date));

    return NextResponse.json({ calendar, allTrades: rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
import { z } from "zod";

export const PositionOpenedPayloadSchema = z.object({
  event_type: z.literal("POSITION_OPENED"),
  broker_time_msc: z.number().int().positive(),
  account_number: z.number().int().positive(),
  ticket: z.number().int().positive(),
  symbol: z.string().min(1),
  order_type: z.enum(["BUY", "SELL"]),
  volume: z.number().positive(),
  price_open: z.number().positive(),
  price_sl: z.number().positive(),
  price_tp: z.number().positive(),
  balance: z.number().positive(),
  equity: z.number().positive(),
});
export type PositionOpenedPayload = z.infer<typeof PositionOpenedPayloadSchema>;

export const PositionClosedPayloadSchema = z.object({
  event_type: z.literal("POSITION_CLOSED"),
  broker_time_msc: z.number().int().positive(),
  account_number: z.number().int().positive(),
  ticket: z.number().int().positive(),
  symbol: z.string().min(1),
  price_close: z.number().positive(),
  realized_profit: z.number(),
  commission: z.number(),
  swap: z.number(),
  net_profit: z.number(),
  balance: z.number().positive(),
  equity: z.number().positive(),
});
export type PositionClosedPayload = z.infer<typeof PositionClosedPayloadSchema>;

export const TelemetryPayloadSchema = z.discriminatedUnion("event_type", [
  PositionOpenedPayloadSchema,
  PositionClosedPayloadSchema,
]);
export type TelemetryPayload = z.infer<typeof TelemetryPayloadSchema>;

export const CircuitStatusResponseSchema = z.object({
  circuit_breaker_active: z.boolean(),
  remaining_lockout_seconds: z.number().int().nonnegative(),
  reason: z.string(),
});
export type CircuitStatusResponse = z.infer<typeof CircuitStatusResponseSchema>;
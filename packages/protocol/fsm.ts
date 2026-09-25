import { z } from "zod";
import { TradeOutcome } from "./domain";

export const SystemStateSchema = z.enum([
  "IDLE",
  "PRE_FLIGHT",
  "IN_PROGRESS",
  "POST_MORTEM",
  "LOCKED_CIRCUIT_BREAKER",
]);
export type SystemState = z.infer<typeof SystemStateSchema>;

export const StateEventSchema = z.enum([
  "INITIATE_SETUP",
  "ABORT_SETUP",
  "POSITION_OPENED",
  "POSITION_CLOSED",
  "FINALIZE_TRADE",
  "RESET_CIRCUIT_BREAKER",
]);
export type StateEvent = z.infer<typeof StateEventSchema>;

export const VALID_TRANSITIONS: Record<SystemState, readonly SystemState[]> = {
  IDLE: ["PRE_FLIGHT", "LOCKED_CIRCUIT_BREAKER"],
  PRE_FLIGHT: ["IN_PROGRESS", "IDLE"],
  IN_PROGRESS: ["POST_MORTEM"],
  POST_MORTEM: ["IDLE", "LOCKED_CIRCUIT_BREAKER"],
  LOCKED_CIRCUIT_BREAKER: ["IDLE"],
} as const;

export function canTransition(currentState: SystemState, nextState: SystemState): boolean {
  return VALID_TRANSITIONS[currentState]?.includes(nextState) ?? false;
}

export function shouldTriggerCircuitBreaker(outcome: TradeOutcome, realizedR: number): boolean {
  return outcome === "LOSS" || realizedR < 0;
}

export function calculateRemainingLockoutSeconds(now: Date = new Date()): number {
  const nextMidnightUtc = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0)
  );
  const diffMs = nextMidnightUtc.getTime() - now.getTime();
  return Math.max(0, Math.floor(diffMs / 1000));
}
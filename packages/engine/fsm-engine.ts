import { eq } from "drizzle-orm";
import {
  db,
  systemStateTable,
  setupsTable,
  tradesTable,
  auditLogsTable,
  type SystemStateRecord,
} from "@aegis/db";
import {
  type SystemState,
  type StateEvent,
  canTransition,
  shouldTriggerCircuitBreaker,
  type PositionOpenedPayload,
  type PositionClosedPayload,
  type PostMortem,
  calculateCompliance,
  type MultiTimeframeChecklist,
  type DialecticalAnalysis,
  type RiskValidation,
} from "@aegis/protocol";

export interface SetupDraftInput {
  checklist: MultiTimeframeChecklist;
  dialectical: DialecticalAnalysis;
  risk: RiskValidation;
}

export class FsmEngine {
  public static async getState(): Promise<SystemStateRecord> {
    const records = await db
      .select()
      .from(systemStateTable)
      .where(eq(systemStateTable.id, 1))
      .limit(1);

    if (!records.length) {
      const nowUtc = new Date().toISOString();
      await db.insert(systemStateTable).values({
        id: 1,
        currentState: "IDLE",
        updatedAt: nowUtc,
      });
      return {
        id: 1,
        currentState: "IDLE",
        activeSetupId: null,
        activeTicket: null,
        lockoutReleaseUtc: null,
        updatedAt: nowUtc,
      };
    }

    const state = records[0];

    if (state.currentState === "LOCKED_CIRCUIT_BREAKER" && state.lockoutReleaseUtc) {
      const now = new Date();
      const releaseTime = new Date(state.lockoutReleaseUtc);

      if (now >= releaseTime) {
        return await FsmEngine.executeTransition("IDLE", "RESET_CIRCUIT_BREAKER", {
          activeSetupId: null,
          activeTicket: null,
          lockoutReleaseUtc: null,
        });
      }
    }

    return state;
  }

  private static async executeTransition(
    nextState: SystemState,
    event: StateEvent,
    updates: Partial<SystemStateRecord>,
    metadata?: Record<string, unknown>
  ): Promise<SystemStateRecord> {
    const currentStateRecord = await db
      .select()
      .from(systemStateTable)
      .where(eq(systemStateTable.id, 1))
      .limit(1);

    const prevState = (currentStateRecord[0]?.currentState as SystemState) ?? "IDLE";

    if (!canTransition(prevState, nextState)) {
      throw new Error(`Illegal FSM transition rejected: ${prevState} -> ${nextState} via ${event}`);
    }

    const nowUtc = new Date().toISOString();

    await db.transaction(async (tx) => {
      await tx
        .update(systemStateTable)
        .set({
          currentState: nextState,
          updatedAt: nowUtc,
          ...updates,
        })
        .where(eq(systemStateTable.id, 1));

      await tx.insert(auditLogsTable).values({
        timestampUtc: nowUtc,
        previousState: prevState,
        newState: nextState,
        triggeredEvent: event,
        metadataJson: metadata ? JSON.stringify(metadata) : null,
      });
    });

    const updated = await db
      .select()
      .from(systemStateTable)
      .where(eq(systemStateTable.id, 1))
      .limit(1);

    return updated[0];
  }

  public static async initiateSetup(id: string, input: SetupDraftInput): Promise<SystemStateRecord> {
    const current = await FsmEngine.getState();
    if (current.currentState !== "IDLE") {
      throw new Error(`Cannot initiate pre-flight while state is ${current.currentState}`);
    }

    const nowUtc = new Date().toISOString();

    await db.insert(setupsTable).values({
      id,
      createdAt: nowUtc,
      d1MacroTrend: input.checklist.d1MacroTrend,
      h4StructureAlignment: input.checklist.h4StructureAlignment,
      h1IntermediateTrend: input.checklist.h1IntermediateTrend,
      m30SupportResistance: input.checklist.m30SupportResistance,
      m15ExecutionTrigger: input.checklist.m15ExecutionTrigger,
      bullThesis: input.dialectical.bullThesis,
      bearThesis: input.dialectical.bearThesis,
      bias: input.dialectical.bias,
      accountBalance: input.risk.accountBalance,
      riskAmountCurrency: input.risk.riskAmountCurrency,
      entryPrice: input.risk.entryPrice,
      stopLossPrice: input.risk.stopLossPrice,
      takeProfitPrice: input.risk.takeProfitPrice,
      isLocked: false,
    });

    return await FsmEngine.executeTransition("PRE_FLIGHT", "INITIATE_SETUP", {
      activeSetupId: id,
    });
  }

  public static async abortSetup(reason: string): Promise<SystemStateRecord> {
    const current = await FsmEngine.getState();
    if (current.currentState !== "PRE_FLIGHT") {
      throw new Error(`Cannot abort setup while state is ${current.currentState}`);
    }

    return await FsmEngine.executeTransition(
      "IDLE",
      "ABORT_SETUP",
      { activeSetupId: null },
      { reason }
    );
  }

  public static async handlePositionOpened(payload: PositionOpenedPayload): Promise<SystemStateRecord> {
    const current = await FsmEngine.getState();

    if (current.currentState !== "PRE_FLIGHT" || !current.activeSetupId) {
      throw new Error("POSITION_OPENED rejected: No active pre-flight draft exists in State 1");
    }

    const nowUtc = new Date(payload.broker_time_msc).toISOString();

    await db.transaction(async (tx) => {
      await tx
        .update(setupsTable)
        .set({ isLocked: true })
        .where(eq(setupsTable.id, current.activeSetupId!));

      await tx.insert(tradesTable).values({
        ticket: payload.ticket,
        setupId: current.activeSetupId,
        symbol: payload.symbol,
        orderType: payload.order_type,
        volume: payload.volume,
        priceOpen: payload.price_open,
        slPrice: payload.price_sl,
        tpPrice: payload.price_tp,
        openTimestampUtc: nowUtc,
      });
    });

    return await FsmEngine.executeTransition("IN_PROGRESS", "POSITION_OPENED", {
      activeTicket: payload.ticket,
    });
  }

  public static async handlePositionClosed(payload: PositionClosedPayload): Promise<SystemStateRecord> {
    const current = await FsmEngine.getState();

    if (current.currentState !== "IN_PROGRESS" || current.activeTicket !== payload.ticket) {
      throw new Error(`POSITION_CLOSED rejected: Mismatched ticket or state is not IN_PROGRESS`);
    }

    const nowUtc = new Date(payload.broker_time_msc).toISOString();

    await db
      .update(tradesTable)
      .set({
        priceClose: payload.price_close,
        netProfit: payload.net_profit,
        closeTimestampUtc: nowUtc,
      })
      .where(eq(tradesTable.ticket, payload.ticket));

    return await FsmEngine.executeTransition("POST_MORTEM", "POSITION_CLOSED", {});
  }

  public static async finalizeTrade(postMortem: PostMortem): Promise<SystemStateRecord> {
    const current = await FsmEngine.getState();

    if (current.currentState !== "POST_MORTEM" || !current.activeTicket) {
      throw new Error("FINALIZE_TRADE rejected: Application is not in POST_MORTEM state");
    }

    const isFullyCompliant = calculateCompliance(postMortem);
    const triggerBreaker = shouldTriggerCircuitBreaker(postMortem.outcome, postMortem.realizedR);

    await db
      .update(tradesTable)
      .set({
        outcome: postMortem.outcome,
        realizedR: postMortem.realizedR,
        setupCompliant: postMortem.setupCompliant,
        riskCompliant: postMortem.riskCompliant,
        executionCompliant: postMortem.executionCompliant,
        isFullyCompliant,
        notes: postMortem.notes,
      })
      .where(eq(tradesTable.ticket, current.activeTicket));

    if (triggerBreaker) {
      const now = new Date();
      const nextMidnightUtc = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0)
      ).toISOString();

      return await FsmEngine.executeTransition("LOCKED_CIRCUIT_BREAKER", "FINALIZE_TRADE", {
        activeSetupId: null,
        activeTicket: null,
        lockoutReleaseUtc: nextMidnightUtc,
      });
    }

    return await FsmEngine.executeTransition("IDLE", "FINALIZE_TRADE", {
      activeSetupId: null,
      activeTicket: null,
      lockoutReleaseUtc: null,
    });
  }
}
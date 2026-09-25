import { NextResponse } from "next/server";
import { FsmEngine } from "@aegis/engine";
import { type CircuitStatusResponse } from "@aegis/protocol";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = await FsmEngine.getState();
    const isLocked = state.currentState === "LOCKED_CIRCUIT_BREAKER";
    let remaining = 0;

    if (isLocked && state.lockoutReleaseUtc) {
      const now = new Date();
      const release = new Date(state.lockoutReleaseUtc);
      remaining = Math.max(0, Math.floor((release.getTime() - now.getTime()) / 1000));
    }

    const responsePayload: CircuitStatusResponse = {
      circuit_breaker_active: isLocked,
      remaining_lockout_seconds: remaining,
      reason: isLocked ? "Daily loss limit reached. Trading suspended until 00:00 UTC." : "Operational",
    };

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
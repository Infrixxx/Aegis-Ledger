import { NextResponse } from "next/server";
import { FsmEngine } from "@aegis/engine";
import { db, systemStateTable } from "@aegis/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = await FsmEngine.getState();
    return NextResponse.json(state);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (body.action === "INITIATE") {
      const id = crypto.randomUUID();
      const res = await FsmEngine.initiateSetup(id, body.payload);
      return NextResponse.json(res);
    } 
    
    if (body.action === "ABORT") {
      const res = await FsmEngine.abortSetup(body.payload?.reason || "User aborted via UI");
      return NextResponse.json(res);
    } 
    
    if (body.action === "FINALIZE") {
      const res = await FsmEngine.finalizeTrade(body.payload);
      return NextResponse.json(res);
    }

    if (body.action === "RESET_LOCKOUT") {
      const nowUtc = new Date().toISOString();
      await db.update(systemStateTable).set({
        currentState: "IDLE",
        activeSetupId: null,
        activeTicket: null,
        lockoutReleaseUtc: null,
        updatedAt: nowUtc,
      }).where(eq(systemStateTable.id, 1));
      const res = await FsmEngine.getState();
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: "Unknown action parameter" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
import { NextResponse } from "next/server";
import { TelemetryPayloadSchema } from "@aegis/protocol";
import { FsmEngine } from "@aegis/engine";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = TelemetryPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid telemetry payload", details: parsed.error.issues }, { status: 400 });
    }

    const payload = parsed.data;

    if (payload.event_type === "POSITION_OPENED") {
      await FsmEngine.handlePositionOpened(payload);
    } else if (payload.event_type === "POSITION_CLOSED") {
      await FsmEngine.handlePositionClosed(payload);
    }

    return NextResponse.json({ success: true, processed_event: payload.event_type });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
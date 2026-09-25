"use client";
import { useState, useEffect } from "react";
import { ShieldAlert, Activity, CheckSquare, Lock, XCircle, Terminal } from "lucide-react";

export default function AegisDashboard() {
  const [fsmState, setFsmState] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchState = async () => {
    const res = await fetch("/api/fsm");
    const data = await res.json();
    setFsmState(data);
    setLoading(false);
  };

  // Poll state every 3 seconds to catch MQL5 telemetry updates (State 1 -> 2 -> 3)
  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, []);

  const mutateFsm = async (action: string, payload: any = {}) => {
    setLoading(true);
    await fetch("/api/fsm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload }),
    });
    await fetchState();
  };

  if (loading && !fsmState) return <div className="p-8 text-gray-400">Loading Aegis FSM...</div>;

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-8">
      <header className="flex items-center justify-between border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="text-blue-500" /> Aegis Ledger
          </h1>
          <p className="text-gray-400 text-sm mt-1">Behavioral Execution Firewall</p>
        </div>
        <div className="bg-gray-900 px-4 py-2 rounded-md border border-gray-800 flex items-center gap-2 font-mono text-sm">
          <Activity className="w-4 h-4 text-blue-400" />
          STATE: <span className="text-blue-400 font-bold">{fsmState?.currentState}</span>
        </div>
      </header>

      {/* State 0: IDLE */}
      {fsmState?.currentState === "IDLE" && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center space-y-4">
          <CheckSquare className="w-12 h-12 text-gray-500 mx-auto" />
          <h2 className="text-xl font-semibold">System Idle & Ready</h2>
          <p className="text-gray-400 max-w-md mx-auto">
            Process compliance is paramount. Ensure you are mentally calibrated before initiating the pre-flight gatekeeper.
          </p>
          <button 
            onClick={() => mutateFsm("INITIATE", {
              checklist: { d1MacroTrend: true, h4StructureAlignment: true, h1IntermediateTrend: true, m30SupportResistance: true, m15ExecutionTrigger: true },
              dialectical: { bullThesis: "Market is holding D1 support.", bearThesis: "H1 is making lower lows.", bias: "BUY" },
              risk: { accountBalance: 10000, riskAmountCurrency: 100, entryPrice: 1.0500, stopLossPrice: 1.0450, takeProfitPrice: 1.0650, slAtStructuralFailure: true, direction: "BUY" }
            })}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-semibold mt-4"
          >
            Initiate Pre-Flight Checklist
          </button>
        </div>
      )}

      {/* State 1: PRE_FLIGHT */}
      {fsmState?.currentState === "PRE_FLIGHT" && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-gray-800 pb-4">
            <h2 className="text-xl font-semibold">Pre-Flight Gatekeeper</h2>
            <span className="text-xs bg-yellow-900/50 text-yellow-500 px-2 py-1 rounded border border-yellow-800">AWAITING MQL5 TELEMETRY</span>
          </div>
          <div className="p-4 bg-gray-950 border border-gray-800 rounded text-sm text-gray-400 font-mono">
            Draft Setup ID: {fsmState.activeSetupId}<br/>
            Waiting for MT5 broker execution. Once POSITION_OPENED telemetry is received, this setup will be permanently locked.
          </div>
          <button 
            onClick={() => mutateFsm("ABORT")}
            className="w-full bg-gray-800 hover:bg-red-900/50 hover:text-red-400 text-gray-300 transition-colors border border-gray-700 hover:border-red-800 px-4 py-3 rounded-md flex items-center justify-center gap-2"
          >
            <XCircle className="w-5 h-5" /> Abort Setup & Return to Idle
          </button>
        </div>
      )}

      {/* State 2: IN_PROGRESS */}
      {fsmState?.currentState === "IN_PROGRESS" && (
        <div className="bg-blue-950/20 border border-blue-900/50 rounded-xl p-6 text-center space-y-4">
          <Terminal className="w-12 h-12 text-blue-500 mx-auto animate-pulse" />
          <h2 className="text-xl font-semibold text-blue-400">The Void: Execution Locked</h2>
          <p className="text-gray-400">
            Active Ticket: <span className="font-mono text-gray-200">{fsmState.activeTicket}</span>
          </p>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Pre-flight parameters are now immutable. Awaiting POSITION_CLOSED telemetry from MetaTrader 5 to proceed to Post-Mortem.
          </p>
        </div>
      )}

      {/* State 3: POST_MORTEM */}
      {fsmState?.currentState === "POST_MORTEM" && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
          <h2 className="text-xl font-semibold border-b border-gray-800 pb-4">Post-Mortem Autopsy</h2>
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">Execution complete. Grade your compliance to finalize the journal entry.</p>
            <button 
              onClick={() => mutateFsm("FINALIZE", {
                setupCompliant: true, riskCompliant: true, executionCompliant: true,
                outcome: "LOSS", realizedR: -1.0, netProfitCurrency: -100,
                notes: "Followed plan perfectly, market structurally shifted.", isLocked: true
              })}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-md border border-gray-700"
            >
              Simulate & Finalize (Loss = -1R)
            </button>
            <button 
              onClick={() => mutateFsm("FINALIZE", {
                setupCompliant: true, riskCompliant: true, executionCompliant: true,
                outcome: "WIN", realizedR: 2.5, netProfitCurrency: 250,
                notes: "Target hit cleanly.", isLocked: true
              })}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md"
            >
              Simulate & Finalize (Win = +2.5R)
            </button>
          </div>
        </div>
      )}

      {/* State 4: LOCKED_CIRCUIT_BREAKER */}
      {fsmState?.currentState === "LOCKED_CIRCUIT_BREAKER" && (
        <div className="bg-red-950/30 border border-red-900 rounded-xl p-8 text-center space-y-4">
          <Lock className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-500">Circuit Breaker Active</h2>
          <p className="text-red-400 max-w-md mx-auto">
            Daily loss limit breached. The OS containment daemon has been signaled to terminate your broker terminal.
          </p>
          <div className="bg-red-950/50 p-4 rounded mt-6 inline-block border border-red-900">
            <span className="block text-sm text-red-300 uppercase tracking-widest mb-1">Lockout Lifts At</span>
            <span className="text-2xl font-mono text-white">{new Date(fsmState.lockoutReleaseUtc).toUTCString()}</span>
          </div>
        </div>
      )}
    </main>
  );
}
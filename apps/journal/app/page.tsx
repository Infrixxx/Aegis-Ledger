"use client";
import { useState, useEffect } from "react";
import { 
  ShieldAlert, Activity, CheckSquare, Lock, XCircle, 
  Terminal, Calendar, BookOpen, ChevronRight, RotateCcw, AlertTriangle 
} from "lucide-react";

export default function AegisDashboard() {
  const [activeTab, setActiveTab] = useState<"firewall" | "ledger">("firewall");
  const [fsmState, setFsmState] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [ledgerData, setLedgerData] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState<any>(null);

  const [checks, setChecks] = useState({ d1: false, h4: false, h1: false, m30: false, m15: false });
  const [theses, setTheses] = useState({ bull: "", bear: "", bias: "BUY" });
  const [risk, setRisk] = useState({ balance: 1000, riskAmount: 10, entry: 1.0850, sl: 1.0830, tp: 1.0890 });

  const fetchState = async () => {
    const res = await fetch("/api/fsm");
    const data = await res.json();
    setFsmState(data);
    setLoading(false);
  };

  const fetchLedger = async () => {
    const res = await fetch("/api/trades");
    const data = await res.json();
    if (data.calendar) {
      setLedgerData(data.calendar);
      if (!selectedDay && data.calendar.length > 0) {
        setSelectedDay(data.calendar[0]);
      }
    }
  };

  useEffect(() => {
    fetchState();
    fetchLedger();
    const interval = setInterval(() => {
      fetchState();
      fetchLedger();
    }, 3000);
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
    await fetchLedger();
  };

  const riskDist = Math.abs(risk.entry - risk.sl);
  const rewardDist = Math.abs(risk.tp - risk.entry);
  const calculatedRR = riskDist > 0 ? (rewardDist / riskDist).toFixed(2) : "0.00";
  
  const allChecksPassed = Object.values(checks).every(Boolean);
  const thesesValid = theses.bull.trim().length >= 20 && theses.bear.trim().length >= 20;
  const rrValid = parseFloat(calculatedRR) >= 2.0;
  const isFormValid = allChecksPassed && thesesValid && rrValid;

  const handleInitiate = () => {
    if (!isFormValid) return;
    mutateFsm("INITIATE", {
      checklist: { 
        d1MacroTrend: checks.d1, 
        h4StructureAlignment: checks.h4, 
        h1IntermediateTrend: checks.h1, 
        m30SupportResistance: checks.m30, 
        m15ExecutionTrigger: checks.m15 
      },
      dialectical: { bullThesis: theses.bull, bearThesis: theses.bear, bias: theses.bias },
      risk: { 
        accountBalance: risk.balance, 
        riskAmountCurrency: risk.riskAmount, 
        entryPrice: risk.entry, 
        stopLossPrice: risk.sl, 
        takeProfitPrice: risk.tp, 
        slAtStructuralFailure: true, 
        direction: theses.bias 
      }
    });
  };

  if (loading && !fsmState) return <div className="p-8 text-gray-400 font-mono">Initializing Aegis Telemetry Engine...</div>;

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between border-b border-gray-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="text-blue-500" /> Aegis Ledger
          </h1>
          <p className="text-gray-400 text-sm mt-1">Behavioral Execution Firewall & Daily Performance Journal</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-gray-900 px-4 py-2 rounded-md border border-gray-800 flex items-center gap-2 font-mono text-sm">
            <Activity className="w-4 h-4 text-blue-400" />
            STATE: <span className="text-blue-400 font-bold">{fsmState?.currentState}</span>
          </div>
        </div>
      </header>

      <div className="flex border-b border-gray-800 space-x-4">
        <button
          onClick={() => setActiveTab("firewall")}
          className={`pb-3 px-2 flex items-center gap-2 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === "firewall"
              ? "border-blue-500 text-white"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <Terminal className="w-4 h-4" /> Execution Firewall
        </button>
        <button
          onClick={() => { setActiveTab("ledger"); fetchLedger(); }}
          className={`pb-3 px-2 flex items-center gap-2 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === "ledger"
              ? "border-blue-500 text-white"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <BookOpen className="w-4 h-4" /> Daily Ledger & History
        </button>
      </div>

      {activeTab === "firewall" && (
        <div className="space-y-6">
          {fsmState?.currentState === "IDLE" && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 space-y-8">
              <div className="border-b border-gray-800 pb-4 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">Pre-Flight Gatekeeper</h2>
                  <p className="text-sm text-gray-400">Complete all sequential validation barriers to authorize trade telemetry.</p>
                </div>
                <span className="text-xs font-mono bg-blue-950 text-blue-400 border border-blue-800 px-3 py-1 rounded">STAGE 1 / 3</span>
              </div>

              <section className="space-y-3">
                <h3 className="text-gray-400 text-xs uppercase tracking-wider font-semibold">1. Multi-Timeframe Structural Sweep (Mandatory)</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { id: 'd1', label: 'D1 Macro Trend' }, 
                    { id: 'h4', label: 'H4 Structure' }, 
                    { id: 'h1', label: 'H1 Int. Trend' }, 
                    { id: 'm30', label: 'M30 S/R Zones' }, 
                    { id: 'm15', label: 'M15 Exec Trigger' }
                  ].map(chk => (
                    <label 
                      key={chk.id} 
                      className={`flex flex-col items-center justify-center p-3 border rounded cursor-pointer transition-colors ${
                        checks[chk.id as keyof typeof checks] 
                          ? 'bg-blue-900/30 border-blue-500 text-blue-300' 
                          : 'bg-gray-950 border-gray-800 text-gray-500 hover:border-gray-700'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={checks[chk.id as keyof typeof checks]} 
                        onChange={(e) => setChecks({...checks, [chk.id]: e.target.checked})} 
                      />
                      <span className="text-xs font-bold text-center">{chk.label}</span>
                      <span className="text-[10px] mt-1">{checks[chk.id as keyof typeof checks] ? "✓ VERIFIED" : "PENDING"}</span>
                    </label>
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-gray-400 text-xs uppercase tracking-wider font-semibold">2. Dialectical Friction (Cognitive Latency)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-green-400 mb-1">Bull Thesis (Min 20 characters)</label>
                    <textarea 
                      className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-sm text-gray-200 focus:border-blue-500 outline-none" 
                      rows={3} 
                      value={theses.bull} 
                      onChange={e => setTheses({...theses, bull: e.target.value})} 
                      placeholder="Detail technical long argument..." 
                    />
                    <span className="text-[10px] text-gray-500">{theses.bull.length}/20 chars</span>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-red-400 mb-1">Bear Thesis (Min 20 characters)</label>
                    <textarea 
                      className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-sm text-gray-200 focus:border-blue-500 outline-none" 
                      rows={3} 
                      value={theses.bear} 
                      onChange={e => setTheses({...theses, bear: e.target.value})} 
                      placeholder="Detail invalidation risks..." 
                    />
                    <span className="text-[10px] text-gray-500">{theses.bear.length}/20 chars</span>
                  </div>
                </div>
                <div className="pt-2">
                  <label className="block text-xs font-medium text-gray-400 mb-1">Execution Bias</label>
                  <select 
                    className="w-full bg-gray-950 border border-gray-800 rounded p-2.5 text-sm text-gray-200 focus:border-blue-500 outline-none" 
                    value={theses.bias} 
                    onChange={e => setTheses({...theses, bias: e.target.value})}
                  >
                    <option value="BUY">Bias: BUY (Long)</option>
                    <option value="SELL">Bias: SELL (Short)</option>
                    <option value="NO_TRADE_CHOP">NO_TRADE_CHOP (Abort Session)</option>
                  </select>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-gray-400 text-xs uppercase tracking-wider font-semibold">3. Mathematical Compliance (Min 1:2 R:R)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Planned Entry Price</label>
                    <input 
                      type="number" 
                      step="0.0001"
                      className="w-full bg-gray-950 border border-gray-800 rounded p-2.5 text-sm" 
                      value={risk.entry} 
                      onChange={e => setRisk({...risk, entry: parseFloat(e.target.value) || 0})} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Structural Stop Loss</label>
                    <input 
                      type="number" 
                      step="0.0001"
                      className="w-full bg-gray-950 border border-gray-800 rounded p-2.5 text-sm" 
                      value={risk.sl} 
                      onChange={e => setRisk({...risk, sl: parseFloat(e.target.value) || 0})} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Take Profit Target</label>
                    <input 
                      type="number" 
                      step="0.0001"
                      className="w-full bg-gray-950 border border-gray-800 rounded p-2.5 text-sm" 
                      value={risk.tp} 
                      onChange={e => setRisk({...risk, tp: parseFloat(e.target.value) || 0})} 
                    />
                  </div>
                </div>
                <div className={`p-4 rounded border font-mono text-sm flex justify-between items-center ${
                  rrValid ? 'bg-green-950/20 border-green-800 text-green-400' : 'bg-red-950/20 border-red-800 text-red-400'
                }`}>
                  <span>Calculated Risk-to-Reward Ratio:</span>
                  <span className="font-bold text-base">1 : {calculatedRR} {rrValid ? "✓ VALID" : "(MIN 1:2.0 REQUIRED)"}</span>
                </div>
              </section>

              <button 
                disabled={!isFormValid || theses.bias === "NO_TRADE_CHOP"}
                onClick={handleInitiate}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white p-4 rounded-md font-bold transition-all text-sm tracking-wide uppercase"
              >
                {theses.bias === "NO_TRADE_CHOP" 
                  ? "Execution Aborted (Chop Filter Active)"
                  : isFormValid 
                    ? "Lock Pre-Flight & Authorize Telemetry" 
                    : "Complete Mandatory Verification Gates to Unlock"}
              </button>
            </div>
          )}

          {fsmState?.currentState === "PRE_FLIGHT" && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-gray-800 pb-4">
                <div>
                  <h2 className="text-xl font-semibold">Pre-Flight Gatekeeper Authorized</h2>
                  <p className="text-sm text-gray-400">Waiting for real-time MT5 deal fill telemetry.</p>
                </div>
                <span className="text-xs bg-yellow-900/50 text-yellow-500 px-3 py-1 rounded border border-yellow-800 font-mono animate-pulse">
                  AWAITING MQL5 TELEMETRY
                </span>
              </div>
              <div className="p-4 bg-gray-950 border border-gray-800 rounded text-sm text-gray-300 font-mono space-y-1">
                <p>ACTIVE SETUP DRAFT: <span className="text-blue-400">{fsmState.activeSetupId}</span></p>
                <p className="text-xs text-gray-500">The moment MT5 triggers POSITION_OPENED, this trade locks permanently into memory.</p>
              </div>
              <button 
                onClick={() => mutateFsm("ABORT")} 
                className="w-full bg-gray-800 hover:bg-red-950 hover:text-red-400 text-gray-300 transition-colors border border-gray-700 hover:border-red-800 p-3 rounded-md flex items-center justify-center gap-2 text-sm font-semibold"
              >
                <XCircle className="w-4 h-4" /> Abort Setup & Return to IDLE
              </button>
            </div>
          )}

          {fsmState?.currentState === "IN_PROGRESS" && (
            <div className="bg-blue-950/20 border border-blue-900/50 rounded-xl p-8 text-center space-y-4">
              <Terminal className="w-12 h-12 text-blue-500 mx-auto animate-pulse" />
              <h2 className="text-2xl font-bold text-blue-400">The Void: Execution Locked</h2>
              <p className="text-gray-300 font-mono">
                Active Broker Ticket: <span className="text-white font-bold">{fsmState.activeTicket}</span>
              </p>
              <p className="text-sm text-gray-400 max-w-md mx-auto">
                Parameters are immutable. Monitoring broker stream for POSITION_CLOSED deal event.
              </p>
            </div>
          )}

          {fsmState?.currentState === "POST_MORTEM" && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
              <h2 className="text-xl font-semibold border-b border-gray-800 pb-4">Post-Mortem Autopsy</h2>
              <p className="text-gray-400 text-sm">Broker position liquidated. Grade your execution compliance:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={() => mutateFsm("FINALIZE", { 
                    setupCompliant: true, riskCompliant: true, executionCompliant: true, 
                    outcome: "WIN", realizedR: 2.0, netProfitCurrency: 200, 
                    notes: "Full rule compliance, target hit.", isLocked: true 
                  })} 
                  className="bg-green-950/40 hover:bg-green-900/60 border border-green-800 text-green-300 p-4 rounded-lg font-semibold text-sm transition-all"
                >
                  Finalize Winner (+2.0R)
                </button>
                <button 
                  onClick={() => mutateFsm("FINALIZE", { 
                    setupCompliant: true, riskCompliant: true, executionCompliant: true, 
                    outcome: "LOSS", realizedR: -1.0, netProfitCurrency: -100, 
                    notes: "Valid setup stopped out at structural SL.", isLocked: true 
                  })} 
                  className="bg-red-950/40 hover:bg-red-900/60 border border-red-800 text-red-300 p-4 rounded-lg font-semibold text-sm transition-all"
                >
                  Finalize Loss (-1.0R / Trip Breaker)
                </button>
              </div>
            </div>
          )}

          {fsmState?.currentState === "LOCKED_CIRCUIT_BREAKER" && (
            <div className="bg-red-950/30 border border-red-900 rounded-xl p-8 text-center space-y-5">
              <Lock className="w-16 h-16 text-red-500 mx-auto" />
              <h2 className="text-2xl font-bold text-red-500">Circuit Breaker Active</h2>
              <p className="text-red-300 max-w-lg mx-auto text-sm leading-relaxed">
                Daily loss limit breached. Platform and terminal access are deterministically locked to eliminate revenge trading.
              </p>
              <div className="bg-red-950/60 p-4 rounded border border-red-800 inline-block font-mono">
                <span className="block text-xs text-red-400 uppercase tracking-widest mb-1">Mandatory Cooldown Until</span>
                <span className="text-xl text-white font-bold">{new Date(fsmState.lockoutReleaseUtc).toUTCString()}</span>
              </div>
              <div className="pt-4 border-t border-red-900/50">
                <button
                  onClick={() => mutateFsm("RESET_LOCKOUT")}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded text-xs font-mono inline-flex items-center gap-2 border border-gray-700"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> [Dev Override] Reset State to IDLE
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "ledger" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-3">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Trading Days
            </h3>
            {ledgerData.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center text-sm text-gray-500">
                No finalized trades in warehouse yet.
              </div>
            ) : (
              ledgerData.map((day) => (
                <div
                  key={day.date}
                  onClick={() => setSelectedDay(day)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedDay?.date === day.date
                      ? "bg-gray-800 border-blue-500 shadow-md"
                      : "bg-gray-900 border-gray-800 hover:border-gray-700"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono text-sm font-bold text-gray-200">{day.date}</span>
                    <span className={`font-mono text-sm font-bold ${day.netProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {day.netProfit >= 0 ? "+" : ""}${day.netProfit.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{day.totalTrades} trade(s)</span>
                    <span className="text-blue-400">{Math.round((day.compliantTrades / day.totalTrades) * 100)}% compliant</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="md:col-span-2">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {selectedDay ? `Executions for ${selectedDay.date}` : "Select a Trading Day"}
            </h3>
            {selectedDay ? (
              <div className="space-y-4">
                {selectedDay.trades.map((t: any) => (
                  <div key={t.ticket} className="bg-gray-900 border border-gray-800 rounded-lg p-5 space-y-3">
                    <div className="flex justify-between items-start border-b border-gray-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base text-white">{t.symbol}</span>
                          <span className={`text-xs px-2 py-0.5 rounded font-mono ${t.orderType === "BUY" ? "bg-green-950 text-green-400 border border-green-800" : "bg-red-950 text-red-400 border border-red-800"}`}>
                            {t.orderType}
                          </span>
                          <span className="text-xs text-gray-500 font-mono">#{t.ticket}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Open: {new Date(t.openTimestampUtc).toLocaleTimeString()}</p>
                      </div>
                      <div className="text-right">
                        <span className={`font-mono font-bold text-lg ${t.netProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {t.netProfit >= 0 ? "+" : ""}${t.netProfit?.toFixed(2)}
                        </span>
                        <span className="block text-xs font-mono text-gray-400">
                          Realized: {t.realizedR ? `${t.realizedR > 0 ? "+" : ""}${t.realizedR}R` : "0R"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs font-mono bg-gray-950 p-2.5 rounded border border-gray-800/80">
                      <div>Open: <span className="text-gray-300">{t.priceOpen}</span></div>
                      <div>SL: <span className="text-red-400">{t.slPrice}</span></div>
                      <div>TP: <span className="text-green-400">{t.tpPrice}</span></div>
                    </div>

                    {t.setup && (
                      <div className="text-xs space-y-1.5 pt-1 text-gray-400">
                        <p><span className="text-green-400 font-semibold">Bull Thesis:</span> {t.setup.bullThesis}</p>
                        <p><span className="text-red-400 font-semibold">Bear Thesis:</span> {t.setup.bearThesis}</p>
                      </div>
                    )}

                    {t.notes && (
                      <div className="text-xs bg-gray-950/60 p-2 rounded border border-gray-800 text-gray-400">
                        <span className="text-gray-300 font-semibold">Autopsy Reflection:</span> {t.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center text-gray-500 text-sm">
                Select a calendar day on the left to inspect trade details and pre-flight theses.
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
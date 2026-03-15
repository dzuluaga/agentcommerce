import useWebSocket from "./hooks/useWebSocket";
import useTheme from "./hooks/useTheme";
import GoalInput from "./components/GoalInput";
import AgentPanel from "./components/AgentPanel";
import StateMachine from "./components/StateMachine";
import NegotiationStream from "./components/NegotiationStream";
import ToolTracker from "./components/ToolTracker";
import ProductGrid from "./components/ProductGrid";
import TransactionSummary from "./components/TransactionSummary";

function ThemeToggle({ dark, toggle }) {
  return (
    <button
      onClick={toggle}
      className="p-1.5 rounded-lg panel-border border transition-colors hover:bg-blue-500/10"
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? (
        <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}

function App() {
  const { events, currentState, running, start, reset } = useWebSocket();
  const { dark, toggle } = useTheme();

  return (
    <div className="min-h-screen surface p-4 md:p-6 transition-colors duration-300">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">
              Agent<span className="text-blue-500">Commerce</span>
            </h1>
            <p className="text-xs text-muted">
              Autonomous Multi-Agent Commerce with Verifiable Digital Credentials
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted">Nebius + MiniMax + Tavily</span>
            <ThemeToggle dark={dark} toggle={toggle} />
            <div
              className={`w-2 h-2 rounded-full ${
                running ? "bg-green-500 glow-green" : "bg-gray-400 dark:bg-gray-700"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Goal Input */}
      <div className="max-w-7xl mx-auto">
        <GoalInput onStart={start} onReset={reset} running={running} />
      </div>

      {/* Product Grid */}
      <div className="max-w-7xl mx-auto mb-4">
        <ProductGrid events={events} />
      </div>

      {/* Main layout: Left sidebar + Stream */}
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-4">
        {/* Left: Sponsors + State + Agents */}
        <div className="col-span-12 md:col-span-3 space-y-3">
          <ToolTracker events={events} />
          <StateMachine currentState={currentState} />
          <AgentPanel agent="buyer" events={events} />
          <AgentPanel agent="merchant" events={events} />
        </div>

        {/* Right: Event Stream — the star */}
        <div className="col-span-12 md:col-span-9">
          <NegotiationStream events={events} />
        </div>
      </div>

      {/* Transaction Summary — shows when complete */}
      <div className="max-w-7xl mx-auto mt-4">
        <TransactionSummary events={events} />
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto mt-8 text-center">
        <p className="text-xs text-muted">
          Built by Diego Zuluaga — Nebius.Build SF Hackathon 2026 — ISO 18013-5 mdoc / DPC Credential Exchange
        </p>
      </div>
    </div>
  );
}

export default App;

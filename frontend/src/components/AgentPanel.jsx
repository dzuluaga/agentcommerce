import { useState } from "react";

export default function AgentPanel({ agent, events }) {
  const [expanded, setExpanded] = useState(false);
  const isBuyer = agent === "buyer";
  const accentBorder = isBuyer ? "border-blue-500/30" : "border-green-500/30";
  const accentText = isBuyer ? "text-blue-500" : "text-green-500";
  const accentBg = isBuyer ? "bg-blue-500/10" : "bg-green-500/10";
  const modelLabel = isBuyer
    ? "Nebius AI Studio"
    : "OpenRouter";

  const agentMessages = events.filter(
    (e) => e.agent === agent && e.event_type === "agent_message"
  );
  const lastMessage = agentMessages[agentMessages.length - 1];

  const credEvents = events.filter(
    (e) => e.event_type === "credential_event" && e.agent === agent
  );
  const lastCred = credEvents[credEvents.length - 1];

  return (
    <div className={`panel border ${accentBorder} rounded-xl overflow-hidden transition-colors`}>
      {/* Header — always visible, clickable */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              lastMessage ? (isBuyer ? "bg-blue-500 glow-blue" : "bg-green-500 glow-green") : "bg-gray-400 dark:bg-gray-700"
            }`}
          />
          <span className={`text-xs font-bold ${accentText}`}>
            {isBuyer ? "Buyer" : "Merchant"}
          </span>
          <span className="text-[10px] text-muted">{modelLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          {lastMessage && (
            <span className={`text-[10px] font-bold ${accentText} ${accentBg} px-1.5 py-0.5 rounded`}>
              {lastMessage.data?.action}
            </span>
          )}
          <svg
            className={`w-3 h-3 text-muted transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expandable detail */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {lastMessage && (
            <p className="text-xs text-secondary leading-relaxed">
              {lastMessage.data?.reasoning || "Processing..."}
            </p>
          )}

          {lastCred && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted">Credential:</span>
              {lastCred.data?.verification?.verified ? (
                <span className="text-green-500 font-bold">Verified</span>
              ) : (
                <span className="text-red-500 font-bold">Failed</span>
              )}
              <span className="text-secondary">
                {lastCred.data?.credential?.holder_name} ({(lastCred.data?.verification?.trust_score * 100)?.toFixed(0)}%)
              </span>
            </div>
          )}

          <div className="max-h-32 overflow-y-auto space-y-1">
            {agentMessages.map((msg, i) => (
              <div key={i} className="text-[10px] text-muted border-l-2 panel-border pl-2 truncate">
                <span className={`font-bold ${accentText}`}>{msg.data?.action}</span>{" "}
                {(msg.data?.reasoning || "").slice(0, 80)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const STATES = [
  { key: "DISCOVERY", label: "Discovery" },
  { key: "RESEARCH", label: "Research" },
  { key: "CREDENTIAL_EXCHANGE", label: "Credential Exchange" },
  { key: "NEGOTIATION", label: "Negotiation" },
  { key: "AGREEMENT", label: "Agreement" },
  { key: "PAYMENT", label: "Payment" },
  { key: "CONFIRMED", label: "Confirmed" },
];

export default function StateMachine({ currentState }) {
  const currentIdx = STATES.findIndex((s) => s.key === currentState);
  const failed = currentState === "FAILED";
  const isRunning = currentState !== "IDLE" && currentState !== "CONFIRMED" && !failed;

  return (
    <div className="panel panel-border border rounded-xl p-4 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-muted uppercase tracking-wider">
          Transaction State
        </h3>
        {isRunning && (
          <span className="flex items-center gap-1.5 text-[10px] text-blue-500 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </span>
            Processing
          </span>
        )}
      </div>
      <div className="space-y-1">
        {STATES.map((s, i) => {
          const isActive = s.key === currentState;
          const isPast = i < currentIdx;

          let dotColor = "bg-gray-300 dark:bg-gray-700";
          let textColor = "text-muted";
          let lineColor = "bg-gray-200 dark:bg-gray-800";

          if (isPast || (isActive && currentState === "CONFIRMED")) {
            dotColor = "bg-green-500";
            textColor = "text-green-500";
            lineColor = "bg-green-500/30";
          } else if (isActive) {
            dotColor = failed ? "bg-red-500" : "bg-blue-500";
            textColor = failed ? "text-red-500" : "text-blue-500";
          }

          return (
            <div key={s.key} className="flex items-center gap-3">
              <div className="flex flex-col items-center w-4">
                {isActive && !failed && currentState !== "CONFIRMED" ? (
                  <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
                  </div>
                ) : (
                  <div className={`w-3 h-3 rounded-full ${dotColor} transition-all duration-500`} />
                )}
                {i < STATES.length - 1 && (
                  <div className={`w-0.5 h-4 ${isPast ? lineColor : "bg-gray-200 dark:bg-gray-800"} transition-all duration-500`} />
                )}
              </div>
              <span
                className={`text-xs font-medium ${textColor} transition-colors duration-300 ${
                  isActive && !failed && currentState !== "CONFIRMED" ? "animate-pulse" : ""
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
        {failed && (
          <div className="flex items-center gap-3 mt-2">
            <div className="w-4 flex justify-center">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </div>
            </div>
            <span className="text-xs font-medium text-red-500 animate-pulse">Failed</span>
          </div>
        )}
        {currentState === "CONFIRMED" && (
          <div className="flex items-center gap-3 mt-2">
            <div className="w-4 flex justify-center">
              <div className="w-3 h-3 rounded-full bg-green-500 glow-green" />
            </div>
            <span className="text-xs font-medium text-green-500">Complete</span>
          </div>
        )}
      </div>
    </div>
  );
}

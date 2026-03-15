import { useMemo } from "react";

const TOOL_DEFS = [
  { key: "Nebius AI Studio", label: "Nebius AI Studio", detail: "Buyer — MiniMax-M2.1", color: "blue" },
  { key: "OpenRouter", label: "OpenRouter", detail: "Merchant — MiniMax-M2", color: "green" },
  { key: "Tavily Search", label: "Tavily Search", detail: "Market Price Research", color: "cyan" },
  { key: "ISO 18013-5 mdoc", label: "ISO 18013-5 mdoc", detail: "Digital Credential (DPC)", color: "purple" },
];

const COLOR_MAP = {
  blue: {
    active: "border-blue-500/50 bg-blue-500/10",
    dot: "bg-blue-500",
    glow: "glow-blue",
    text: "text-blue-500",
    dim: "text-blue-500/60",
  },
  cyan: {
    active: "border-cyan-500/50 bg-cyan-500/10",
    dot: "bg-cyan-500",
    glow: "",
    text: "text-cyan-500",
    dim: "text-cyan-500/60",
  },
  green: {
    active: "border-green-500/50 bg-green-500/10",
    dot: "bg-green-500",
    glow: "glow-green",
    text: "text-green-500",
    dim: "text-green-500/60",
  },
  purple: {
    active: "border-purple-500/50 bg-purple-500/10",
    dot: "bg-purple-500",
    glow: "",
    text: "text-purple-500",
    dim: "text-purple-500/60",
  },
};

export default function ToolTracker({ events }) {
  const toolCounts = useMemo(() => {
    const counts = {};
    for (const e of events) {
      const toolName = e.data?.tool?.name;
      if (toolName) {
        counts[toolName] = (counts[toolName] || 0) + 1;
      }
    }
    return counts;
  }, [events]);

  return (
    <div className="panel panel-border border rounded-xl p-3 transition-colors">
      <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-2">
        Powered by
      </h3>
      <div className="space-y-1.5">
        {TOOL_DEFS.map((tool) => {
          const count = toolCounts[tool.key] || 0;
          const isActive = count > 0;
          const c = COLOR_MAP[tool.color];

          return (
            <div
              key={tool.key}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all duration-500 ${
                isActive ? c.active : "panel-border bg-subtle opacity-50"
              }`}
            >
              <div className="relative flex-shrink-0">
                <div
                  className={`w-2 h-2 rounded-full transition-all ${
                    isActive ? `${c.dot} ${c.glow}` : "bg-gray-400 dark:bg-gray-700"
                  }`}
                />
                {isActive && (
                  <span className={`animate-ping absolute inset-0 rounded-full ${c.dot} opacity-40`} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-bold leading-tight ${isActive ? c.text : "text-muted"}`}>
                  {tool.label}
                </div>
                <div className={`text-[10px] leading-tight ${isActive ? c.dim : "text-muted"}`}>
                  {tool.detail}
                </div>
              </div>
              {isActive && (
                <span className={`text-[10px] font-bold ${c.text} flex-shrink-0`}>
                  {count}x
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

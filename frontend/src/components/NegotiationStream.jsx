import { useEffect, useMemo, useRef } from "react";

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

const TOOL_COLORS = {
  blue: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  green: "bg-green-500/15 text-green-500 border-green-500/30",
  cyan: "bg-cyan-500/15 text-cyan-500 border-cyan-500/30",
  purple: "bg-purple-500/15 text-purple-500 border-purple-500/30",
};

function ToolBadge({ tool }) {
  if (!tool) return null;
  const colors = TOOL_COLORS[tool.color] || TOOL_COLORS.blue;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded border ${colors}`}>
      {tool.name} {tool.model !== tool.name ? `· ${tool.model}` : ""}
    </span>
  );
}

function EventCard({ event }) {
  const { event_type, agent, data, timestamp } = event;
  const tool = data?.tool;

  if (event_type === "state_change") {
    const state = event.state || data?.state;
    const failed = state === "FAILED";
    return (
      <div className={`flex items-center gap-3 py-2 px-4 ${failed ? "bg-red-500/10" : "bg-subtle"} rounded-lg`}>
        <span className={`text-sm font-bold ${failed ? "text-red-500" : "text-yellow-500"}`}>STATE</span>
        <span className="text-sm font-semibold text-primary">{state}</span>
        {data?.reason && <span className="text-sm text-muted">— {data.reason}</span>}
        <span className="text-xs text-muted ml-auto">{formatTime(timestamp)}</span>
      </div>
    );
  }

  if (event_type === "agent_message") {
    const isBuyer = agent === "buyer";
    const color = isBuyer ? "text-blue-500" : "text-green-500";
    const bgColor = isBuyer ? "border-l-blue-500" : "border-l-green-500";
    const label = isBuyer ? "BUYER" : "MERCHANT";
    return (
      <div className={`py-3 px-4 border-l-3 ${bgColor}`}>
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className={`text-sm font-bold ${color}`}>{label}</span>
          <span className="text-sm text-secondary font-semibold">{data?.action}</span>
          <ToolBadge tool={tool} />
          <span className="text-xs text-muted ml-auto">{formatTime(timestamp)}</span>
        </div>
        <p className="text-sm text-secondary mt-1 leading-relaxed">{data?.reasoning}</p>
        {data?.data?.price && (
          <span className="inline-block mt-2 px-3 py-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-base rounded-lg font-bold">
            ${data.data.price}
          </span>
        )}
      </div>
    );
  }

  if (event_type === "credential_event") {
    const verified = data?.verification?.verified;
    return (
      <div className={`py-3 px-4 ${verified ? "bg-green-500/5" : "bg-red-500/5"} rounded-lg`}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-purple-500">CREDENTIAL</span>
          <span className={`text-sm font-bold ${verified ? "text-green-500" : "text-red-500"}`}>
            {verified ? "VERIFIED" : "FAILED"}
          </span>
          <ToolBadge tool={tool} />
          <span className="text-xs text-muted">{data?.direction}</span>
          <span className="text-xs text-muted ml-auto">{formatTime(timestamp)}</span>
        </div>
        <p className="text-sm text-secondary mt-1">
          {data?.credential?.holder_name} — Trust: {((data?.verification?.trust_score || 0) * 100).toFixed(0)}%
        </p>
      </div>
    );
  }

  if (event_type === "search_result") {
    const results = data?.results || [];
    return (
      <div className="py-3 px-4 bg-cyan-500/5 rounded-lg">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="text-sm font-bold text-cyan-500">RESEARCH</span>
          <ToolBadge tool={tool} />
          <span className="text-sm text-muted">{results.length} results</span>
          {data?.market_price ? (
            <span className="text-sm font-bold text-green-600 dark:text-green-400 bg-green-500/15 px-3 py-0.5 rounded-full">
              Market Price: ${data.market_price.toFixed(2)}
            </span>
          ) : data?.all_prices_found?.length > 0 ? (
            <span className="text-sm font-bold text-green-600 dark:text-green-400 bg-green-500/15 px-3 py-0.5 rounded-full">
              Prices: {data.all_prices_found.map(p => `$${p}`).join(", ")}
            </span>
          ) : null}
          <span className="text-xs text-muted ml-auto">{formatTime(timestamp)}</span>
        </div>
        {data?.query && (
          <div className="text-sm text-cyan-600 dark:text-cyan-300/60 ml-4 mb-2 italic">"{data.query}"</div>
        )}
        {results.slice(0, 5).map((r, i) => (
          <div key={i} className="ml-4 mb-2 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              {r.url ? (
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:text-blue-400 hover:underline block truncate"
                >
                  {r.title || r.content?.slice(0, 80)}
                </a>
              ) : (
                <div className="text-sm text-secondary truncate">
                  {r.title || r.content?.slice(0, 80)}
                </div>
              )}
              {r.url && (() => {
                try { return <span className="text-xs text-muted">{new URL(r.url).hostname}</span>; }
                catch { return null; }
              })()}
            </div>
            {r.prices_found?.length > 0 && (
              <div className="flex-shrink-0 flex gap-1 flex-wrap justify-end">
                {r.prices_found.slice(0, 3).map((p, j) => (
                  <span key={j} className="text-sm font-bold text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-0.5 rounded">
                    {p}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (event_type === "transaction_update") {
    return (
      <div className="py-2 px-4 bg-subtle rounded-lg">
        <span className="text-sm text-muted">
          {data?.status === "TRANSACTION_COMPLETE" ? (
            <span className="text-green-500 font-bold text-base">Transaction Complete — Final Price: ${data.final_price}{data.final_item ? ` — ${data.final_item}` : ""}</span>
          ) : data?.round ? (
            <span className="font-semibold">Negotiation round {data.round}/{data.max_rounds}</span>
          ) : data?.agreed_price ? (
            <span className="text-yellow-600 dark:text-yellow-400 font-bold">Agreed Price: ${data.agreed_price}{data.agreed_item ? ` — ${data.agreed_item}` : ""}</span>
          ) : (
            JSON.stringify(data)
          )}
        </span>
      </div>
    );
  }

  return null;
}

function PriceBaseline({ events }) {
  const { marketTotal, lastOffer, savings, items } = useMemo(() => {
    // Collect market prices from all search_result events
    let total = 0;
    const itemPrices = [];
    for (const e of events) {
      if (e.event_type === "search_result") {
        // Try market_price first, then median of all_prices_found, then individual result prices
        let price = e.data?.market_price;
        if (!price && e.data?.all_prices_found?.length > 0) {
          const prices = e.data.all_prices_found;
          price = prices[Math.floor(prices.length / 2)];
        }
        if (!price) {
          // Extract from individual results
          const allPrices = [];
          for (const r of (e.data?.results || [])) {
            for (const p of (r.prices_found || [])) {
              const val = parseFloat(String(p).replace("$", "").replace(",", ""));
              if (!isNaN(val) && val >= 10 && val <= 2000) allPrices.push(val);
            }
          }
          if (allPrices.length > 0) {
            allPrices.sort((a, b) => a - b);
            price = allPrices[Math.floor(allPrices.length / 2)];
          }
        }
        if (price) {
          total += price;
          itemPrices.push(price);
        }
      }
    }

    // Find the latest price from negotiation (buyer or merchant)
    let latest = null;
    for (const e of events) {
      if (e.event_type === "agent_message" && e.data?.data?.price) {
        const p = parseFloat(e.data.data.price);
        if (!isNaN(p)) latest = p;
      }
      if (e.event_type === "transaction_update" && e.data?.agreed_price) {
        const p = parseFloat(e.data.agreed_price);
        if (!isNaN(p)) latest = p;
      }
    }

    return {
      marketTotal: total,
      lastOffer: latest,
      savings: latest && total ? total - latest : null,
      items: itemPrices.length,
    };
  }, [events]);

  if (!marketTotal) return null;

  const savingsPercent = savings && marketTotal ? ((savings / marketTotal) * 100).toFixed(0) : null;
  const isComplete = events.some(e => e.data?.status === "TRANSACTION_COMPLETE");

  return (
    <div className="panel-border border rounded-lg p-3 mb-3 flex items-center gap-4 flex-wrap bg-gradient-to-r from-cyan-500/5 to-green-500/5">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-muted uppercase">Market Baseline</span>
        <span className="text-lg font-bold text-cyan-600 dark:text-cyan-400">
          ${marketTotal.toFixed(2)}
        </span>
        {items > 1 && <span className="text-xs text-muted">({items} items)</span>}
      </div>

      {lastOffer && (
        <>
          <div className="text-muted">→</div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted uppercase">
              {isComplete ? "Final Price" : "Current Offer"}
            </span>
            <span className={`text-lg font-bold ${lastOffer < marketTotal ? "text-green-500" : "text-red-500"}`}>
              ${lastOffer.toFixed(2)}
            </span>
          </div>
        </>
      )}

      {savings !== null && savings > 0 && (
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-sm font-bold text-green-500 bg-green-500/10 px-3 py-1 rounded-full">
            Saving ${savings.toFixed(2)} ({savingsPercent}% off)
          </span>
        </div>
      )}
    </div>
  );
}

export default function NegotiationStream({ events }) {
  const containerRef = useRef(null);
  const userScrolledUp = useRef(false);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    userScrolledUp.current = distanceFromBottom > 60;
  };

  useEffect(() => {
    if (!userScrolledUp.current && containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [events]);

  return (
    <div className="panel panel-border border rounded-xl p-5 flex flex-col transition-colors">
      <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-3">
        Event Stream
      </h3>

      <PriceBaseline events={events} />

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto space-y-2 max-h-[600px]"
      >
        {events.length === 0 && (
          <p className="text-sm text-muted text-center py-12">
            Enter a goal and click Start to begin...
          </p>
        )}
        {events.map((event, i) => (
          <EventCard key={i} event={event} />
        ))}
      </div>
    </div>
  );
}

import { useMemo, useEffect, useState } from "react";

export default function TransactionSummary({ events }) {
  const [visible, setVisible] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const summary = useMemo(() => {
    const completeEvent = events.find(
      (e) => e.event_type === "transaction_update" && e.data?.status === "TRANSACTION_COMPLETE"
    );
    if (!completeEvent) return null;

    let marketPrice = 0;
    for (const e of events) {
      if (e.event_type === "search_result" && e.data?.market_price) {
        marketPrice += e.data.market_price;
      }
    }

    const credEvents = events.filter((e) => e.event_type === "credential_event");
    const buyerCred = credEvents.find((e) => e.data?.direction === "buyer_to_merchant");
    const merchantCred = credEvents.find((e) => e.data?.direction === "merchant_to_buyer");

    const rounds = events.filter(
      (e) => e.event_type === "transaction_update" && e.data?.round
    ).length;

    const toolCounts = {};
    for (const e of events) {
      const toolName = e.data?.tool?.name;
      if (toolName) toolCounts[toolName] = (toolCounts[toolName] || 0) + 1;
    }

    const finalPrice = parseFloat(completeEvent.data.final_price) || 0;
    const finalItem = completeEvent.data.final_item || "Product";
    const savings = marketPrice - finalPrice;
    const savingsPercent = marketPrice ? ((savings / marketPrice) * 100).toFixed(0) : 0;

    return { finalPrice, finalItem, marketPrice, savings, savingsPercent, rounds, toolCounts,
      buyerVerified: buyerCred?.data?.verification?.verified,
      buyerName: buyerCred?.data?.credential?.holder_name,
      merchantVerified: merchantCred?.data?.verification?.verified,
      merchantName: merchantCred?.data?.credential?.holder_name,
    };
  }, [events]);

  useEffect(() => {
    if (summary) {
      setBannerDismissed(false);
      setVisible(false);
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      setBannerDismissed(false);
    }
  }, [summary]);

  if (!summary) return null;

  return (
    <>
      {/* Fixed celebration banner at top of screen */}
      {!bannerDismissed && (
        <div
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
            visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
          }`}
        >
          <div className="bg-green-500 text-white py-3 px-4 shadow-lg shadow-green-500/30">
            <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 flex-wrap relative">
              <span className="text-2xl">&#127881;</span>
              <span className="text-lg font-bold">Deal Closed!</span>
              <span className="text-sm font-medium opacity-90">{summary.finalItem}</span>
              <span className="text-sm">
                {summary.marketPrice > 0 && (
                  <span className="line-through opacity-60 mr-2">${summary.marketPrice.toFixed(2)}</span>
                )}
                <span className="text-xl font-bold">${summary.finalPrice.toFixed(2)}</span>
              </span>
              {summary.savings > 0 && (
                <span className="bg-white/20 px-3 py-0.5 rounded-full text-sm font-bold">
                  {summary.savingsPercent}% saved
                </span>
              )}
              <span className="text-2xl">&#127881;</span>
              <button
                onClick={() => setBannerDismissed(true)}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/20 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed summary card below content */}
      <div className={`transition-all duration-700 delay-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <div className="rounded-xl border-2 border-green-500/40 p-5 bg-gradient-to-r from-green-500/5 via-transparent to-green-500/5">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {/* Final price */}
            <div className="panel panel-border border rounded-lg p-3 text-center col-span-2">
              <p className="text-xs text-muted uppercase font-bold mb-1">Final Price</p>
              <p className="text-3xl font-bold text-green-500">${summary.finalPrice.toFixed(2)}</p>
              {summary.marketPrice > 0 && (
                <p className="text-xs text-muted mt-1">
                  <span className="line-through">${summary.marketPrice.toFixed(2)}</span>
                  {summary.savings > 0 && (
                    <span className="text-green-500 font-bold ml-2">-{summary.savingsPercent}%</span>
                  )}
                </p>
              )}
            </div>

            {/* Buyer credential */}
            <div className="panel panel-border border rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-[10px] font-bold text-green-500">Buyer</span>
              </div>
              <p className="text-xs text-secondary">{summary.buyerName}</p>
            </div>

            {/* Merchant credential */}
            <div className="panel panel-border border rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-[10px] font-bold text-green-500">Merchant</span>
              </div>
              <p className="text-xs text-secondary">{summary.merchantName}</p>
            </div>

            {/* Rounds */}
            <div className="panel panel-border border rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-primary">{summary.rounds}</p>
              <p className="text-[10px] text-muted">Rounds</p>
            </div>

            {/* Tools */}
            <div className="panel panel-border border rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-primary">{Object.values(summary.toolCounts).reduce((a, b) => a + b, 0)}</p>
              <p className="text-[10px] text-muted">Tool Calls</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

import { useMemo } from "react";

const CATEGORY_COLORS = {
  running_shoes: { bg: "from-orange-500/20 to-orange-900/10", border: "border-orange-500/20", text: "text-orange-500" },
  outerwear: { bg: "from-purple-500/20 to-purple-900/10", border: "border-purple-500/20", text: "text-purple-500" },
  athletic_apparel: { bg: "from-red-500/20 to-red-900/10", border: "border-red-500/20", text: "text-red-500" },
  fitness_tech: { bg: "from-yellow-500/20 to-yellow-900/10", border: "border-yellow-500/20", text: "text-yellow-600 dark:text-yellow-400" },
  accessories: { bg: "from-teal-500/20 to-teal-900/10", border: "border-teal-500/20", text: "text-teal-600 dark:text-teal-400" },
  fitness_equipment: { bg: "from-green-500/20 to-green-900/10", border: "border-green-500/20", text: "text-green-600 dark:text-green-400" },
};

function ProductCard({ item, isActive }) {
  const colors = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.accessories;

  return (
    <div
      className={`relative flex-shrink-0 w-28 rounded-lg border ${colors.border} bg-gradient-to-br ${colors.bg} p-2 transition-all duration-500 ${
        isActive ? "ring-1 ring-green-500/50 scale-105" : ""
      }`}
    >
      {isActive && (
        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full glow-green" />
      )}

      <div className="w-full h-16 rounded bg-white/5 dark:bg-gray-800/50 mb-1.5 flex items-center justify-center overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-contain p-1"
          onError={(e) => {
            e.target.style.display = "none";
            e.target.nextSibling.style.display = "flex";
          }}
        />
        <div className="hidden items-center justify-center w-full h-full text-lg">
          {item.category === "running_shoes" ? "\u{1F45F}" :
           item.category === "outerwear" ? "\u{1F9E5}" :
           item.category === "athletic_apparel" ? "\u{1F455}" :
           item.category === "fitness_tech" ? "\u231A" :
           item.category === "accessories" ? "\u{1F9F4}" :
           item.category === "fitness_equipment" ? "\u{1F9D8}" : "\u{1F4E6}"}
        </div>
      </div>

      <h4 className="text-[9px] font-bold text-primary leading-tight line-clamp-2">
        {item.name}
      </h4>
      <p className={`text-[11px] font-bold ${colors.text} mt-0.5`}>
        ${item.base_price?.toFixed(2)}
      </p>
    </div>
  );
}

const DEFAULT_INVENTORY = [
  { name: "Nike Pegasus 42 Running Shoes", base_price: 140.00, unit: "per pair", category: "running_shoes", image: "https://media.about.nike.com/img/3fb714ef-238e-441d-9083-64a70f544953/nike-pegasus-42-hero.jpg" },
  { name: "ASICS Gel-Kayano 31", base_price: 160.00, unit: "per pair", category: "running_shoes", image: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgc-cq0yxvFztQAwMeNuWwhj62-iwYMu7dKeeairrHooB6npNHmmOMnNmpavvJipLVxXgdTS9cbux5GntmQY-laHEmTtUa9YFNhLA_o0uYHr8NBH3BVXiZBxeJeo3hQ4YQw1zdweeDyhsBdv1YYWBGvWKh32R-BodWXkMlyf7lOqgRygjtxFaMRwLmKyRxn/s2048/asics%20kayano%2031%20-%20lateral.jpg" },
  { name: "Adidas Ultraboost Light", base_price: 190.00, unit: "per pair", category: "running_shoes", image: "https://middleagemarathoner.com/wp-content/uploads/2023/11/Ultraboost-Light1.jpg" },
  { name: "Patagonia Nano Puff Jacket", base_price: 199.00, unit: "each", category: "outerwear", image: "https://s3.amazonaws.com/images.gearjunkie.com/uploads/2022/09/ATP09799-2.jpg" },
  { name: "Lululemon Surge Jogger", base_price: 118.00, unit: "each", category: "athletic_apparel", image: "https://images.lululemon.com/is/image/lululemon/LM5956S_030210_1" },
  { name: "Nike Dri-FIT Running Shorts (2-pack)", base_price: 70.00, unit: "per 2-pack", category: "athletic_apparel", image: "https://www.cleverhiker.com/wp-content/uploads/2023/08/Nike-DRI-fit-Challenger-1.jpg" },
  { name: "Garmin Forerunner 265 GPS Watch", base_price: 450.00, unit: "each", category: "fitness_tech", image: "https://res.garmin.com/en/products/010-02810-00/v/cf-lg.jpg" },
  { name: "Hydro Flask 32oz Wide Mouth Bottle", base_price: 45.00, unit: "each", category: "accessories", image: "https://cdn.packhacker.com/2020/02/e3d4fe80-hydro-flask-32oz-wide-mouth-with-flex-cap-filling.jpg" },
  { name: "JBL Reflect Aero Wireless Earbuds", base_price: 150.00, unit: "each", category: "fitness_tech", image: "https://www.headphonecheck.com/wp-content/uploads/JBL-Reflect-Aero-1-1920x1080.jpg" },
  { name: "Manduka PRO Yoga Mat (71-inch)", base_price: 120.00, unit: "each", category: "fitness_equipment", image: "https://cdn.mos.cms.futurecdn.net/BdPi55QUPpehoHDWUkhKd8-2560-80.jpg" },
];

export default function ProductGrid({ events }) {
  const inventory = useMemo(() => {
    const invEvent = events.find((e) => e.event_type === "inventory");
    return invEvent?.data?.items || DEFAULT_INVENTORY;
  }, [events]);

  const activeProducts = useMemo(() => {
    const names = new Set();
    for (const e of events) {
      if (e.event_type === "agent_message") {
        const reasoning = (e.data?.reasoning || "").toLowerCase();
        const dataStr = JSON.stringify(e.data?.data || {}).toLowerCase();
        const combined = reasoning + " " + dataStr;
        for (const item of inventory) {
          const keywords = item.name.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
          if (keywords.some((kw) => combined.includes(kw))) {
            names.add(item.name);
          }
        }
      }
    }
    return names;
  }, [events, inventory]);

  return (
    <div className="panel panel-border border rounded-xl p-3 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-muted uppercase tracking-wider">
          UrbanStride Inventory
        </h3>
        {activeProducts.size > 0 && (
          <span className="text-[10px] text-green-500 font-medium">
            {activeProducts.size} item{activeProducts.size !== 1 ? "s" : ""} in negotiation
          </span>
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {inventory.map((item, i) => (
          <ProductCard
            key={i}
            item={item}
            isActive={activeProducts.has(item.name)}
          />
        ))}
      </div>
    </div>
  );
}

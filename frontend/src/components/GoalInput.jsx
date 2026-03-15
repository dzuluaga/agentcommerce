import { useState } from "react";

const PRESETS = [
  { label: "Nike Pegasus 42", goal: "Buy a pair of Nike Pegasus 42 Running Shoes for daily training", budget: 130 },
  { label: "Garmin Watch", goal: "Purchase a Garmin Forerunner 265 GPS Watch for race training", budget: 400 },
  { label: "Workout Bundle", goal: "Buy Lululemon Surge Joggers and Nike Dri-FIT Running Shorts for the gym", budget: 160 },
];

export default function GoalInput({ onStart, onReset, running }) {
  const [goal, setGoal] = useState("");
  const [budget, setBudget] = useState("");

  const handleStart = () => {
    if (!goal.trim() || !budget) return;
    onStart(goal, budget);
  };

  const applyPreset = (preset) => {
    setGoal(preset.goal);
    setBudget(preset.budget.toString());
  };

  return (
    <div className="panel panel-border border rounded-xl p-6 mb-6 transition-colors">
      <h2 className="text-lg font-bold text-primary mb-4">Purchase Goal</h2>

      <div className="flex gap-2 mb-4 flex-wrap">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => applyPreset(p)}
            disabled={running}
            className="px-3 py-1.5 text-xs bg-subtle panel-border border rounded-lg text-secondary hover:text-primary transition disabled:opacity-50"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-xs text-muted mb-1">Goal</label>
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Describe what you want to buy..."
            disabled={running}
            className="w-full bg-subtle panel-border border rounded-lg px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-blue-500 disabled:opacity-50 transition-colors"
          />
        </div>
        <div className="w-32">
          <label className="block text-xs text-muted mb-1">Budget ($)</label>
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="500"
            disabled={running}
            className="w-full bg-subtle panel-border border rounded-lg px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-blue-500 disabled:opacity-50 transition-colors"
          />
        </div>
        <button
          onClick={running ? onReset : handleStart}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
            running
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          } disabled:opacity-50`}
          disabled={!running && (!goal.trim() || !budget)}
        >
          {running ? "Stop" : "Start"}
        </button>
      </div>
    </div>
  );
}

import type { SiteStat } from "../../lib/types";

interface StatsBarProps {
  stats: SiteStat[];
  variant?: "navy" | "cream";
}

export default function StatsBar({ stats, variant = "navy" }: StatsBarProps) {
  if (!stats.length) return null;

  return (
    <div className={`stats-grid on-${variant}`}>
      {stats.map((stat) => (
        <div key={stat.id} className="stat-cell">
          <div className="stat-num gold">
            {stat.display_value}
          </div>
          <div className="stat-lbl">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import type { Insight } from "../../lib/types";

type AudienceTab = "investor" | "borrower" | "all";

const TABS: { key: AudienceTab; label: string }[] = [
  { key: "investor", label: "Investor Insights" },
  { key: "borrower", label: "Borrower Resources" },
  { key: "all", label: "All" },
];

function filterInsights(insights: Insight[], tab: AudienceTab): Insight[] {
  if (tab === "all") return insights;
  return insights.filter(
    (i) => i.audience === tab || i.audience === "both"
  );
}

export default function InsightsGrid({ insights }: { insights: Insight[] }) {
  const [activeTab, setActiveTab] = useState<AudienceTab>("investor");
  const filtered = filterInsights(insights, activeTab);

  return (
    <>
      {/* Tab bar */}
      <div className="insights-tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`insights-tab${activeTab === tab.key ? " insights-tab-active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            <span className="insights-tab-count">
              {filterInsights(insights, tab.key).length}
            </span>
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 24,
            marginTop: 32,
          }}
        >
          {filtered.map((insight) => (
            <Link
              key={insight.id}
              href={`/insights/${insight.slug}`}
              style={{ textDecoration: "none", color: "inherit", display: "block", height: "100%" }}
            >
              <div className="card insight-card">
                <div className="insight-tags">
                  {insight.tags?.map((tag) => (
                    <span key={tag} className="insight-tag">
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="card-title" style={{ fontSize: 21 }}>
                  {insight.title}
                </h3>
                {insight.excerpt && (
                  <p className="card-body">{insight.excerpt}</p>
                )}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    marginTop: 16,
                    flexWrap: "wrap" as const,
                  }}
                >
                  {insight.published_date && (
                    <span
                      className="type-caption"
                      style={{ color: "var(--text-light)" }}
                    >
                      {new Date(insight.published_date).toLocaleDateString(
                        "en-US",
                        { year: "numeric", month: "long", day: "numeric" }
                      )}
                    </span>
                  )}
                  {insight.reading_time_minutes && (
                    <span
                      className="type-caption"
                      style={{
                        color: "var(--text-light)",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Clock size={12} />
                      {insight.reading_time_minutes} min
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <p className="type-body" style={{ color: "var(--text-mid)" }}>
            No posts in this category yet. Check back soon.
          </p>
        </div>
      )}
    </>
  );
}

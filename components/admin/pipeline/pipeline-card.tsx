"use client";

import { useRouter } from "next/navigation";
import { Paperclip, ArrowUpRight, Mail, MessageSquare } from "lucide-react";
import { formatCompactCurrency } from "@/lib/format";

// Avatar background colors — cycle through by index
const AVATAR_COLORS = [
  "#6366F1",
  "#EC4899",
  "#F59E0B",
  "#22A861",
  "#3B82F6",
  "#8B5CF6",
  "#EF4444",
  "#14B8A6",
  "#F97316",
  "#06B6D4",
];

export interface PipelineDeal {
  id: string;
  source: "opportunity" | "loan";
  dealName: string;
  companyName: string | null;
  borrowerName: string | null;
  amount: number | null;
  loanType: string | null;
  pipelineStage: string;
  rawStage: string;
  stageChangedAt: string | null;
  assignedName: string | null;
  docsApproved: number;
  docsTotal: number;
}

interface PipelineCardProps {
  deal: PipelineDeal;
  index: number;
  isDragging?: boolean;
}

function getDaysInStage(changedAt: string | null): number {
  if (!changedAt) return 0;
  const diff = Date.now() - new Date(changedAt).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatLoanType(type: string | null): string {
  if (!type) return "";
  if (type.toUpperCase() === "DSCR") return "DSCR";
  if (type.toUpperCase() === "GUC") return "GUC";
  if (type.toUpperCase() === "RTL") return "RTL";
  return type.replace(/_/g, " ").toUpperCase();
}

export function PipelineCard({ deal, index, isDragging }: PipelineCardProps) {
  const router = useRouter();
  const days = getDaysInStage(deal.stageChangedAt);
  const docsComplete =
    deal.docsTotal > 0 && deal.docsApproved >= deal.docsTotal;

  const detailUrl = `/admin/deals/${deal.id}`;

  // Days badge styling
  let daysBadgeStyle: React.CSSProperties;
  if (days >= 10) {
    daysBadgeStyle = {
      color: "#E5453D",
      backgroundColor: "rgba(229,69,61,0.07)",
    };
  } else if (days >= 5) {
    daysBadgeStyle = {
      color: "#D97706",
      backgroundColor: "rgba(217,119,6,0.07)",
    };
  } else {
    daysBadgeStyle = {
      color: "hsl(var(--muted-foreground))",
      backgroundColor: "hsl(var(--muted))",
    };
  }

  // Avatar color (cycle by index)
  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];

  // Company · Borrower line
  const companyBorrower = [deal.companyName, deal.borrowerName]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className="group overflow-hidden transition-all duration-[180ms] ease-out"
      style={{
        backgroundColor: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
        borderRadius: "10px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
        cursor: "pointer",
        opacity: isDragging ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 3px 12px rgba(0,0,0,0.1)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.03)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
      onClick={() => router.push(detailUrl)}
    >
      {/* Main content area */}
      <div style={{ padding: "12px 14px 10px" }}>
        {/* Row 1: Amount + Days badge */}
        <div
          className="flex items-center justify-between"
          style={{ marginBottom: "4px" }}
        >
          <span
            className="font-mono"
            style={{
              fontSize: "17px",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: deal.amount ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
            }}
          >
            {formatCompactCurrency(deal.amount)}
          </span>
          <span
            className="font-mono"
            style={{
              fontSize: "10px",
              fontWeight: 600,
              padding: "2px 7px",
              borderRadius: "5px",
              ...daysBadgeStyle,
            }}
          >
            {days}d
          </span>
        </div>

        {/* Row 2: Deal name */}
        <p
          className="truncate"
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "hsl(var(--foreground))",
            lineHeight: 1.35,
            marginBottom: "6px",
          }}
        >
          {deal.dealName || "Untitled Deal"}
        </p>

        {/* Row 3: Company · Borrower */}
        {companyBorrower && (
          <p
            className="truncate"
            style={{
              fontSize: "12px",
              fontWeight: 450,
              color: "hsl(var(--muted-foreground))",
              marginBottom: "8px",
            }}
          >
            {companyBorrower}
          </p>
        )}

        {/* Row 4: Assigned rep */}
        {deal.assignedName && (
          <div className="flex items-center" style={{ gap: "7px" }}>
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "5px",
                backgroundColor: avatarColor,
              }}
            >
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  color: "#FFFFFF",
                  lineHeight: 1,
                }}
              >
                {getInitials(deal.assignedName)}
              </span>
            </div>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 450,
                color: "hsl(var(--muted-foreground))",
              }}
            >
              {deal.assignedName}
            </span>
          </div>
        )}
      </div>

      {/* Footer strip */}
      <div
        className="flex items-center justify-between"
        style={{
          backgroundColor: "hsl(var(--muted))",
          borderTop: "1px solid hsl(var(--border))",
          padding: "7px 14px 8px",
        }}
      >
        {/* Left: Asset class */}
        <span
          style={{
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "hsl(var(--muted-foreground))",
          }}
        >
          {formatLoanType(deal.loanType) || "—"}
        </span>

        {/* Right: Doc progress */}
        {deal.docsTotal > 0 ? (
          <div className="flex items-center" style={{ gap: "4px" }}>
            <Paperclip
              size={11}
              strokeWidth={2}
              style={{ color: docsComplete ? "#22A861" : "hsl(var(--muted-foreground))" }}
            />
            <div
              style={{
                width: "40px",
                height: "3px",
                borderRadius: "2px",
                backgroundColor: "hsl(var(--border))",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${(deal.docsApproved / deal.docsTotal) * 100}%`,
                  height: "100%",
                  borderRadius: "2px",
                  backgroundColor: docsComplete ? "#22A861" : "hsl(var(--foreground))",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
            <span
              className="font-mono"
              style={{
                fontSize: "10px",
                fontWeight: 500,
                color: docsComplete ? "#22A861" : "hsl(var(--muted-foreground))",
              }}
            >
              {deal.docsApproved}/{deal.docsTotal}
            </span>
          </div>
        ) : (
          <div className="flex items-center" style={{ gap: "4px" }}>
            <Paperclip size={11} strokeWidth={2} style={{ color: "hsl(var(--muted-foreground))" }} />
            <span
              className="font-mono"
              style={{ fontSize: "10px", fontWeight: 500, color: "hsl(var(--muted-foreground))" }}
            >
              —
            </span>
          </div>
        )}
      </div>

      {/* Hover action strip */}
      <div
        className="hidden group-hover:flex"
        style={{ borderTop: "1px solid hsl(var(--border))" }}
      >
        <button
          className="flex-1 flex items-center justify-center gap-1 transition-colors"
          style={{
            padding: "7px 0",
            fontSize: "11px",
            fontWeight: 600,
            color: "hsl(var(--muted-foreground))",
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "hsl(var(--muted))";
            e.currentTarget.style.color = "hsl(var(--foreground))";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "hsl(var(--muted-foreground))";
          }}
          onClick={(e) => {
            e.stopPropagation();
            router.push(detailUrl);
          }}
        >
          <ArrowUpRight size={12} strokeWidth={1.5} />
          Open
        </button>
        <div style={{ width: "1px", backgroundColor: "hsl(var(--border))" }} />
        <button
          className="flex-1 flex items-center justify-center gap-1 transition-colors"
          style={{
            padding: "7px 0",
            fontSize: "11px",
            fontWeight: 600,
            color: "hsl(var(--muted-foreground))",
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "hsl(var(--muted))";
            e.currentTarget.style.color = "hsl(var(--foreground))";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "hsl(var(--muted-foreground))";
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Mail size={12} strokeWidth={1.5} />
          Email
        </button>
        <div style={{ width: "1px", backgroundColor: "hsl(var(--border))" }} />
        <button
          className="flex-1 flex items-center justify-center gap-1 transition-colors"
          style={{
            padding: "7px 0",
            fontSize: "11px",
            fontWeight: 600,
            color: "hsl(var(--muted-foreground))",
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "hsl(var(--muted))";
            e.currentTarget.style.color = "hsl(var(--foreground))";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "hsl(var(--muted-foreground))";
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <MessageSquare size={12} strokeWidth={1.5} />
          Note
        </button>
      </div>
    </div>
  );
}

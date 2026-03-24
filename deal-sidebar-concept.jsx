import { useState } from "react";

// ─── Mock Data ──────────────────────────────────────────────────

const MOCK_NOTES = [
  { id: 1, author: "DM", name: "Dylan Marma", time: "2h ago", text: "Spoke with borrower, they want to close by end of month. Need to expedite appraisal.", internal: true, tags: [] },
  { id: 2, author: "EA", name: "Estefania Espinal", time: "5h ago", text: "Title commitment received. Reviewing for exceptions.", internal: true, tags: ["Title Commitment"] },
  { id: 3, author: "DM", name: "Dylan Marma", time: "1d ago", text: "Rate locked at 12%. Borrower confirmed.", internal: false, tags: [] },
];

const MOCK_TASKS = [
  { id: 1, text: "Order appraisal", assignee: "EA", due: "Mar 16", done: false, priority: "high" },
  { id: 2, text: "Review title exceptions", assignee: "EA", due: "Mar 17", done: false, priority: "medium" },
  { id: 3, text: "Send term sheet to borrower", assignee: "DM", due: "Mar 15", done: false, priority: "high" },
  { id: 4, text: "Verify entity docs", assignee: "LR", due: "Mar 18", done: false, priority: "low" },
  { id: 5, text: "Pull credit report", assignee: "LR", due: "Mar 14", done: true, priority: "medium" },
];

const MOCK_ACTIVITY = [
  { id: 1, type: "email_out", title: "Email sent to borrower", detail: "Term Sheet - Valor Quest Portfolio", time: "11:42 AM", date: "Today", actor: "DM", actorName: "Dylan Marma", preview: "Hi Marcus, please find attached the term sheet for the portfolio acquisition. Let me know if you have any questions on the rate or terms." },
  { id: 2, type: "call", title: "Call with borrower", detail: "Marcus Rivera - 12 min", time: "10:15 AM", date: "Today", actor: "DM", actorName: "Dylan Marma", preview: "Discussed closing timeline. Borrower wants to close by 3/28. Confirmed 12% rate is acceptable. Will send entity docs by EOD tomorrow." },
  { id: 3, type: "field", title: "Updated loan_purpose", detail: "Changed to \"Acquisition\"", time: "9:48 AM", date: "Today", actor: "DM", actorName: "Dylan Marma" },
  { id: 4, type: "field", title: "Updated interest_rate", detail: "Changed to 12.00%", time: "9:47 AM", date: "Today", actor: "DM", actorName: "Dylan Marma" },
  { id: 5, type: "team", title: "Team member added", detail: "Estefania Espinal as Processor", time: "9:30 AM", date: "Today", actor: "Sys", actorName: "System" },
  { id: 6, type: "team", title: "Team member added", detail: "Luis Rodriguez as Originator", time: "9:30 AM", date: "Today", actor: "Sys", actorName: "System" },
  { id: 7, type: "email_in", title: "Email from borrower", detail: "RE: Loan Application - Valor Quest", time: "4:22 PM", date: "Yesterday", actor: "MR", actorName: "Marcus Rivera", preview: "Dylan, here is our most recent operating statement and the rent roll you requested. Let me know what else you need to move forward." },
  { id: 8, type: "doc", title: "Document uploaded", detail: "Operating Statement - 2025.pdf", time: "4:22 PM", date: "Yesterday", actor: "EA", actorName: "Estefania Espinal" },
  { id: 9, type: "doc", title: "Document uploaded", detail: "Rent Roll - March 2026.xlsx", time: "4:22 PM", date: "Yesterday", actor: "EA", actorName: "Estefania Espinal" },
  { id: 10, type: "note", title: "Note posted", detail: "Internal", time: "3:15 PM", date: "Yesterday", actor: "EA", actorName: "Estefania Espinal", preview: "Title commitment received. Reviewing for exceptions. Will flag anything unusual." },
  { id: 11, type: "doc", title: "Document uploaded", detail: "Borrower ID / Driver's License", time: "2:00 PM", date: "Yesterday", actor: "EA", actorName: "Estefania Espinal" },
  { id: 12, type: "field", title: "Updated loan_amount", detail: "Changed to $14,400,000", time: "1:45 PM", date: "Yesterday", actor: "DM", actorName: "Dylan Marma" },
  { id: 13, type: "field", title: "Updated source", detail: "Changed to \"Direct\"", time: "1:44 PM", date: "Yesterday", actor: "DM", actorName: "Dylan Marma" },
  { id: 14, type: "email_out", title: "Email sent to borrower", detail: "Application Received - Next Steps", time: "11:00 AM", date: "Mar 13", actor: "DM", actorName: "Dylan Marma", preview: "Marcus, thanks for submitting your application for the portfolio acquisition. We'll need the following to proceed: operating statement, rent roll, and entity documents." },
  { id: 15, type: "sms_out", title: "Text sent to borrower", detail: "Marcus Rivera", time: "10:55 AM", date: "Mar 13", actor: "DM", actorName: "Dylan Marma", preview: "Hey Marcus, just sent you an email with next steps on the Valor Quest deal. Let me know if you have questions." },
  { id: 16, type: "stage", title: "Stage changed", detail: "New to Lead", time: "10:30 AM", date: "Mar 13", actor: "Sys", actorName: "System" },
  { id: 17, type: "system", title: "Deal created", detail: "RL1141 - Valor Quest Endeavors, LLC - Portfolio", time: "10:28 AM", date: "Mar 13", actor: "Sys", actorName: "System" },
];

// ─── Diligence Mock Data ────────────────────────────────────────

const MOCK_DOCUMENTS = [
  // Financials
  { id: "d1", name: "Operating Statement - 2025.pdf", category: "Financials", uploadedBy: "EA", uploadedAt: "Mar 14", size: "2.4 MB", archived: false },
  { id: "d2", name: "Rent Roll - March 2026.xlsx", category: "Financials", uploadedBy: "EA", uploadedAt: "Mar 14", size: "890 KB", archived: false },
  { id: "d3", name: "Bank Statements - Q4 2025.pdf", category: "Financials", uploadedBy: "MR", uploadedAt: "Mar 13", size: "5.1 MB", archived: false },
  { id: "d4", name: "Tax Returns - 2024.pdf", category: "Financials", uploadedBy: "MR", uploadedAt: "Mar 13", size: "8.2 MB", archived: false },
  { id: "d5", name: "Tax Returns - 2023.pdf", category: "Financials", uploadedBy: "MR", uploadedAt: "Mar 13", size: "7.8 MB", archived: false },
  { id: "d30", name: "Operating Statement - 2024 DRAFT.pdf", category: "Financials", uploadedBy: "EA", uploadedAt: "Mar 12", size: "2.1 MB", archived: true },
  { id: "d31", name: "Rent Roll - Feb 2026 DRAFT.xlsx", category: "Financials", uploadedBy: "EA", uploadedAt: "Mar 11", size: "780 KB", archived: true },
  { id: "d32", name: "Bank Statements - Q3 2025.pdf", category: "Financials", uploadedBy: "MR", uploadedAt: "Mar 10", size: "4.9 MB", archived: true },
  // Application
  { id: "d6", name: "Loan Application - Signed.pdf", category: "Application", uploadedBy: "MR", uploadedAt: "Mar 13", size: "1.1 MB", archived: false },
  { id: "d7", name: "Credit Authorization.pdf", category: "Application", uploadedBy: "MR", uploadedAt: "Mar 13", size: "420 KB", archived: false },
  { id: "d8", name: "Borrower ID - Marcus Rivera.pdf", category: "Application", uploadedBy: "EA", uploadedAt: "Mar 14", size: "1.8 MB", archived: false },
  { id: "d33", name: "Loan Application - DRAFT v1.pdf", category: "Application", uploadedBy: "MR", uploadedAt: "Mar 11", size: "980 KB", archived: true },
  { id: "d34", name: "Loan Application - DRAFT v2.pdf", category: "Application", uploadedBy: "MR", uploadedAt: "Mar 12", size: "1.0 MB", archived: true },
  // Legal
  { id: "d9", name: "Purchase & Sale Agreement.pdf", category: "Legal", uploadedBy: "DM", uploadedAt: "Mar 13", size: "4.2 MB", archived: false },
  { id: "d10", name: "Entity Formation Docs.pdf", category: "Entity", uploadedBy: "EA", uploadedAt: "Mar 14", size: "3.1 MB", archived: false },
  { id: "d11", name: "Operating Agreement - Valor Quest LLC.pdf", category: "Entity", uploadedBy: "MR", uploadedAt: "Mar 13", size: "2.8 MB", archived: false },
  { id: "d12", name: "Certificate of Good Standing - FL.pdf", category: "Entity", uploadedBy: "EA", uploadedAt: "Mar 14", size: "340 KB", archived: false },
  { id: "d13", name: "Title Commitment.pdf", category: "Legal", uploadedBy: "EA", uploadedAt: "Mar 14", size: "6.4 MB", archived: false },
  { id: "d14", name: "UCC Search Results.pdf", category: "Legal", uploadedBy: "EA", uploadedAt: "Mar 14", size: "1.2 MB", archived: false },
  { id: "d35", name: "PSA - Redline v1.pdf", category: "Legal", uploadedBy: "DM", uploadedAt: "Mar 11", size: "4.0 MB", archived: true },
  { id: "d36", name: "PSA - Redline v2.pdf", category: "Legal", uploadedBy: "DM", uploadedAt: "Mar 12", size: "4.1 MB", archived: true },
  // Property
  { id: "d15", name: "Property Photos - Portfolio.zip", category: "Property", uploadedBy: "MR", uploadedAt: "Mar 13", size: "18.7 MB", archived: false },
  { id: "d16", name: "Appraisal Report.pdf", category: "Property", uploadedBy: "EA", uploadedAt: "Mar 15", size: "12.3 MB", archived: false },
  { id: "d17", name: "Phase I Environmental.pdf", category: "Property", uploadedBy: "EA", uploadedAt: "Mar 15", size: "8.9 MB", archived: false },
  { id: "d18", name: "Survey - Plat Map.pdf", category: "Property", uploadedBy: "EA", uploadedAt: "Mar 14", size: "3.5 MB", archived: false },
  { id: "d19", name: "Property Inspection Report.pdf", category: "Property", uploadedBy: "EA", uploadedAt: "Mar 14", size: "5.2 MB", archived: false },
  { id: "d20", name: "Flood Certification.pdf", category: "Property", uploadedBy: "EA", uploadedAt: "Mar 14", size: "620 KB", archived: false },
  { id: "d37", name: "Property Photos - Unit Interiors DRAFT.zip", category: "Property", uploadedBy: "MR", uploadedAt: "Mar 10", size: "22.1 MB", archived: true },
  // Insurance
  { id: "d21", name: "Hazard Insurance - Quote.pdf", category: "Insurance", uploadedBy: "EA", uploadedAt: "Mar 14", size: "1.4 MB", archived: false },
  { id: "d22", name: "Liability Insurance COI.pdf", category: "Insurance", uploadedBy: "MR", uploadedAt: "Mar 13", size: "980 KB", archived: false },
  { id: "d23", name: "Flood Insurance Quote.pdf", category: "Insurance", uploadedBy: "EA", uploadedAt: "Mar 14", size: "1.1 MB", archived: false },
  { id: "d38", name: "Hazard Insurance - Expired Policy.pdf", category: "Insurance", uploadedBy: "EA", uploadedAt: "Mar 9", size: "1.3 MB", archived: true },
  // Closing
  { id: "d24", name: "Closing Disclosure Draft.pdf", category: "Closing", uploadedBy: "EA", uploadedAt: "Mar 15", size: "2.2 MB", archived: false },
  { id: "d25", name: "Wire Instructions.pdf", category: "Closing", uploadedBy: "DM", uploadedAt: "Mar 15", size: "180 KB", archived: false },
  { id: "d26", name: "Borrower Authorization to Close.pdf", category: "Closing", uploadedBy: "MR", uploadedAt: "Mar 15", size: "540 KB", archived: false },
  // Internal / Underwriting
  { id: "d27", name: "Credit Report - Marcus Rivera.pdf", category: "Underwriting", uploadedBy: "LR", uploadedAt: "Mar 14", size: "2.8 MB", archived: false },
  { id: "d28", name: "Deal Memo - Internal.docx", category: "Underwriting", uploadedBy: "DM", uploadedAt: "Mar 14", size: "1.6 MB", archived: false },
  { id: "d29", name: "Comp Analysis.xlsx", category: "Underwriting", uploadedBy: "DM", uploadedAt: "Mar 14", size: "3.4 MB", archived: false },
  { id: "d39", name: "Deal Memo - DRAFT v1.docx", category: "Underwriting", uploadedBy: "DM", uploadedAt: "Mar 12", size: "1.4 MB", archived: true },
  { id: "d40", name: "Deal Memo - DRAFT v2.docx", category: "Underwriting", uploadedBy: "DM", uploadedAt: "Mar 13", size: "1.5 MB", archived: true },
];

const INITIAL_CONDITIONS = [
  // Pre-Approval
  { id: "c1", name: "Signed Loan Application", category: "Pre-Approval", status: "received", docIds: ["d6"], requiredBy: null, note: null },
  { id: "c2", name: "Purchase & Sale Agreement", category: "Pre-Approval", status: "received", docIds: ["d9"], requiredBy: null, note: null },
  { id: "c3", name: "Borrower ID / Driver's License", category: "Pre-Approval", status: "received", docIds: ["d8"], requiredBy: null, note: null },
  { id: "c4", name: "Credit Authorization", category: "Pre-Approval", status: "received", docIds: ["d7"], requiredBy: null, note: null },
  // Underwriting
  { id: "c5", name: "Operating Statement (T-12)", category: "Underwriting", status: "received", docIds: ["d1"], requiredBy: null, note: null },
  { id: "c6", name: "Current Rent Roll", category: "Underwriting", status: "received", docIds: ["d2"], requiredBy: null, note: null },
  { id: "c7", name: "Appraisal Report", category: "Underwriting", status: "received", docIds: ["d16"], requiredBy: "Mar 20", note: "Ordered with ABC Appraisals" },
  { id: "c8", name: "Environmental Report (Phase I)", category: "Underwriting", status: "received", docIds: ["d17"], requiredBy: "Mar 22", note: null },
  { id: "c9", name: "Property Insurance Quote", category: "Underwriting", status: "pending", docIds: [], requiredBy: "Mar 19", note: null },
  { id: "c10", name: "Credit Report", category: "Underwriting", status: "received", docIds: ["d27"], requiredBy: null, note: null },
  // Legal / Closing
  { id: "c11", name: "Title Commitment", category: "Legal / Closing", status: "under_review", docIds: ["d13"], requiredBy: "Mar 18", note: "Received, reviewing exceptions" },
  { id: "c12", name: "Entity Formation Documents", category: "Legal / Closing", status: "received", docIds: ["d10", "d11"], requiredBy: null, note: null },
  { id: "c13", name: "Certificate of Good Standing", category: "Legal / Closing", status: "received", docIds: ["d12"], requiredBy: "Mar 21", note: null },
  { id: "c14", name: "UCC Search", category: "Legal / Closing", status: "received", docIds: ["d14"], requiredBy: "Mar 22", note: null },
  { id: "c15", name: "Borrower Authorization to Close", category: "Legal / Closing", status: "received", docIds: ["d26"], requiredBy: null, note: null },
  { id: "c16", name: "Proof of Hazard Insurance", category: "Legal / Closing", status: "pending", docIds: [], requiredBy: null, note: null },
  // Post-Closing
  { id: "c17", name: "Recorded Mortgage / Deed of Trust", category: "Post-Closing", status: "not_started", docIds: [], requiredBy: null, note: null },
  { id: "c18", name: "Final Title Policy", category: "Post-Closing", status: "not_started", docIds: [], requiredBy: null, note: null },
  { id: "c19", name: "Executed Assignment of Leases", category: "Post-Closing", status: "not_started", docIds: [], requiredBy: null, note: null },
];

const CONDITION_CATEGORIES = ["Pre-Approval", "Underwriting", "Legal / Closing", "Post-Closing"];

// ─── Primitives ─────────────────────────────────────────────────

function Avatar({ initials, size = "sm" }) {
  const sizes = { xs: "h-4 w-4 text-[8px]", sm: "h-5 w-5 text-[9px]", md: "h-7 w-7 text-[11px]" };
  const colors = {
    DM: "bg-blue-600", EA: "bg-purple-600", LR: "bg-emerald-600",
    MR: "bg-orange-600", Sys: "bg-zinc-700",
  };
  return (
    <div className={`${sizes[size]} ${colors[initials] || "bg-zinc-600"} rounded-full flex items-center justify-center text-white font-medium shrink-0`}>
      {initials}
    </div>
  );
}

function PriorityDot({ priority }) {
  const colors = { high: "bg-red-500", medium: "bg-amber-500", low: "bg-zinc-500" };
  return <span className={`h-1.5 w-1.5 rounded-full ${colors[priority]} shrink-0`} />;
}

function ChevronIcon({ open }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      className={`transition-transform duration-150 ${open ? "" : "-rotate-90"}`}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function SidebarSection({ title, count, icon, defaultOpen = true, action, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-zinc-800/60 last:border-b-0">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-800/30 transition-colors">
        <span className="text-zinc-500"><ChevronIcon open={open} /></span>
        <span className="text-zinc-400">{icon}</span>
        <span className="text-[11px] font-medium text-zinc-300 uppercase tracking-wider flex-1 text-left">{title}</span>
        {count != null && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 tabular-nums">{count}</span>
        )}
        {action && <span onClick={(e) => e.stopPropagation()}>{action}</span>}
      </button>
      {open && <div className="pb-2">{children}</div>}
    </div>
  );
}

// ─── Status Badge ───────────────────────────────────────────────

const STATUS_CONFIG = {
  received: { label: "Received", bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/20", dot: "bg-emerald-500" },
  under_review: { label: "In Review", bg: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/20", dot: "bg-blue-500" },
  pending: { label: "Pending", bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/20", dot: "bg-amber-500" },
  waived: { label: "Waived", bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/20", dot: "bg-zinc-500" },
  not_started: { label: "Not Started", bg: "bg-zinc-500/5", text: "text-zinc-500", border: "border-zinc-800", dot: "bg-zinc-600" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.not_started;
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Activity Type Config ───────────────────────────────────────

const ACTIVITY_TYPE_CONFIG = {
  email_out: { bg: "bg-blue-500/15", color: "#60a5fa", label: "Email", icon: <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6" /> },
  email_in: { bg: "bg-sky-500/15", color: "#38bdf8", label: "Email", icon: <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6" /> },
  sms_out: { bg: "bg-green-500/15", color: "#4ade80", label: "Text", icon: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></> },
  call: { bg: "bg-violet-500/15", color: "#a78bfa", label: "Call", icon: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /> },
  note: { bg: "bg-amber-500/15", color: "#fbbf24", label: "Note", icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></> },
  doc: { bg: "bg-orange-500/15", color: "#fb923c", label: "Doc", icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M12 18v-6" /><path d="M9 15h6" /></> },
  field: { bg: "bg-zinc-500/10", color: "#a1a1aa", label: "Update", icon: <><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></> },
  team: { bg: "bg-purple-500/10", color: "#c084fc", label: "Team", icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></> },
  stage: { bg: "bg-emerald-500/15", color: "#34d399", label: "Stage", icon: <><path d="M13 17l5-5-5-5" /><path d="M6 17l5-5-5-5" /></> },
  system: { bg: "bg-zinc-500/10", color: "#71717a", label: "System", icon: <><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></> },
};

const ACTIVITY_FILTERS = [
  { key: "all", label: "All" },
  { key: "comms", label: "Comms", types: ["email_out", "email_in", "sms_out", "call"] },
  { key: "notes", label: "Notes", types: ["note"] },
  { key: "docs", label: "Docs", types: ["doc"] },
  { key: "updates", label: "Updates", types: ["field", "team", "stage", "system"] },
];

// ─── Activity Feed ──────────────────────────────────────────────

function ActivityFeed() {
  const [filter, setFilter] = useState("all");
  const [expandedIds, setExpandedIds] = useState(new Set());

  const filtered = filter === "all"
    ? MOCK_ACTIVITY
    : MOCK_ACTIVITY.filter((a) => ACTIVITY_FILTERS.find((af) => af.key === filter)?.types?.includes(a.type));

  const grouped = filtered.reduce((acc, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push(item);
    return acc;
  }, {});

  function toggleExpand(id) {
    setExpandedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  const isComm = (type) => ["email_out", "email_in", "sms_out", "call"].includes(type);

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-4">
        {ACTIVITY_FILTERS.map((f) => {
          const count = f.key === "all" ? MOCK_ACTIVITY.length : MOCK_ACTIVITY.filter((a) => f.types?.includes(a.type)).length;
          return (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`text-[11px] px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${filter === f.key ? "bg-zinc-800 text-zinc-200 font-medium" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"}`}>
              {f.label}
              <span className={`text-[9px] tabular-nums ${filter === f.key ? "text-zinc-400" : "text-zinc-600"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-5">
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date}>
            <div className="flex items-center gap-3 mb-2.5">
              <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider whitespace-nowrap">{date}</span>
              <div className="flex-1 h-px bg-zinc-800/60" />
            </div>
            <div className="space-y-1">
              {items.map((item) => {
                const cfg = ACTIVITY_TYPE_CONFIG[item.type] || ACTIVITY_TYPE_CONFIG.system;
                const expanded = expandedIds.has(item.id);
                const hasPreview = !!item.preview;
                const isCommType = isComm(item.type) || item.type === "call";
                return (
                  <div key={item.id} onClick={() => hasPreview && toggleExpand(item.id)}
                    className={`flex items-start gap-3 py-2 px-3 rounded-lg transition-colors ${hasPreview ? "cursor-pointer hover:bg-zinc-800/40" : ""} ${expanded ? "bg-zinc-800/30" : ""}`}>
                    <div className={`h-7 w-7 rounded-full ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="1.8">{cfg.icon}</svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-zinc-200 font-medium">{item.title}</span>
                        {isCommType && (
                          <span className="text-[9px] px-1.5 py-0 rounded-full font-medium"
                            style={{ backgroundColor: `${cfg.color}18`, color: cfg.color, border: `1px solid ${cfg.color}25` }}>
                            {item.type === "email_in" ? "Inbound" : item.type === "email_out" ? "Outbound" : cfg.label}
                          </span>
                        )}
                        {hasPreview && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2" className="shrink-0">
                            <path d={expanded ? "M6 9l6 6 6-6" : "M9 18l6-6-6-6"} />
                          </svg>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">{item.detail}</div>
                      {expanded && item.preview && (
                        <div className="mt-2 p-2.5 rounded-md bg-zinc-900/80 border border-zinc-800/60">
                          <p className="text-[11px] text-zinc-400 leading-relaxed whitespace-pre-wrap">{item.preview}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <span className="text-[10px] text-zinc-600 tabular-nums">{item.time}</span>
                      <Avatar initials={item.actor} size="xs" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-4 pt-3 border-t border-zinc-800/40">
        <button className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="7,13 12,18 17,13" /><polyline points="7,6 12,11 17,6" />
          </svg>
          Load older activity
        </button>
      </div>
    </div>
  );
}

// ─── Diligence Tab ──────────────────────────────────────────────

const DOC_CATEGORIES_LIST = ["All", "Financials", "Application", "Legal", "Entity", "Property", "Insurance", "Closing", "Underwriting"];

function DiligenceTab() {
  const [conditions, setConditions] = useState(INITIAL_CONDITIONS);
  const [expandedCategories, setExpandedCategories] = useState(new Set(CONDITION_CATEGORIES));
  const [expandedDocCategories, setExpandedDocCategories] = useState(new Set(["Financials", "Application"]));
  const [showArchived, setShowArchived] = useState(false);
  const [docSearch, setDocSearch] = useState("");
  const [linkingConditionId, setLinkingConditionId] = useState(null);
  const [linkSearch, setLinkSearch] = useState("");
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteText, setEditingNoteText] = useState("");

  // Filter documents
  const activeDocs = showArchived ? MOCK_DOCUMENTS : MOCK_DOCUMENTS.filter((d) => !d.archived);
  const searchedDocs = docSearch
    ? activeDocs.filter((d) => d.name.toLowerCase().includes(docSearch.toLowerCase()))
    : activeDocs;

  // Group docs by category
  const docsByCategory = {};
  searchedDocs.forEach((d) => {
    if (!docsByCategory[d.category]) docsByCategory[d.category] = [];
    docsByCategory[d.category].push(d);
  });
  const docCategoryOrder = DOC_CATEGORIES_LIST.filter((c) => c !== "All" && docsByCategory[c]);
  const archivedCount = MOCK_DOCUMENTS.filter((d) => d.archived).length;
  const activeCount = MOCK_DOCUMENTS.filter((d) => !d.archived).length;

  function toggleDocCategory(cat) {
    setExpandedDocCategories((prev) => { const next = new Set(prev); next.has(cat) ? next.delete(cat) : next.add(cat); return next; });
  }

  function toggleCategory(cat) {
    setExpandedCategories((prev) => { const next = new Set(prev); next.has(cat) ? next.delete(cat) : next.add(cat); return next; });
  }

  // Link a document to a condition
  function linkDocToCondition(condId, docId) {
    setConditions((prev) => prev.map((c) => {
      if (c.id === condId && !c.docIds.includes(docId)) {
        return { ...c, docIds: [...c.docIds, docId] };
      }
      return c;
    }));
    setLinkingConditionId(null);
    setLinkSearch("");
  }

  // Unlink a document from a condition
  function unlinkDoc(condId, docId) {
    setConditions((prev) => prev.map((c) => {
      if (c.id === condId) {
        return { ...c, docIds: c.docIds.filter((id) => id !== docId) };
      }
      return c;
    }));
  }

  // Open note editor for a condition
  function openNoteEditor(condId) {
    const cond = conditions.find((c) => c.id === condId);
    setEditingNoteId(condId);
    setEditingNoteText(cond?.note || "");
  }

  // Save note
  function saveNote(condId) {
    setConditions((prev) => prev.map((c) => {
      if (c.id === condId) {
        return { ...c, note: editingNoteText.trim() || null };
      }
      return c;
    }));
    setEditingNoteId(null);
    setEditingNoteText("");
  }

  // Clear note
  function clearNote(condId) {
    setConditions((prev) => prev.map((c) => {
      if (c.id === condId) {
        return { ...c, note: null };
      }
      return c;
    }));
    setEditingNoteId(null);
    setEditingNoteText("");
  }

  // Stats
  const total = conditions.length;
  const received = conditions.filter((c) => c.status === "received").length;
  const inReview = conditions.filter((c) => c.status === "under_review").length;
  const pending = conditions.filter((c) => c.status === "pending").length;
  const notStarted = conditions.filter((c) => c.status === "not_started").length;
  const pctComplete = Math.round((received / total) * 100);

  // Compact file type badge
  function FileTypeBadge({ name, small = false }) {
    const ext = name.split(".").pop()?.toLowerCase();
    const cfgMap = {
      pdf: { color: "#ef4444", label: "PDF" },
      xlsx: { color: "#22c55e", label: "XLS" },
      docx: { color: "#3b82f6", label: "DOC" },
      zip: { color: "#a78bfa", label: "ZIP" },
    };
    const cfg = cfgMap[ext] || { color: "#71717a", label: ext?.toUpperCase() || "?" };
    const sz = small ? "h-5 w-7 text-[7px]" : "h-6 w-8 text-[8px]";
    return (
      <div className={`${sz} rounded flex items-center justify-center shrink-0 font-bold tracking-wider`}
        style={{ backgroundColor: `${cfg.color}12`, color: cfg.color, border: `1px solid ${cfg.color}18` }}>
        {cfg.label}
      </div>
    );
  }

  // Docs available for linking (not already linked to the condition)
  function getAvailableDocsForLinking(condId) {
    const cond = conditions.find((c) => c.id === condId);
    if (!cond) return [];
    const linked = new Set(cond.docIds);
    let available = MOCK_DOCUMENTS.filter((d) => !d.archived && !linked.has(d.id));
    if (linkSearch) {
      available = available.filter((d) => d.name.toLowerCase().includes(linkSearch.toLowerCase()));
    }
    return available;
  }

  return (
    <div className="space-y-6 max-w-5xl">

      {/* ── DOCUMENTS SECTION (Compact) ── */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" />
            </svg>
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">Documents</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 tabular-nums">{activeCount}</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Archive toggle */}
            <button onClick={() => setShowArchived(!showArchived)}
              className={`text-[10px] px-2 py-1 rounded-md transition-colors flex items-center gap-1.5 ${showArchived ? "bg-zinc-800 text-zinc-300 font-medium" : "text-zinc-500 hover:text-zinc-300"}`}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" />
              </svg>
              Archived
              {archivedCount > 0 && <span className="text-[9px] text-zinc-500">({archivedCount})</span>}
            </button>
            <button className="text-[11px] px-2.5 py-1 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
              Upload
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative mb-3">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2" className="absolute left-2.5 top-1/2 -translate-y-1/2">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input type="text" placeholder="Search documents..." value={docSearch} onChange={(e) => setDocSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-md pl-8 pr-3 py-1.5 text-[11px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors" />
        </div>

        {/* Collapsible category groups with compact rows */}
        <div className="space-y-0.5">
          {docCategoryOrder.map((cat) => {
            const docs = docsByCategory[cat];
            const isOpen = expandedDocCategories.has(cat);
            return (
              <div key={cat} className="rounded-md overflow-hidden">
                <button onClick={() => toggleDocCategory(cat)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-zinc-800/30 transition-colors rounded-md">
                  <ChevronIcon open={isOpen} />
                  <span className="text-[11px] font-medium text-zinc-300 flex-1 text-left">{cat}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-zinc-800/80 text-zinc-500 tabular-nums">{docs.length}</span>
                </button>
                {isOpen && (
                  <div className="ml-1">
                    {docs.map((doc) => (
                      <div key={doc.id} className={`flex items-center gap-2.5 py-1 px-2.5 rounded hover:bg-zinc-800/40 transition-colors cursor-pointer group ${doc.archived ? "opacity-40" : ""}`}>
                        <FileTypeBadge name={doc.name} />
                        <span className={`text-[11px] flex-1 min-w-0 truncate ${doc.archived ? "text-zinc-500 line-through" : "text-zinc-200 group-hover:text-white"}`}>
                          {doc.name}
                        </span>
                        <span className="text-[9px] text-zinc-600 shrink-0">{doc.size}</span>
                        <Avatar initials={doc.uploadedBy} size="xs" />
                        <span className="text-[9px] text-zinc-600 shrink-0 tabular-nums">{doc.uploadedAt}</span>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          {!doc.archived && (
                            <button className="h-5 w-5 rounded flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800" title="Archive">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" />
                              </svg>
                            </button>
                          )}
                          <button className="h-5 w-5 rounded flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800" title="Download">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {searchedDocs.length === 0 && (
          <div className="text-center py-6 text-[11px] text-zinc-600">No documents match your search.</div>
        )}
      </div>

      {/* ── CONDITIONS SECTION ── */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="1.5">
              <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">Conditions</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 tabular-nums">{received}/{total}</span>
          </div>
        </div>

        {/* Progress bar + stats */}
        <div className="mb-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${pctComplete}%` }} />
            </div>
            <span className="text-[12px] font-medium text-zinc-300 tabular-nums">{pctComplete}%</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-zinc-400">Received <span className="text-zinc-300 font-medium">{received}</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-[10px] text-zinc-400">In Review <span className="text-zinc-300 font-medium">{inReview}</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-[10px] text-zinc-400">Pending <span className="text-zinc-300 font-medium">{pending}</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-zinc-600" />
              <span className="text-[10px] text-zinc-400">Not Started <span className="text-zinc-300 font-medium">{notStarted}</span></span>
            </div>
          </div>
        </div>

        {/* Condition categories */}
        <div className="space-y-1">
          {CONDITION_CATEGORIES.map((cat) => {
            const catConditions = conditions.filter((c) => c.category === cat);
            const catReceived = catConditions.filter((c) => c.status === "received").length;
            const isOpen = expandedCategories.has(cat);

            return (
              <div key={cat} className="rounded-md border border-zinc-800/50 overflow-hidden">
                <button onClick={() => toggleCategory(cat)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-800/30 transition-colors">
                  <ChevronIcon open={isOpen} />
                  <span className="text-[12px] font-medium text-zinc-200 flex-1 text-left">{cat}</span>
                  <span className="text-[10px] text-zinc-500 tabular-nums">{catReceived}/{catConditions.length}</span>
                </button>

                {isOpen && (
                  <div className="border-t border-zinc-800/30">
                    {catConditions.map((cond) => {
                      const linkedDocs = cond.docIds.map((id) => MOCK_DOCUMENTS.find((d) => d.id === id)).filter(Boolean);
                      const isLinking = linkingConditionId === cond.id;
                      const availableDocs = isLinking ? getAvailableDocsForLinking(cond.id) : [];
                      const isEditingNote = editingNoteId === cond.id;

                      return (
                        <div key={cond.id} className="px-3 py-2 hover:bg-zinc-800/20 transition-colors group">
                          <div className="flex items-center gap-3">
                            {/* Status indicator */}
                            {cond.status === "received" ? (
                              <div className="h-4 w-4 rounded border border-emerald-600 bg-emerald-600/20 flex items-center justify-center shrink-0">
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                              </div>
                            ) : (
                              <div className={`h-4 w-4 rounded border shrink-0 ${
                                cond.status === "under_review" ? "border-blue-500/50 bg-blue-500/10" :
                                cond.status === "pending" ? "border-amber-500/50 bg-amber-500/10" :
                                "border-zinc-700"
                              }`} />
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`text-[12px] ${cond.status === "received" ? "text-zinc-400" : "text-zinc-200"}`}>
                                  {cond.name}
                                </span>
                                <StatusBadge status={cond.status} />
                                {/* Pinned note indicator (always visible when note exists) */}
                                {cond.note && !isEditingNote && (
                                  <button onClick={(e) => { e.stopPropagation(); openNoteEditor(cond.id); }}
                                    className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/8 text-amber-400/80 border border-amber-500/15 hover:bg-amber-500/15 hover:text-amber-300 transition-colors cursor-pointer"
                                    title="View/edit pinned note">
                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                      <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                    </svg>
                                    Note
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Due date */}
                            {cond.requiredBy && cond.status !== "received" && (
                              <span className={`text-[10px] shrink-0 ${cond.requiredBy === "Mar 18" || cond.requiredBy === "Mar 19" ? "text-amber-400" : "text-zinc-500"}`}>
                                Due {cond.requiredBy}
                              </span>
                            )}

                            {/* Action buttons */}
                            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              {/* Note button */}
                              <button onClick={(e) => { e.stopPropagation(); openNoteEditor(cond.id); }}
                                className={`h-6 px-1.5 rounded flex items-center justify-center gap-1 text-[10px] transition-colors ${isEditingNote ? "bg-amber-600/20 text-amber-400 border border-amber-500/30" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"}`}
                                title={cond.note ? "Edit pinned note" : "Add pinned note"}>
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                </svg>
                                Note
                              </button>
                              {/* Link existing doc button */}
                              <button onClick={(e) => { e.stopPropagation(); setLinkingConditionId(isLinking ? null : cond.id); setLinkSearch(""); }}
                                className={`h-6 px-1.5 rounded flex items-center justify-center gap-1 text-[10px] transition-colors ${isLinking ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"}`}
                                title="Link existing document">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                </svg>
                                Link
                              </button>
                              {/* Upload button */}
                              {cond.status !== "received" && (
                                <button className="h-6 px-1.5 rounded flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors" title="Upload new document">
                                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                  Upload
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Pinned note editor / viewer */}
                          {isEditingNote && (
                            <div className="mt-2 ml-7 p-2.5 rounded-md bg-amber-500/5 border border-amber-500/15 max-w-lg">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
                                  <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                </svg>
                                <span className="text-[10px] font-medium text-amber-400/90 uppercase tracking-wider">Pinned Note</span>
                              </div>
                              <textarea
                                value={editingNoteText}
                                onChange={(e) => setEditingNoteText(e.target.value)}
                                placeholder="Add a note for this condition..."
                                autoFocus
                                rows={2}
                                className="w-full bg-zinc-950/60 border border-amber-500/10 rounded px-2.5 py-1.5 text-[11px] text-zinc-200 placeholder:text-zinc-600 resize-none focus:outline-none focus:border-amber-500/30 transition-colors"
                              />
                              <div className="flex items-center justify-between mt-1.5">
                                <div className="flex items-center gap-1.5">
                                  {cond.note && (
                                    <button onClick={() => clearNote(cond.id)}
                                      className="text-[9px] px-1.5 py-0.5 rounded text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                      Clear note
                                    </button>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button onClick={() => { setEditingNoteId(null); setEditingNoteText(""); }}
                                    className="text-[9px] px-2 py-0.5 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors">
                                    Cancel
                                  </button>
                                  <button onClick={() => saveNote(cond.id)}
                                    className="text-[9px] px-2 py-0.5 rounded bg-amber-600/20 text-amber-300 hover:bg-amber-600/30 border border-amber-500/20 transition-colors">
                                    Save
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Pinned note preview (when not editing) */}
                          {cond.note && !isEditingNote && (
                            <div onClick={() => openNoteEditor(cond.id)}
                              className="mt-1 ml-7 px-2.5 py-1.5 rounded bg-amber-500/5 border border-amber-500/10 cursor-pointer hover:bg-amber-500/8 hover:border-amber-500/20 transition-colors max-w-lg group/note">
                              <div className="flex items-start gap-1.5">
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" className="shrink-0 mt-0.5 opacity-50">
                                  <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                </svg>
                                <span className="text-[10px] text-amber-200/60 leading-relaxed flex-1">{cond.note}</span>
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" className="shrink-0 mt-0.5 opacity-0 group-hover/note:opacity-40 transition-opacity">
                                  <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                </svg>
                              </div>
                            </div>
                          )}

                          {/* Linked document chips */}
                          {linkedDocs.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-1.5 ml-7 flex-wrap">
                              {linkedDocs.map((doc) => (
                                <span key={doc.id} className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60 flex items-center gap-1 cursor-pointer hover:text-zinc-300 hover:border-zinc-600 transition-colors group/chip">
                                  <FileTypeBadge name={doc.name} small />
                                  <span className="max-w-[140px] truncate">{doc.name}</span>
                                  <button onClick={(e) => { e.stopPropagation(); unlinkDoc(cond.id, doc.id); }}
                                    className="ml-0.5 text-zinc-600 hover:text-red-400 transition-colors hidden group-hover/chip:inline" title="Unlink">
                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Link document dropdown */}
                          {isLinking && (
                            <div className="mt-2 ml-7 p-2 rounded-md bg-zinc-900 border border-zinc-700/60 shadow-lg max-w-md">
                              <div className="relative mb-2">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2" className="absolute left-2 top-1/2 -translate-y-1/2">
                                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                                </svg>
                                <input type="text" placeholder="Search documents to link..." value={linkSearch} onChange={(e) => setLinkSearch(e.target.value)} autoFocus
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded pl-7 pr-2 py-1 text-[10px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />
                              </div>
                              <div className="max-h-36 overflow-y-auto space-y-0.5">
                                {availableDocs.length === 0 ? (
                                  <div className="text-[10px] text-zinc-600 py-2 text-center">No documents available to link.</div>
                                ) : (
                                  availableDocs.slice(0, 8).map((doc) => (
                                    <button key={doc.id} onClick={() => linkDocToCondition(cond.id, doc.id)}
                                      className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-zinc-800/60 transition-colors text-left">
                                      <FileTypeBadge name={doc.name} small />
                                      <span className="text-[10px] text-zinc-300 truncate flex-1">{doc.name}</span>
                                      <span className="text-[9px] text-zinc-600">{doc.category}</span>
                                    </button>
                                  ))
                                )}
                                {availableDocs.length > 8 && (
                                  <div className="text-[9px] text-zinc-600 text-center pt-1">+{availableDocs.length - 8} more, refine your search</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Layout ────────────────────────────────────────────────

export default function DealSidebarConcept() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("Diligence");
  const [noteText, setNoteText] = useState("");
  const [tasks, setTasks] = useState(MOCK_TASKS);

  const dealTabs = ["Overview", "Property", "Underwriting", "Borrower", "Diligence"];
  const pendingTasks = tasks.filter((t) => !t.done);
  const completedTasks = tasks.filter((t) => t.done);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 flex flex-col">
      {/* Top breadcrumb */}
      <div className="h-11 border-b border-zinc-800 flex items-center px-5 gap-2 shrink-0 bg-zinc-950">
        <span className="text-[11px] text-zinc-500">Pipeline</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        <span className="text-[11px] text-zinc-500">Residential DSCR</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        <span className="text-[11px] text-zinc-200 font-medium">RL1141</span>
      </div>

      {/* Deal header */}
      <div className="border-b border-zinc-800 px-6 py-4 shrink-0 bg-zinc-950">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v12"/><path d="M6 12h12"/></svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-zinc-100">Valor Quest Endeavors, LLC - Portfolio</h1>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-medium">DSCR</span>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[12px] text-zinc-500">Multifamily</span>
                <span className="text-[12px] text-zinc-300 font-medium tabular-nums">$14,400,000</span>
                <span className="text-[12px] text-zinc-500 flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  0 days in stage
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1">
              <Avatar initials="EA" size="md" />
              <Avatar initials="DM" size="md" />
            </div>
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`h-8 w-8 rounded-md flex items-center justify-center transition-colors border ${sidebarOpen ? "bg-zinc-800 border-zinc-700 text-zinc-300" : "bg-transparent border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"}`}
              title={sidebarOpen ? "Close sidebar" : "Open sidebar"}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M15 3v18" /></svg>
            </button>
            <button className="text-[12px] px-3 py-1.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
              Actions
            </button>
          </div>
        </div>

        {/* Stage stepper */}
        <div className="flex items-center gap-2 mt-4">
          {["Lead", "Analysis", "Negotiation", "Execution", "Closed"].map((stage, i) => (
            <div key={stage} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 ${i === 0 ? "text-zinc-100" : "text-zinc-600"}`}>
                <span className={`h-5 w-5 rounded-full text-[10px] font-medium flex items-center justify-center ${i === 0 ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-500"}`}>{i + 1}</span>
                <span className="text-[12px]">{stage}</span>
              </div>
              {i < 4 && <div className="w-6 h-px bg-zinc-800" />}
            </div>
          ))}
        </div>
      </div>

      {/* Main content + sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex items-center gap-1 px-6 pt-3 border-b border-zinc-800 shrink-0 bg-zinc-950">
            {dealTabs.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`text-[13px] px-3 py-2 transition-colors ${activeTab === tab ? "text-zinc-100 border-b-2 border-blue-500 font-medium" : "text-zinc-500 hover:text-zinc-300"}`}>
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {/* ── Overview Tab ── */}
            {activeTab === "Overview" && (
              <div className="space-y-5 max-w-5xl">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
                    <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">Loan Terms</span>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    {[{ label: "Interest Rate", value: "12.00%" }, { label: "Loan Term (months)", value: "12" }, { label: "Origination Fee %", value: "2.00%" }].map((item) => (
                      <div key={item.label}>
                        <div className="text-[11px] text-zinc-500 mb-1">{item.label}</div>
                        <div className="text-[15px] font-medium text-zinc-200 tabular-nums">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v12"/><path d="M6 12h12"/></svg>
                    <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">Deal Summary</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                    {[{ label: "Asset Class", value: "Multifamily" }, { label: "Loan Amount", value: "$14,400,000" }, { label: "Loan Purpose", value: "Acquisition" }, { label: "Investment Strategy", value: "Value-Add" }, { label: "Lead Source", value: "Direct" }, { label: "Date Created", value: "Mar 13, 2026" }].map((item) => (
                      <div key={item.label} className="flex items-baseline justify-between py-1.5 border-b border-zinc-800/50">
                        <span className="text-[12px] text-zinc-500">{item.label}</span>
                        <span className="text-[13px] text-zinc-200 tabular-nums">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="1.5"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>
                    <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">Activity</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 tabular-nums ml-1">{MOCK_ACTIVITY.length}</span>
                  </div>
                  <ActivityFeed />
                </div>
              </div>
            )}

            {/* ── Diligence Tab ── */}
            {activeTab === "Diligence" && <DiligenceTab />}

            {/* ── Other Tabs ── */}
            {activeTab !== "Overview" && activeTab !== "Diligence" && (
              <div className="flex items-center justify-center h-64 text-zinc-600 text-sm">{activeTab} tab content</div>
            )}
          </div>
        </div>

        {/* ━━━ RIGHT SIDEBAR ━━━ */}
        {sidebarOpen && (
          <div className="w-80 border-l border-zinc-800 flex flex-col bg-zinc-900/20 shrink-0 overflow-y-auto">
            <SidebarSection title="Tasks" count={pendingTasks.length}
              icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>}
              action={<button className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors px-1.5 py-0.5 rounded hover:bg-zinc-800">+ Add</button>}>
              <div className="px-2 space-y-0.5">
                {pendingTasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-2 py-1 px-1.5 rounded hover:bg-zinc-800/40 transition-colors group cursor-pointer">
                    <button onClick={() => setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, done: true } : t))}
                      className="mt-0.5 h-3.5 w-3.5 rounded border border-zinc-600 group-hover:border-zinc-400 transition-colors shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <PriorityDot priority={task.priority} />
                        <span className="text-[11px] text-zinc-200 truncate">{task.text}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Avatar initials={task.assignee} size="xs" />
                        <span className={`text-[10px] ${task.due === "Mar 15" ? "text-red-400" : "text-zinc-500"}`}>
                          {task.due === "Mar 15" ? "Due today" : task.due}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {completedTasks.length > 0 && (
                  <div className="flex items-center gap-1.5 px-1.5 pt-1 opacity-40">
                    <div className="h-3.5 w-3.5 rounded border border-emerald-600 bg-emerald-600/20 flex items-center justify-center shrink-0">
                      <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                    </div>
                    <span className="text-[10px] text-zinc-500">{completedTasks.length} completed</span>
                  </div>
                )}
              </div>
            </SidebarSection>

            <SidebarSection title="Notes" count={MOCK_NOTES.length}
              icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}>
              <div className="px-2">
                <div className="px-1.5 mb-2">
                  <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a note..."
                    className="w-full bg-zinc-900 border border-zinc-700/60 rounded-md px-2.5 py-1.5 text-[11px] text-zinc-200 placeholder:text-zinc-600 resize-none focus:outline-none focus:border-zinc-500 transition-colors" rows={2} />
                  <div className="flex items-center justify-between mt-1">
                    <button className="text-[9px] px-1.5 py-0.5 rounded border border-amber-500/30 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors flex items-center gap-0.5">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      Internal
                    </button>
                    <button className="text-[9px] px-2 py-0.5 rounded bg-zinc-700 text-zinc-300 hover:bg-zinc-600 transition-colors">Post</button>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {MOCK_NOTES.map((note) => (
                    <div key={note.id} className="px-1.5">
                      <div className="flex items-start gap-1.5">
                        <Avatar initials={note.author} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-medium text-zinc-300">{note.name.split(" ")[0]}</span>
                            <span className="text-[9px] text-zinc-600">{note.time}</span>
                            {note.internal && <span className="text-[8px] px-1 py-0 rounded-full bg-amber-500/10 text-amber-400/80 border border-amber-500/15">Internal</span>}
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">{note.text}</p>
                          {note.tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {note.tags.map((tag) => (
                                <span key={tag} className="text-[8px] px-1 py-0 rounded bg-blue-500/10 text-blue-400/80 border border-blue-500/15">{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SidebarSection>
          </div>
        )}
      </div>
    </div>
  );
}
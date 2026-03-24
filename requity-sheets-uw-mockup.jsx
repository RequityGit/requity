/**
 * MOCKUP REFERENCE - Visual reference for the Google Sheets UW Engine integration.
 * Updated to reflect the "embedded-native" design with all chrome stripped.
 *
 * Key design decisions:
 *   1. Google Sheets chrome is fully hidden (chrome=false, widget=false, rm=minimal)
 *   2. Unified header: sheet tab pills + sync indicator + expand/open-in-sheets
 *   3. Collapsible KPI strip below the tab row
 *   4. Fullscreen mode via Dialog (reuses document-preview pattern)
 *   5. Loading skeleton with crossfade transition
 *   6. Dark mode harmony: white bg on sheet, inset shadow, gradient transition
 *   7. Resizable sheet height with drag handle + localStorage persistence
 *   8. Auto-sync model with status dot instead of push/pull buttons
 */

// ─────────────────────────────────────────────────────────
// MOCKUP: Deal Detail Page - Tab Bar (unchanged)
// ─────────────────────────────────────────────────────────

function DealDetailTabBar() {
  const tabs = [
    "Overview",
    "Property",
    "Financials",      // existing: rent roll, T12, assumptions, closing costs, scope of work
    "Underwriting",    // existing: UW fields, outputs
    "Financial Model", // embedded Google Sheet (chrome-free)
    "Contacts",
    "Conditions",
    "Documents",
    "Tasks",
    "Activity",
  ];

  return (
    <div className="mt-6 mb-6">
      <div className="inline-flex gap-0.5 rounded-[10px] p-[3px] bg-muted border">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`flex items-center gap-1.5 rounded-lg border-none px-3.5 py-[7px] text-[13px] cursor-pointer transition-all duration-150 ${
              tab === "Financial Model"
                ? "bg-background text-foreground font-medium shadow-sm"
                : "bg-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// MOCKUP: Financial Model Tab (REDESIGNED)
// Single card containing unified header + chrome-free sheet
// ─────────────────────────────────────────────────────────

function FinancialModelTab({ deal }) {
  const hasSheet = deal.google_sheet_id != null;

  if (!hasSheet) {
    return <FinancialModelEmptyState deal={deal} />;
  }

  // Embed URL strips ALL Google Sheets chrome:
  // - chrome=false  -> removes title bar
  // - widget=false  -> removes bottom tab selector
  // - rm=minimal    -> removes formatting toolbar
  // - #gid=X        -> controls which tab is visible (driven by our tab pills)
  const embedUrl = `https://docs.google.com/spreadsheets/d/${deal.google_sheet_id}/edit?rm=minimal&embedded=true&chrome=false&widget=false#gid=${activeGid}`;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* ── Unified Header ── */}
      {/* Top row: sheet tab pills (left) | sync status + expand + open-in-sheets (right) */}
      <div className="flex items-center gap-3 px-4 py-2.5">
        {/* Sheet tab pills - controls iframe #gid= parameter */}
        <div className="inline-flex gap-0.5 rounded-lg p-[2px] bg-muted">
          {sheetTabs.map((tab) => (
            <button
              key={tab.label}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium cursor-pointer transition-colors ${
                tab.label === activeSheetTab
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Sync indicator: green dot + "Synced Xm ago" + refresh spinner */}
        <div className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Synced 2m ago</span>
          <button className="ml-0.5 p-1 rounded-md hover:bg-muted transition-colors cursor-pointer">
            <svg className="h-3 w-3" /* RefreshCw icon */ />
          </button>
        </div>

        <div className="h-4 w-px bg-border/60" />

        {/* KPI collapse toggle */}
        <button className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-md px-1.5 py-1 hover:bg-muted">
          <svg className="h-3 w-3" /* BarChart3 icon */ />
          <svg className="h-3 w-3 transition-transform" /* ChevronDown, rotates -90 when collapsed */ />
        </button>

        <div className="h-4 w-px bg-border/60" />

        {/* Fullscreen expand */}
        <button className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer">
          <svg className="h-3.5 w-3.5" /* Maximize2 icon */ />
        </button>

        {/* Open in Google Sheets */}
        <a
          href={deal.google_sheet_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <svg className="h-3 w-3" /* ExternalLink icon */ />
          Open in Sheets
        </a>
      </div>

      {/* Collapsible KPI strip - animates open/closed */}
      <div className="grid grid-cols-6 divide-x divide-border/40 border-t border-border/50">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="px-4 py-2.5 text-center">
            <div className="text-[10px] text-muted-foreground mb-0.5">{kpi.label}</div>
            <div className="text-[14px] font-semibold num text-foreground">{kpi.value}</div>
            {kpi.sub && (
              <div className={`text-[9px] mt-0.5 ${kpi.positive ? "text-emerald-600" : "text-muted-foreground"}`}>
                {kpi.sub}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Sheet Container ── */}
      <div className="relative border-t border-border/50">
        {/* Dark mode gradient transition (subtle fade from dark header to white sheet) */}
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-b from-black/[0.06] to-transparent z-10 pointer-events-none dark:from-black/20" />

        {/* Loading skeleton (shown until iframe fires onLoad, then crossfades out) */}
        {/* <SheetSkeleton /> */}

        {/* Sheet iframe - always white bg for dark mode harmony */}
        <div
          className="bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
          style={{ height: "680px" /* resizable via drag handle, stored in localStorage */ }}
        >
          <iframe
            src={embedUrl}
            className="w-full h-full border-0 transition-opacity duration-500"
            allow="clipboard-read; clipboard-write"
            title="Financial Model"
          />
        </div>

        {/* Resize handle - drag to adjust height (400px-900px), persisted in localStorage */}
        <div className="h-3 cursor-row-resize flex items-center justify-center bg-card hover:bg-muted/60 transition-colors group border-t border-border/30">
          <svg className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" /* GripHorizontal icon */ />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// MOCKUP: Loading Skeleton
// Shown while iframe loads, mimics a spreadsheet grid
// Crossfades to real iframe via opacity transition
// ─────────────────────────────────────────────────────────

function SheetSkeleton() {
  return (
    <div className="absolute inset-0 bg-white z-20 overflow-hidden">
      {/* Column headers */}
      <div className="flex gap-px bg-zinc-100 border-b border-zinc-200">
        <div className="w-[220px] h-8 bg-zinc-100 shrink-0" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex-1 h-8 bg-zinc-100" />
        ))}
      </div>
      {/* Skeleton rows with staggered pulse animation */}
      {Array.from({ length: 25 }).map((_, row) => (
        <div key={row} className="flex gap-px border-b border-zinc-100">
          <div className="w-[220px] shrink-0 px-3 py-2">
            <div className="h-3 bg-zinc-100 rounded-sm animate-pulse" style={{ width: `${40 + Math.random() * 50}%` }} />
          </div>
          {Array.from({ length: 6 }).map((_, col) => (
            <div key={col} className="flex-1 px-3 py-2 flex justify-end">
              <div className="h-3 bg-zinc-50 rounded-sm animate-pulse" style={{ width: `${30 + Math.random() * 40}%`, animationDelay: `${(row * 6 + col) * 30}ms` }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// MOCKUP: Fullscreen Dialog
// Near-fullscreen (96vw x 94vh) dialog with same header + sheet
// ─────────────────────────────────────────────────────────

function FullscreenSheetDialog({ open, onClose, deal }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[96vw] w-[96vw] h-[94vh] p-0 flex flex-col overflow-hidden rounded-xl">
        <DialogTitle className="sr-only">Financial Model</DialogTitle>

        {/* Same unified header as inline view */}
        <div className="shrink-0">
          {/* ... UnifiedSheetHeader with isFullscreen=true, showing Minimize2 icon ... */}
        </div>

        {/* Full-height sheet */}
        <div className="flex-1 relative bg-white overflow-hidden">
          <iframe
            src={embedUrl}
            className="w-full h-full border-0"
            allow="clipboard-read; clipboard-write"
            title="Financial Model"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────
// MOCKUP: Empty State (unchanged from v1)
// ─────────────────────────────────────────────────────────

function FinancialModelEmptyState({ deal }) {
  return (
    <div className="rounded-xl border bg-card">
      <div className="flex flex-col items-center justify-center py-20 px-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 mb-5">
          <svg className="h-7 w-7 text-emerald-600" /* Google Sheets icon */ />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Create Financial Model
        </h3>
        <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
          Generate a Google Sheets financial model for this deal. The model will
          be pre-filled with all current deal data and live in the deal's Google
          Drive folder.
        </p>
        <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 mb-6">
          <svg className="h-4 w-4 text-muted-foreground" /* template icon */ />
          <span className="text-xs text-muted-foreground">
            Template: <span className="font-medium text-foreground">Commercial Debt Model v2.1</span>
          </span>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <svg className="h-4 w-4" /* plus icon */ />
          Create Financial Model
        </button>
        <p className="text-[11px] text-muted-foreground mt-3">
          Includes: Pro Forma, Rent Roll, Sensitivity Analysis, Returns & Exit
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// MOCKUP: Financials Tab (EXISTING - unchanged)
// ─────────────────────────────────────────────────────────

function FinancialsTab_Existing({ commercialUWData, deal }) {
  const subTabs = [
    { key: "rent_roll", label: "Rent Roll", icon: "Building2" },
    { key: "t12", label: "T12 / Historical", icon: "FileSpreadsheet" },
    { key: "assumptions", label: "Assumptions", icon: "Settings" },
    { key: "closing_costs", label: "Closing Costs", icon: "Receipt" },
    { key: "scope_of_work", label: "Scope of Work", icon: "Hammer" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Version History</span>
          <span className="ml-auto text-xs text-muted-foreground">v1 (active)</span>
        </div>
      </div>

      <div className="inline-flex gap-0.5 rounded-lg p-[2px] bg-muted border">
        {subTabs.map((tab) => (
          <button
            key={tab.key}
            className="rounded-md px-3 py-1.5 text-[12px] font-medium cursor-pointer"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <RentRollSubTab_MockReference />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// MOCKUP: Rent Roll Sub-tab (existing, unchanged)
// ─────────────────────────────────────────────────────────

function RentRollSubTab_MockReference() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-3">
        <MetricCard label="Total Units" value="24" />
        <MetricCard label="Occupancy" value="91.7%" />
        <MetricCard label="Avg Rent" value="$1,850" />
        <MetricCard label="Total Monthly" value="$44,400" />
      </div>

      <div className="flex items-center gap-2">
        <button className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12px] font-medium cursor-pointer hover:bg-muted transition-colors">
          Upload & Map
        </button>
        <button className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12px] font-medium cursor-pointer hover:bg-muted transition-colors">
          Add Unit
        </button>
        <button className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12px] font-medium cursor-pointer hover:bg-muted transition-colors">
          Export
        </button>
        <div className="flex-1" />
        <div className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600">
          Synced to Sheet
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Unit</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Tenant</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Beds</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Baths</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">SF</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">Current Rent</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">Market Rent</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/50">
              <td className="px-3 py-2">101</td>
              <td className="px-3 py-2">J. Smith</td>
              <td className="px-3 py-2">2</td>
              <td className="px-3 py-2">1</td>
              <td className="px-3 py-2 num">850</td>
              <td className="px-3 py-2">Occupied</td>
              <td className="px-3 py-2 text-right num">$1,800</td>
              <td className="px-3 py-2 text-right num">$1,950</td>
            </tr>
            <tr className="border-b border-border/50">
              <td className="px-3 py-2">102</td>
              <td className="px-3 py-2">M. Johnson</td>
              <td className="px-3 py-2">1</td>
              <td className="px-3 py-2">1</td>
              <td className="px-3 py-2 num">625</td>
              <td className="px-3 py-2">Occupied</td>
              <td className="px-3 py-2 text-right num">$1,450</td>
              <td className="px-3 py-2 text-right num">$1,550</td>
            </tr>
            <tr className="border-b border-border/50 bg-amber-50/50 dark:bg-amber-950/20">
              <td className="px-3 py-2">103</td>
              <td className="px-3 py-2 text-muted-foreground italic">Vacant</td>
              <td className="px-3 py-2">2</td>
              <td className="px-3 py-2">2</td>
              <td className="px-3 py-2 num">950</td>
              <td className="px-3 py-2">Vacant</td>
              <td className="px-3 py-2 text-right num text-muted-foreground">--</td>
              <td className="px-3 py-2 text-right num">$2,100</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Helper Components ───

function MetricCard({ label, value }) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold num">{value}</div>
    </div>
  );
}

/**
 * MOCKUP REFERENCE - Deal Detail Page with sidebar eliminated.
 *
 * Key design decisions:
 *   1. Sidebar removed entirely; content area is full-width
 *   2. "Advance to [Stage]" promoted to primary CTA button in the header
 *   3. Quick Actions consolidated into a DropdownMenu in the header
 *   4. Team avatars remain in header (already existed) with popover for management
 *   5. Est. Close date shown as a small badge in the header metadata row
 *   6. Key Dates (Created, Updated, Actual Close) moved to Overview tab or Actions dropdown
 *   7. Google Drive link moved into the Actions dropdown
 *   8. DealScoreCard (UW tab only) moves inline above UW content instead of sidebar
 */

// ─────────────────────────────────────────────────────────
// BEFORE: Old layout (for reference)
// ─────────────────────────────────────────────────────────

function OldLayout() {
  return (
    <div className="max-w-[1280px] mx-auto">
      {/* Header */}
      <DealHeader />

      {/* Stage Stepper */}
      <StageStepper />

      {/* Tab Bar */}
      <TabBar />

      {/* Content Area: main + sidebar = 320px stolen */}
      <div className="grid grid-cols-[1fr_320px] gap-6 items-start">
        <div className="flex flex-col gap-5 min-w-0">
          {/* Tab content gets ~73% of available width */}
        </div>

        {/* Sidebar: 320px fixed, always visible */}
        <div className="flex w-full flex-col gap-4 sticky top-5">
          {/* Quick Actions (6 buttons) */}
          {/* Google Drive link */}
          {/* Team (full member list + add/remove) */}
          {/* Key Dates (4 rows) */}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// AFTER: New layout - Full-width content, actions in header
// ─────────────────────────────────────────────────────────

function NewDealDetailPage() {
  // Props from server component (same as current)
  const deal = {}; // UnifiedDeal
  const cardType = {}; // UnifiedCardType
  const stageConfigs = []; // StageConfig[]
  const teamMembers = []; // Profile[] (all org members for assignment)
  const dealTeamMembers = []; // DealTeamMember[] (assigned to this deal)

  const [activeTab, setActiveTab] = useState("Overview");

  return (
    <div className="min-h-screen">
      {/* Breadcrumb (unchanged) */}
      <Breadcrumb className="mb-3 text-[13px]">
        {/* Pipeline > Bridge Debt > RQ-0042 */}
      </Breadcrumb>

      <div className="max-w-[1280px] mx-auto">
        {/* ── NEW HEADER ── */}
        <NewDealHeader
          deal={deal}
          cardType={cardType}
          teamMembers={teamMembers}
          dealTeamMembers={dealTeamMembers}
        />

        {/* Stage Stepper (unchanged) */}
        <div className="mt-6 rounded-xl border bg-card px-5 py-4">
          <StageStepper currentStage={deal.stage} interactive />
        </div>

        {/* Tab Bar (unchanged) */}
        <TabBar activeTab={activeTab} onChange={setActiveTab} />

        {/* ── FULL-WIDTH CONTENT (no sidebar grid) ── */}
        <div className="flex flex-col gap-5 min-w-0">
          {/* DealScoreCard renders inline when on UW tab */}
          {activeTab === "Underwriting" && (
            <DealScoreCard scenario="base" />
          )}

          {/* Tab content gets 100% of available width */}
          {/* Overview, Property, Underwriting, Documents, etc. */}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// NEW HEADER: Deal info + Team avatars + Actions + Advance CTA
// ─────────────────────────────────────────────────────────

function NewDealHeader({ deal, cardType, teamMembers, dealTeamMembers }) {
  const currentStage = STAGES.find((s) => s.key === deal.stage);
  const nextStage = STAGES[STAGES.findIndex((s) => s.key === deal.stage) + 1];
  const shortLabel = CARD_TYPE_SHORT_LABELS[cardType.slug] ?? cardType.label;
  const days = deal.days_in_stage ?? daysInStage(deal.stage_entered_at);

  const resolvedMembers = dealTeamMembers.map((dtm) => {
    const profile = teamMembers.find((t) => t.id === dtm.profile_id);
    return { ...dtm, full_name: profile?.full_name ?? "Unknown" };
  });

  return (
    <div className="flex items-start justify-between gap-5">
      {/* ── Left: Deal Identity ── */}
      <div className="flex gap-4 items-start">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Layers className="h-5 w-5 text-primary" />
        </div>
        <div>
          {/* Row 1: Name + badges */}
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="m-0 text-[22px] font-bold tracking-tight">
              {deal.name}
            </h1>
            <Badge variant="outline" className="text-[10px] uppercase">
              {shortLabel}
            </Badge>
            <Badge variant="outline" className="text-[10px] uppercase">
              {currentStage?.label ?? deal.stage}
            </Badge>
          </div>

          {/* Row 2: Metadata (deal#, asset class, amount, days in stage, est close) */}
          <div className="flex items-center gap-4 text-[13px] text-muted-foreground">
            {deal.deal_number && (
              <span className="num">{deal.deal_number}</span>
            )}
            {deal.asset_class && <span>{deal.asset_class}</span>}
            {deal.amount != null && (
              <span className="num font-medium text-foreground">
                {formatCurrency(deal.amount)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span className="num">{days}</span> days in stage
            </span>

            {/* NEW: Est. Close date inline in metadata row */}
            {deal.expected_close_date && (
              <>
                <span className="text-border">|</span>
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  Est. Close:{" "}
                  <span className="num text-foreground">
                    {new Date(deal.expected_close_date).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric" }
                    )}
                  </span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Right: Team Avatars + Actions Dropdown + Advance CTA ── */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Team Avatar Stack with Popover */}
        <TeamAvatarStack
          resolvedMembers={resolvedMembers}
          allMembers={teamMembers}
          dealId={deal.id}
        />

        {/* Actions Dropdown (replaces sidebar Quick Actions) */}
        <ActionsDropdown deal={deal} cardType={cardType} />

        {/* Primary CTA: Advance to Next Stage */}
        {nextStage && deal.stage !== "closed" && (
          <Button
            size="sm"
            className="gap-1.5 font-medium"
            onClick={() => advanceStageAction(deal.id, nextStage.key)}
          >
            Advance to {nextStage.label}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// TEAM AVATAR STACK with management popover
// ─────────────────────────────────────────────────────────

function TeamAvatarStack({ resolvedMembers, allMembers, dealId }) {
  // Click opens a Popover for full team management
  // (same add/remove functionality as the old sidebar Team section)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted border-0 bg-transparent cursor-pointer">
          {/* Avatar stack */}
          <div className="flex -space-x-1.5">
            {resolvedMembers.slice(0, 3).map((m) => (
              <div
                key={m.id}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-medium ring-2 ring-background"
                title={`${m.full_name} (${m.role})`}
              >
                {m.full_name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            ))}
            {resolvedMembers.length > 3 && (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground text-xs font-medium ring-2 ring-background">
                +{resolvedMembers.length - 3}
              </div>
            )}
            {resolvedMembers.length === 0 && (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-dashed border-border">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Chevron hint */}
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-72 p-0">
        <div className="px-4 py-3 border-b">
          <h4 className="text-sm font-medium">Deal Team</h4>
        </div>

        <div className="py-2 px-2 max-h-[240px] overflow-y-auto">
          {resolvedMembers.map((member) => (
            <div
              key={member.id}
              className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted"
            >
              {/* Avatar */}
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-[10px] font-medium">
                {member.full_name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              {/* Name + Role */}
              <div className="text-left min-w-0 flex-1">
                <div className="text-xs font-medium text-foreground truncate">
                  {member.full_name}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {member.role}
                </div>
              </div>
              {/* Remove */}
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10 bg-transparent border-0 cursor-pointer"
                onClick={() => removeDealTeamMember(deal.id, member.id)}
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}

          {resolvedMembers.length === 0 && (
            <p className="text-xs text-muted-foreground italic px-2 py-1.5">
              No team members assigned
            </p>
          )}
        </div>

        {/* Add member footer */}
        <div className="border-t px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Select>
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue placeholder="Select member..." />
              </SelectTrigger>
              <SelectContent>
                {allMembers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" className="h-8 px-3 text-xs">
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─────────────────────────────────────────────────────────
// ACTIONS DROPDOWN (replaces sidebar Quick Actions)
// ─────────────────────────────────────────────────────────

function ActionsDropdown({ deal, cardType }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <MoreHorizontal className="h-4 w-4" />
          Actions
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        {/* Communication */}
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Communication
        </DropdownMenuLabel>
        <DropdownMenuItem>
          <Phone className="h-4 w-4 mr-2" />
          Log Call
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Mail className="h-4 w-4 mr-2" />
          Send Email
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Documents & Approvals */}
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Documents & Approvals
        </DropdownMenuLabel>
        <DropdownMenuItem>
          <FileText className="h-4 w-4 mr-2" />
          Generate Document
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Shield className="h-4 w-4 mr-2" />
          Request Approval
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Scheduling */}
        <DropdownMenuItem>
          <Calendar className="h-4 w-4 mr-2" />
          Schedule Closing
        </DropdownMenuItem>

        {/* Google Drive (conditional) */}
        {deal.google_drive_folder_url && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a
                href={deal.google_drive_folder_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Google Drive Folder
                <ArrowUpRight className="h-3 w-3 ml-auto opacity-50" />
              </a>
            </DropdownMenuItem>
          </>
        )}

        {/* Key Dates (secondary info, tucked at bottom) */}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Key Dates
        </DropdownMenuLabel>
        <div className="px-2 py-1.5">
          <div className="flex justify-between text-xs py-0.5">
            <span className="text-muted-foreground">Created</span>
            <span className="num text-foreground">
              {new Date(deal.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex justify-between text-xs py-0.5">
            <span className="text-muted-foreground">Last Updated</span>
            <span className="num text-foreground">
              {new Date(deal.updated_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          {deal.expected_close_date && (
            <div className="flex justify-between text-xs py-0.5">
              <span className="text-muted-foreground">Est. Close</span>
              <span className="num text-foreground">
                {new Date(deal.expected_close_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
          {deal.actual_close_date && (
            <div className="flex justify-between text-xs py-0.5">
              <span className="text-muted-foreground">Actual Close</span>
              <span className="num text-foreground">
                {new Date(deal.actual_close_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─────────────────────────────────────────────────────────
// LAYOUT COMPARISON: Grid changes
// ─────────────────────────────────────────────────────────

/**
 * BEFORE (current):
 *
 *  ┌────────────────────────────────────────────────────────────┐
 *  │ [icon] Deal Name   [Bridge] [Analysis]                    │
 *  │        RQ-0042  MFH  $850,000  12 days       Team  [DM]  │
 *  ├────────────────────────────────────────────────────────────┤
 *  │ ● Lead ── ● Analysis ── ○ Processing ── ○ Closing ── ○   │
 *  ├────────────────────────────────────────────────────────────┤
 *  │ [Overview] [Property] [UW] [Docs] [Tasks] [Activity]     │
 *  ├──────────────────────────────────┬─────────────────────────┤
 *  │                                  │  Quick Actions          │
 *  │                                  │  > Advance to Analysis  │
 *  │   Tab Content                    │  > Log Call             │
 *  │   (gets ~73% width)             │  > Send Email           │
 *  │                                  │  > Generate Document    │
 *  │                                  │  > Request Approval     │
 *  │                                  │  > Schedule Closing     │
 *  │                                  │                         │
 *  │                                  │  Team                   │
 *  │                                  │  [DM] Dylan Marma       │
 *  │                                  │  + Add Member           │
 *  │                                  │                         │
 *  │                                  │  Key Dates              │
 *  │                                  │  Created    Mar 13      │
 *  │                                  │  Updated    Mar 13      │
 *  │                                  │  Est Close  Mar 26      │
 *  │                                  │  Act Close  ---         │
 *  └──────────────────────────────────┴─────────────────────────┘
 *
 *
 * AFTER (proposed):
 *
 *  ┌────────────────────────────────────────────────────────────┐
 *  │ [icon] Deal Name   [Bridge] [Analysis]                    │
 *  │        RQ-0042  MFH  $850,000  12d │ Est.Close: Mar 26   │
 *  │                                                           │
 *  │                         [DM][avatars▾] [Actions▾] [Advance to Analysis →] │
 *  ├────────────────────────────────────────────────────────────┤
 *  │ ● Lead ── ● Analysis ── ○ Processing ── ○ Closing ── ○   │
 *  ├────────────────────────────────────────────────────────────┤
 *  │ [Overview] [Property] [UW] [Docs] [Tasks] [Activity]     │
 *  ├────────────────────────────────────────────────────────────┤
 *  │                                                            │
 *  │                                                            │
 *  │              Tab Content (100% width)                      │
 *  │                                                            │
 *  │   Property info fields now have full breathing room.       │
 *  │   Two-column layouts are wider. Tables aren't cramped.     │
 *  │                                                            │
 *  │                                                            │
 *  └────────────────────────────────────────────────────────────┘
 *
 *
 * Actions dropdown (when clicked):
 *
 *  ┌──────────────────────┐
 *  │ COMMUNICATION        │
 *  │  📞 Log Call          │
 *  │  ✉️  Send Email       │
 *  ├──────────────────────┤
 *  │ DOCUMENTS & APPROVALS│
 *  │  📄 Generate Document │
 *  │  🛡️ Request Approval  │
 *  ├──────────────────────┤
 *  │  📅 Schedule Closing  │
 *  ├──────────────────────┤
 *  │  🔗 Google Drive ↗   │
 *  ├──────────────────────┤
 *  │ KEY DATES            │
 *  │  Created    Mar 13   │
 *  │  Updated    Mar 13   │
 *  │  Est Close  Mar 26   │
 *  └──────────────────────┘
 *
 *
 * Team popover (when avatar stack clicked):
 *
 *  ┌──────────────────────┐
 *  │ Deal Team            │
 *  ├──────────────────────┤
 *  │ [DM] Dylan Marma   ✕ │
 *  │       LEAD            │
 *  │ [LE] Luis E.       ✕ │
 *  │       ORIGINATOR      │
 *  ├──────────────────────┤
 *  │ [Select member ▾] [+]│
 *  └──────────────────────┘
 */

// ─────────────────────────────────────────────────────────
// SUMMARY OF CHANGES REQUIRED
// ─────────────────────────────────────────────────────────

/**
 * Files to modify:
 *
 * 1. DealDetailPage.tsx (primary file - all changes here)
 *    - Delete DealSidebar function (~600 lines including dialogs)
 *    - Delete SidebarSection helper
 *    - Delete QuickAction helper
 *    - Change grid from grid-cols-[1fr_320px] to single column
 *    - Expand DealHeader to include: Actions dropdown, Advance CTA, Est. Close badge
 *    - Move team management popover into DealHeader (reuse existing logic)
 *    - Move dialog state (log call, send email, schedule closing) into header scope
 *    - Move DealScoreCard inline above UW tab content
 *
 * 2. No other files need changes - all sidebar code is self-contained in DealDetailPage.tsx
 *
 * Net result:
 *    - ~300 lines removed (sidebar structure, SidebarSection, QuickAction)
 *    - ~150 lines added (ActionsDropdown, TeamAvatarPopover, header expansion)
 *    - ~150 lines net reduction in file size
 *    - Content area goes from ~73% to 100% width
 *    - Zero functionality lost, all actions remain accessible
 */

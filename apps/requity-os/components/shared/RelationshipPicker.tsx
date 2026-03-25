"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Loader2,
  User,
  Building2,
  UserPlus,
  Plus,
  X,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import { showSuccess, showError } from "@/lib/toast";
import { CRM_COMPANY_TYPES } from "@/lib/constants";
import {
  useRelationshipSearch,
  type EntityType,
} from "@/hooks/useRelationshipSearch";
import {
  quickCreateContact,
  quickCreateCompany,
  type ContactSearchResult,
  type CompanySearchResult,
} from "@/lib/actions/relationship-actions";

// ─── Types ───

export interface RelationshipPickerValue {
  id: string;
  label: string;
  subtitle?: string;
}

export interface RelationshipPickerProps {
  entityType: EntityType;
  /** Called when user selects an existing entity */
  onSelect: (entity: ContactSearchResult | CompanySearchResult) => void;
  /** Called after inline creation */
  onCreate?: (entity: ContactSearchResult | CompanySearchResult) => void;
  /** IDs to exclude from results */
  excludeIds?: string[];
  /** Search input placeholder */
  placeholder?: string;
  /** Currently linked entity */
  value?: RelationshipPickerValue | null;
  /** Allow clearing */
  clearable?: boolean;
  onClear?: () => void;
  /** Disable "+ Create" */
  disableCreate?: boolean;
  /** "inline" = hover-to-reveal trigger, "default" = button trigger */
  variant?: "inline" | "default";
  /** Popover width (CSS value) */
  popoverWidth?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Additional class on the trigger */
  className?: string;
}

// ─── Helpers ───

function contactName(c: ContactSearchResult): string {
  return [c.first_name, c.last_name].filter(Boolean).join(" ") || "Unknown";
}

function contactSubtitle(c: ContactSearchResult): string {
  const parts: string[] = [];
  if (c.email) parts.push(c.email);
  if (c.company_name) parts.push(c.company_name);
  return parts.join(" \u00b7 ");
}

// ─── Component ───

export function RelationshipPicker({
  entityType,
  onSelect,
  onCreate,
  excludeIds,
  placeholder,
  value,
  clearable = false,
  onClear,
  disableCreate = false,
  variant = "default",
  popoverWidth = "320px",
  disabled = false,
  className,
}: RelationshipPickerProps) {
  const [open, setOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Create form state - contact
  const [newFirst, setNewFirst] = useState("");
  const [newLast, setNewLast] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");

  // Create form state - company
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyType, setNewCompanyType] = useState("");

  const { query, setQuery, results, loading, searched, reset } =
    useRelationshipSearch({
      entityType,
      excludeIds,
    });

  const defaultPlaceholder =
    entityType === "contact" ? "Search contacts..." : "Search companies...";

  // Focus input when popover opens
  useEffect(() => {
    if (open && !showCreateForm) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open, showCreateForm]);

  // Reset highlight when results change
  useEffect(() => {
    setHighlightIndex(-1);
  }, [results]);

  const handleOpen = useCallback(() => {
    if (disabled) return;
    setOpen(true);
    setShowCreateForm(false);
  }, [disabled]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setShowCreateForm(false);
    reset();
    setHighlightIndex(-1);
    resetCreateForm();
  }, [reset]);

  const resetCreateForm = useCallback(() => {
    setNewFirst("");
    setNewLast("");
    setNewEmail("");
    setNewPhone("");
    setNewCompanyName("");
    setNewCompanyType("");
  }, []);

  const handleSelectContact = useCallback(
    (c: ContactSearchResult) => {
      onSelect(c);
      handleClose();
    },
    [onSelect, handleClose]
  );

  const handleSelectCompany = useCallback(
    (c: CompanySearchResult) => {
      onSelect(c);
      handleClose();
    },
    [onSelect, handleClose]
  );

  // Open create form, pre-filling from query
  const handleShowCreate = useCallback(() => {
    if (entityType === "contact") {
      const parts = query.trim().split(/\s+/);
      setNewFirst(parts[0] || "");
      setNewLast(parts.length > 1 ? parts.slice(1).join(" ") : "");
    } else {
      setNewCompanyName(query.trim());
    }
    setShowCreateForm(true);
  }, [entityType, query]);

  const handleCancelCreate = useCallback(() => {
    setShowCreateForm(false);
    resetCreateForm();
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [resetCreateForm]);

  const handleCreateContact = useCallback(async () => {
    if (!newFirst.trim()) {
      showError("First name is required");
      return;
    }
    setCreating(true);
    const res = await quickCreateContact({
      first_name: newFirst,
      last_name: newLast || undefined,
      email: newEmail || undefined,
      phone: newPhone || undefined,
    });
    setCreating(false);
    if (res.error || !res.contact) {
      showError("Could not create contact", res.error);
      return;
    }
    showSuccess("Contact created");
    onCreate?.(res.contact);
    onSelect(res.contact);
    handleClose();
  }, [newFirst, newLast, newEmail, newPhone, onCreate, onSelect, handleClose]);

  const handleCreateCompany = useCallback(async () => {
    if (!newCompanyName.trim()) {
      showError("Company name is required");
      return;
    }
    if (!newCompanyType) {
      showError("Company type is required");
      return;
    }
    setCreating(true);
    const res = await quickCreateCompany({
      name: newCompanyName,
      company_type: newCompanyType,
    });
    setCreating(false);
    if (res.error || !res.company) {
      showError("Could not create company", res.error);
      return;
    }
    showSuccess("Company created");
    onCreate?.(res.company);
    onSelect(res.company);
    handleClose();
  }, [newCompanyName, newCompanyType, onCreate, onSelect, handleClose]);

  // Keyboard navigation
  const showCreate = !disableCreate && query.trim().length >= 2;
  const totalItems = results.length + (showCreate ? 1 : 0);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
        return;
      }

      if (totalItems > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setHighlightIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setHighlightIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
          return;
        }
        if (e.key === "Enter" && highlightIndex >= 0) {
          e.preventDefault();
          if (highlightIndex < results.length) {
            if (entityType === "contact") {
              handleSelectContact(results[highlightIndex] as ContactSearchResult);
            } else {
              handleSelectCompany(results[highlightIndex] as CompanySearchResult);
            }
          } else if (showCreate) {
            handleShowCreate();
          }
          return;
        }
      }
    },
    [
      totalItems,
      highlightIndex,
      results,
      entityType,
      showCreate,
      handleClose,
      handleSelectContact,
      handleSelectCompany,
      handleShowCreate,
    ]
  );

  // ─── Trigger rendering ───

  const renderTrigger = () => {
    if (variant === "inline") {
      // Inline: hover-to-reveal style
      if (value) {
        return (
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              type="button"
              onClick={handleOpen}
              disabled={disabled}
              className={cn(
                "relative flex-1 text-left text-sm min-h-[32px] flex items-center rounded-md px-2 py-1",
                "border border-transparent rq-transition",
                !disabled && "hover:border-border hover:bg-muted/40 cursor-pointer",
                className
              )}
            >
              <Link2 className="h-3 w-3 mr-1.5 text-primary shrink-0" />
              <span className="truncate font-medium">{value.label}</span>
            </button>
            {clearable && onClear && (
              <button
                type="button"
                onClick={onClear}
                className="shrink-0 h-6 w-6 flex items-center justify-center rounded-sm text-muted-foreground rq-transition hover:bg-muted hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        );
      }
      return (
        <button
          type="button"
          onClick={handleOpen}
          disabled={disabled}
          className={cn(
            "relative w-full text-left text-sm min-h-[32px] flex items-center rounded-md px-2 py-1",
            "border border-transparent rq-transition",
            !disabled && "hover:border-border hover:bg-muted/40 cursor-pointer",
            className
          )}
        >
          <span className="text-muted-foreground/40 truncate">
            {placeholder || defaultPlaceholder}
          </span>
        </button>
      );
    }

    // Default: button trigger
    if (value) {
      return (
        <div className="flex items-center gap-1.5 min-w-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleOpen}
            disabled={disabled}
            className={cn("flex-1 justify-start text-left font-normal h-9 min-w-0", className)}
          >
            {entityType === "contact" ? (
              <User className="h-3.5 w-3.5 mr-2 shrink-0 text-muted-foreground" />
            ) : (
              <Building2 className="h-3.5 w-3.5 mr-2 shrink-0 text-muted-foreground" />
            )}
            <span className="truncate">{value.label}</span>
            {value.subtitle && (
              <span className="truncate text-muted-foreground ml-1">
                &middot; {value.subtitle}
              </span>
            )}
          </Button>
          {clearable && onClear && (
            <button
              type="button"
              onClick={onClear}
              className="shrink-0 h-7 w-7 flex items-center justify-center rounded-sm text-muted-foreground rq-transition hover:bg-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      );
    }

    return (
      <Button
        type="button"
        variant="outline"
        onClick={handleOpen}
        disabled={disabled}
        className={cn("w-full justify-start text-left font-normal h-9", className)}
      >
        <Search className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
        <span className="text-muted-foreground">
          {placeholder || defaultPlaceholder}
        </span>
      </Button>
    );
  };

  // ─── Result row renderers ───

  const renderContactRow = (c: ContactSearchResult, index: number) => {
    const name = contactName(c);
    const sub = contactSubtitle(c);
    return (
      <button
        key={c.id}
        type="button"
        className={cn(
          "relative flex w-full cursor-default select-none items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm outline-none rq-transition hover:bg-accent hover:text-accent-foreground",
          highlightIndex === index && "bg-accent text-accent-foreground"
        )}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => handleSelectContact(c)}
        onMouseEnter={() => setHighlightIndex(index)}
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
          <User className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="flex flex-col items-start overflow-hidden">
          <span className="truncate font-medium">{name}</span>
          {sub && (
            <span className="truncate text-xs text-muted-foreground">
              {sub}
            </span>
          )}
        </div>
      </button>
    );
  };

  const renderCompanyRow = (c: CompanySearchResult, index: number) => (
    <button
      key={c.id}
      type="button"
      className={cn(
        "relative flex w-full cursor-default select-none items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm outline-none rq-transition hover:bg-accent hover:text-accent-foreground",
        highlightIndex === index && "bg-accent text-accent-foreground"
      )}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => handleSelectCompany(c)}
      onMouseEnter={() => setHighlightIndex(index)}
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex flex-col items-start overflow-hidden">
        <span className="truncate font-medium">{c.name}</span>
        {c.company_type && (
          <span className="truncate text-xs text-muted-foreground">
            {CRM_COMPANY_TYPES.find((ct) => ct.value === c.company_type)?.label ?? c.company_type}
          </span>
        )}
      </div>
    </button>
  );

  // ─── Create form renderers ───

  const renderContactCreateForm = () => (
    <div className="p-3 space-y-2">
      <div className="text-xs font-medium text-muted-foreground">
        Create new contact
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input
          className="inline-field"
          placeholder="First name *"
          value={newFirst}
          onChange={(e) => setNewFirst(e.target.value)}
          autoFocus
        />
        <Input
          className="inline-field"
          placeholder="Last name"
          value={newLast}
          onChange={(e) => setNewLast(e.target.value)}
        />
        <Input
          className="inline-field"
          placeholder="Email"
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
        />
        <Input
          className="inline-field"
          placeholder="Phone"
          value={newPhone}
          onChange={(e) => setNewPhone(e.target.value)}
        />
      </div>
      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={handleCreateContact} disabled={creating}>
          {creating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <>
              <UserPlus className="h-3.5 w-3.5 mr-1" />
              Create & Link
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCancelCreate}
          disabled={creating}
        >
          Cancel
        </Button>
      </div>
    </div>
  );

  const renderCompanyCreateForm = () => (
    <div className="p-3 space-y-2">
      <div className="text-xs font-medium text-muted-foreground">
        Create new company
      </div>
      <div className="space-y-2">
        <Input
          className="inline-field"
          placeholder="Company name *"
          value={newCompanyName}
          onChange={(e) => setNewCompanyName(e.target.value)}
          autoFocus
        />
        <Select value={newCompanyType} onValueChange={setNewCompanyType}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Select type *" />
          </SelectTrigger>
          <SelectContent>
            {CRM_COMPANY_TYPES.map((ct) => (
              <SelectItem key={ct.value} value={ct.value}>
                {ct.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          onClick={handleCreateCompany}
          disabled={creating || !newCompanyName.trim() || !newCompanyType}
        >
          {creating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Create & Link
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCancelCreate}
          disabled={creating}
        >
          Cancel
        </Button>
      </div>
    </div>
  );

  // ─── Main render ───

  return (
    <Popover open={open} onOpenChange={(o) => !o && handleClose()}>
      {variant === "inline" ? (
        <PopoverAnchor asChild>{renderTrigger()}</PopoverAnchor>
      ) : (
        <PopoverTrigger asChild>{renderTrigger()}</PopoverTrigger>
      )}
      <PopoverContent
        className="p-0"
        style={{ width: popoverWidth }}
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {showCreateForm ? (
          entityType === "contact"
            ? renderContactCreateForm()
            : renderCompanyCreateForm()
        ) : (
          <>
            {/* Search input */}
            <div className="flex items-center gap-2 border-b px-3 py-2">
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                placeholder={placeholder || defaultPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                autoComplete="off"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {loading && (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Results */}
            <div className="max-h-[220px] overflow-y-auto p-1">
              {results.length > 0 &&
                results.map((entity, index) =>
                  entityType === "contact"
                    ? renderContactRow(entity as ContactSearchResult, index)
                    : renderCompanyRow(entity as CompanySearchResult, index)
                )}

              {/* Empty state */}
              {searched && results.length === 0 && !loading && (
                <EmptyState
                  icon={Search}
                  title={
                    entityType === "contact"
                      ? "No contacts found"
                      : "No companies found"
                  }
                  compact
                />
              )}

              {/* + Create option */}
              {showCreate && (
                <>
                  {results.length > 0 && <div className="border-t my-1" />}
                  <button
                    type="button"
                    className={cn(
                      "relative flex w-full cursor-default select-none items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm outline-none rq-transition hover:bg-accent hover:text-accent-foreground",
                      highlightIndex === results.length &&
                        "bg-accent text-accent-foreground"
                    )}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleShowCreate}
                    onMouseEnter={() => setHighlightIndex(results.length)}
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      {entityType === "contact" ? (
                        <UserPlus className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Plus className="h-3.5 w-3.5 text-primary" />
                      )}
                    </div>
                    <div className="flex flex-col items-start overflow-hidden">
                      <span className="truncate font-medium">
                        Create &quot;{query.trim()}&quot;
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {entityType === "contact"
                          ? "New CRM contact"
                          : "New company"}
                      </span>
                    </div>
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

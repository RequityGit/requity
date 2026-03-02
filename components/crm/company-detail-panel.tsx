"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { CRM_COMPANY_TYPES, CRM_COMPANY_SUBTYPES, COMPANY_TYPE_COLORS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { updateCompanyAction } from "@/app/(authenticated)/admin/crm/company-actions";
import { CompanyFileUpload } from "@/components/crm/company-file-upload";
import { CompanyFileList } from "@/components/crm/company-file-list";
import {
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  Shield,
  FileText,
  Users,
  Briefcase,
  ChevronRight,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface CompanyContact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  user_function: string | null;
}

interface CompanyFile {
  id: string;
  file_name: string;
  file_type: string;
  storage_path: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_at: string;
  notes: string | null;
}

interface CompanyDetailPanelProps {
  company: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    website: string | null;
    company_type: string;
    company_subtype: string | null;
    city: string | null;
    state: string | null;
    address_line1: string | null;
    nda_created_date: string | null;
    nda_expiration_date: string | null;
    fee_agreement_on_file: boolean | null;
    notes: string | null;
    contact_count: number;
    file_count: number;
    active_deals: number;
    lender_programs: string[] | null;
    asset_types: string[] | null;
    geographies: string[] | null;
    company_capabilities: string[] | null;
  } | null;
  open: boolean;
  onClose: () => void;
}

function hasValidNda(
  ndaCreatedDate: string | null,
  ndaExpirationDate: string | null
): boolean {
  if (!ndaCreatedDate) return false;
  if (!ndaExpirationDate) return true;
  return new Date(ndaExpirationDate) > new Date();
}

export function CompanyDetailPanel({
  company,
  open,
  onClose,
}: CompanyDetailPanelProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<CompanyContact[]>([]);
  const [files, setFiles] = useState<CompanyFile[]>([]);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);

  const fetchContacts = useCallback(async (companyId: string) => {
    setLoadingContacts(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("crm_contacts")
        .select("id, first_name, last_name, email, phone, user_function")
        .eq("company_id", companyId)
        .is("deleted_at", null)
        .order("first_name");
      setContacts(data ?? []);
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  const fetchFiles = useCallback(async (companyId: string) => {
    setLoadingFiles(true);
    try {
      const supabase = createClient();
      // company_files not yet in generated types
      const { data } = await (supabase as any)
        .from("company_files")
        .select("id, file_name, file_type, storage_path, file_size, mime_type, uploaded_at, notes")
        .eq("company_id", companyId)
        .order("uploaded_at", { ascending: false });
      setFiles((data ?? []) as CompanyFile[]);
    } finally {
      setLoadingFiles(false);
    }
  }, []);

  useEffect(() => {
    if (company && open) {
      setNotes(company.notes || "");
      fetchContacts(company.id);
      fetchFiles(company.id);
    }
  }, [company, open, fetchContacts, fetchFiles]);

  const handleSaveNotes = async () => {
    if (!company) return;
    setSavingNotes(true);
    try {
      const result = await updateCompanyAction({ id: company.id, notes });
      if ("error" in result && result.error) {
        toast({
          title: "Error saving notes",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({ title: "Notes saved" });
        router.refresh();
      }
    } finally {
      setSavingNotes(false);
    }
  };

  const handleFileUploaded = () => {
    if (company) {
      fetchFiles(company.id);
      router.refresh();
    }
  };

  const handleFileDeleted = () => {
    if (company) {
      fetchFiles(company.id);
      router.refresh();
    }
  };

  if (!company) return null;

  const typeLabel =
    CRM_COMPANY_TYPES.find((t) => t.value === company.company_type)?.label ??
    company.company_type;
  const subtypeLabel = company.company_subtype
    ? CRM_COMPANY_SUBTYPES.find((s) => s.value === company.company_subtype)
        ?.label ?? company.company_subtype
    : null;
  const typeColors =
    COMPANY_TYPE_COLORS[company.company_type] ??
    "bg-gray-100 text-gray-700 border-gray-200";
  const ndaOnFile = hasValidNda(
    company.nda_created_date,
    company.nda_expiration_date
  );

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[60%] overflow-y-auto p-0"
      >
        <div className="p-6">
          {/* Header */}
          <SheetHeader className="mb-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-light/10">
                <Building2 className="h-5 w-5 text-navy-text" />
              </div>
              <div className="flex-1">
                <SheetTitle className="text-xl font-display font-semibold text-[#1a2b4a]">
                  {company.name}
                </SheetTitle>
                <SheetDescription className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="outline"
                    className={cn("text-xs font-medium", typeColors)}
                  >
                    {typeLabel}
                  </Badge>
                  {subtypeLabel && (
                    <span className="text-xs text-muted-foreground">
                      {subtypeLabel}
                    </span>
                  )}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* Quick info row */}
          <div className="flex flex-wrap gap-4 mb-4 text-sm text-muted-foreground">
            {company.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                {company.phone}
              </div>
            )}
            {company.email && (
              <div className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                <span className="text-gold">{company.email}</span>
              </div>
            )}
            {company.website && (
              <div className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                {company.website}
              </div>
            )}
            {(company.city || company.state) && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {company.city && company.state
                  ? `${company.city}, ${company.state}`
                  : company.city || company.state}
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg border p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                <Users className="h-3.5 w-3.5" />
                <span className="text-xs">Contacts</span>
              </div>
              <p className="text-xl font-mono font-semibold text-[#1a2b4a]">
                {company.contact_count}
              </p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                <Briefcase className="h-3.5 w-3.5" />
                <span className="text-xs">Active Deals</span>
              </div>
              <p className="text-xl font-mono font-semibold text-[#1a2b4a]">
                {company.active_deals}
              </p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                <FileText className="h-3.5 w-3.5" />
                <span className="text-xs">Files</span>
              </div>
              <p className="text-xl font-mono font-semibold text-[#1a2b4a]">
                {files.length}
              </p>
            </div>
          </div>

          {/* Status chips */}
          <div className="flex gap-2 mb-6">
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border",
                ndaOnFile
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-red-50 text-red-700 border-red-200"
              )}
            >
              <Shield className="h-3 w-3" />
              NDA {ndaOnFile ? "On File" : "Missing"}
            </div>
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border",
                company.fee_agreement_on_file
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-red-50 text-red-700 border-red-200"
              )}
            >
              <FileText className="h-3 w-3" />
              Fee Agreement{" "}
              {company.fee_agreement_on_file ? "On File" : "Missing"}
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="contacts">
                Contacts ({contacts.length})
              </TabsTrigger>
              <TabsTrigger value="files">Files ({files.length})</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Type</p>
                    <p className="font-medium">{typeLabel}</p>
                  </div>
                  {subtypeLabel && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Subtype
                      </p>
                      <p className="font-medium">{subtypeLabel}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Location
                    </p>
                    <p className="font-medium">
                      {company.address_line1
                        ? `${company.address_line1}, `
                        : ""}
                      {company.city && company.state
                        ? `${company.city}, ${company.state}`
                        : company.city || company.state || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Website
                    </p>
                    <p className="font-medium">{company.website || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Phone</p>
                    <p className="font-medium">{company.phone || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Email</p>
                    <p className="font-medium">{company.email || "—"}</p>
                  </div>
                  {company.nda_created_date && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        NDA Created
                      </p>
                      <p className="font-medium">
                        {formatDate(company.nda_created_date)}
                      </p>
                    </div>
                  )}
                  {company.nda_expiration_date && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        NDA Expires
                      </p>
                      <p className="font-medium">
                        {formatDate(company.nda_expiration_date)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Lender-specific fields */}
                {company.company_type === "lender" && (
                  <>
                    {company.lender_programs &&
                      company.lender_programs.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                            Lender Programs
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {company.lender_programs.map((p) => (
                              <Badge
                                key={p}
                                variant="outline"
                                className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                              >
                                {p}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    {company.asset_types &&
                      company.asset_types.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                            Asset Types
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {company.asset_types.map((a) => (
                              <Badge
                                key={a}
                                variant="outline"
                                className="text-xs"
                              >
                                {a}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    {company.geographies &&
                      company.geographies.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                            Geographies
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {company.geographies.map((g) => (
                              <Badge
                                key={g}
                                variant="outline"
                                className="text-xs"
                              >
                                {g}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    {company.company_capabilities &&
                      company.company_capabilities.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                            Capabilities
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {company.company_capabilities.map((c) => (
                              <Badge
                                key={c}
                                variant="outline"
                                className="text-xs"
                              >
                                {c}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                  </>
                )}
              </div>
            </TabsContent>

            {/* Contacts Tab */}
            <TabsContent value="contacts" className="mt-4">
              {loadingContacts ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Loading contacts...
                </p>
              ) : contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No contacts linked to this company.
                </p>
              ) : (
                <div className="space-y-1">
                  {contacts.map((contact) => (
                    <Link
                      key={contact.id}
                      href={`/admin/crm/${contact.id}`}
                      className="flex items-center gap-3 rounded-lg border px-3 py-2.5 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-light/10 text-navy-text text-xs font-medium">
                        {contact.first_name?.[0]}
                        {contact.last_name?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1a2b4a] truncate">
                          {contact.first_name} {contact.last_name}
                        </p>
                        {contact.user_function && (
                          <p className="text-xs text-muted-foreground truncate">
                            {contact.user_function}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Files Tab */}
            <TabsContent value="files" className="mt-4">
              <div className="space-y-4">
                <CompanyFileUpload
                  companyId={company.id}
                  onUploaded={handleFileUploaded}
                />
                {loadingFiles ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Loading files...
                  </p>
                ) : (
                  <CompanyFileList
                    files={files}
                    onDeleted={handleFileDeleted}
                  />
                )}
              </div>
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="mt-4">
              <div className="space-y-3">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={6}
                  placeholder="Add notes about this company..."
                  className="resize-none"
                />
                <Button
                  size="sm"
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="gap-1.5"
                >
                  <Save className="h-3.5 w-3.5" />
                  {savingNotes ? "Saving..." : "Save Notes"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CompanyEditDialog } from "@/components/crm/company-edit-dialog";
import { CompanyFilesSection } from "@/components/crm/company-files-section";
import { CompanyNotesSection } from "@/components/crm/company-notes-section";
import { formatDate } from "@/lib/format";
import {
  CRM_COMPANY_TYPES,
  CRM_COMPANY_SUBTYPES,
  COMPANY_TYPE_COLORS,
} from "@/lib/constants";
import {
  Phone,
  Mail,
  Globe,
  MapPin,
  Shield,
  FileText,
  Users,
  ChevronRight,
  Tag,
  Calendar,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PageProps {
  params: { id: string };
}

export const dynamic = "force-dynamic";

function hasValidNda(
  ndaCreatedDate: string | null,
  ndaExpirationDate: string | null
): boolean {
  if (!ndaCreatedDate) return false;
  if (!ndaExpirationDate) return true;
  return new Date(ndaExpirationDate) > new Date();
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check if user is super admin
  const { data: superAdminRole } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", "super_admin")
    .eq("is_active", true)
    .maybeSingle();

  const isSuperAdmin = !!superAdminRole;

  const { id } = await params;
  const admin = createAdminClient();

  const { data: company } = await admin
    .from("companies")
    .select("*")
    .eq("id", id)
    .single();

  if (!company) notFound();

  // Fetch related data in parallel
  const [contactsResult, primaryContactResult, referralContactResult] =
    await Promise.all([
      admin
        .from("crm_contacts")
        .select(
          "id, first_name, last_name, email, phone, user_function, lifecycle_stage"
        )
        .eq("company_id", id)
        .is("deleted_at", null)
        .order("first_name"),
      company.primary_contact_id
        ? admin
            .from("crm_contacts")
            .select("id, first_name, last_name, email")
            .eq("id", company.primary_contact_id)
            .single()
        : Promise.resolve({ data: null }),
      company.referral_contact_id
        ? admin
            .from("crm_contacts")
            .select("id, first_name, last_name, email")
            .eq("id", company.referral_contact_id)
            .single()
        : Promise.resolve({ data: null }),
    ]);

  const contacts = contactsResult.data ?? [];
  const primaryContact = primaryContactResult.data;
  const referralContact = referralContactResult.data;

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
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={company.name}
        description={
          <div className="flex items-center gap-2 mt-1">
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
            {!company.is_active && (
              <Badge
                variant="outline"
                className="text-xs font-semibold bg-red-100 text-red-800 border-red-200"
              >
                Inactive
              </Badge>
            )}
          </div>
        }
        action={
          <CompanyEditDialog company={company} isSuperAdmin={isSuperAdmin} />
        }
      />

      {/* Company Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">
                  {company.phone || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">
                  {company.email || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Website</p>
                <p className="text-sm font-medium">
                  {company.website || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Source</p>
                <p className="text-sm font-medium">
                  {company.source || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Address */}
          {company.address_line1 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="text-sm">
                    {company.address_line1}
                    {company.city && `, ${company.city}`}
                    {company.state && `, ${company.state}`}{" "}
                    {company.zip && company.zip}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* NDA & Fee Agreement Status */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex flex-wrap gap-3">
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
                {company.nda_expiration_date && ndaOnFile && (
                  <span className="ml-1 opacity-75">
                    (expires {formatDate(company.nda_expiration_date)})
                  </span>
                )}
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
          </div>

          {/* Primary / Referral Contact */}
          {(primaryContact || referralContact) && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
              {primaryContact && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Primary Contact
                  </p>
                  <Link
                    href={`/admin/crm/${primaryContact.id}`}
                    className="text-sm text-blue-600 hover:underline font-medium"
                  >
                    {primaryContact.first_name} {primaryContact.last_name}
                  </Link>
                </div>
              )}
              {referralContact && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Referral Contact
                  </p>
                  <Link
                    href={`/admin/crm/${referralContact.id}`}
                    className="text-sm text-blue-600 hover:underline font-medium"
                  >
                    {referralContact.first_name} {referralContact.last_name}
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Other Names */}
          {company.other_names && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-1">
                Other Names / DBA
              </p>
              <p className="text-sm">{company.other_names}</p>
            </div>
          )}

          {/* Dates */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Added</p>
                  <p className="text-sm font-medium">
                    {formatDate(company.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Last Updated</p>
                  <p className="text-sm font-medium">
                    {formatDate(company.updated_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lender Details (conditional) */}
      {company.company_type === "lender" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Lender Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {company.lender_programs &&
                company.lender_programs.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                      Lender Programs
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {company.lender_programs.map((p: string) => (
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
              {company.asset_types && company.asset_types.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                    Asset Types
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {company.asset_types.map((a: string) => (
                      <Badge key={a} variant="outline" className="text-xs">
                        {a}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {company.geographies && company.geographies.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                    Geographies
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {company.geographies.map((g: string) => (
                      <Badge key={g} variant="outline" className="text-xs">
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
                      {company.company_capabilities.map((c: string) => (
                        <Badge key={c} variant="outline" className="text-xs">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              {(!company.lender_programs || company.lender_programs.length === 0) &&
                (!company.asset_types || company.asset_types.length === 0) &&
                (!company.geographies || company.geographies.length === 0) &&
                (!company.company_capabilities ||
                  company.company_capabilities.length === 0) && (
                  <p className="text-sm text-muted-foreground">
                    No lender details configured yet. Use the Edit button to add
                    programs, asset types, geographies, and capabilities.
                  </p>
                )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Related Contacts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Contacts ({contacts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No contacts linked to this company.
            </p>
          ) : (
            <div className="space-y-1">
              {contacts.map(
                (contact: {
                  id: string;
                  first_name: string | null;
                  last_name: string | null;
                  email: string | null;
                  phone: string | null;
                  user_function: string | null;
                }) => (
                  <Link
                    key={contact.id}
                    href={`/admin/crm/${contact.id}`}
                    className="flex items-center gap-3 rounded-lg border px-3 py-2.5 hover:bg-muted transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-foreground text-xs font-medium">
                      {contact.first_name?.[0]}
                      {contact.last_name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {contact.first_name} {contact.last_name}
                      </p>
                      {contact.user_function && (
                        <p className="text-xs text-muted-foreground truncate">
                          {contact.user_function}
                        </p>
                      )}
                    </div>
                    {contact.email && (
                      <span className="text-xs text-muted-foreground hidden md:block truncate max-w-[200px]">
                        {contact.email}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </Link>
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Files */}
      <CompanyFilesSection companyId={company.id} />

      {/* Notes */}
      <CompanyNotesSection
        companyId={company.id}
        initialNotes={company.notes || ""}
      />
    </div>
  );
}

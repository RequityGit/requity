import { PageHeader } from "@/components/shared/page-header";
import { getEffectiveAuth, getInvestorId } from "@/lib/impersonation";
import { formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DocumentDownload } from "@/components/investor/document-download";
import {
  FileText,
  FileSpreadsheet,
  FileBarChart,
  BanknoteIcon,
  File,
} from "lucide-react";
import { DocumentFilters } from "./filters";

// Document type groupings for display
const DOCUMENT_GROUPS: Record<
  string,
  { label: string; icon: React.ReactNode; types: string[] }
> = {
  tax: {
    label: "K-1s & Tax Documents",
    icon: <FileSpreadsheet className="h-5 w-5 text-purple-600" />,
    types: ["k1", "k-1", "tax_return", "tax_document", "tax"],
  },
  statements: {
    label: "Statements",
    icon: <FileText className="h-5 w-5 text-blue-600" />,
    types: [
      "statement",
      "account_statement",
      "quarterly_statement",
      "bank_statement",
    ],
  },
  reports: {
    label: "Reports",
    icon: <FileBarChart className="h-5 w-5 text-green-600" />,
    types: [
      "report",
      "quarterly_report",
      "annual_report",
      "fund_report",
      "performance_report",
    ],
  },
  capital_call_notices: {
    label: "Contribution Notices",
    icon: <BanknoteIcon className="h-5 w-5 text-amber-600" />,
    types: ["capital_call_notice", "capital_call", "call_notice"],
  },
  other: {
    label: "Other Documents",
    icon: <File className="h-5 w-5 text-slate-600" />,
    types: [],
  },
};

function getDocumentGroup(docType: string): string {
  const normalized = docType.toLowerCase();
  for (const [groupKey, group] of Object.entries(DOCUMENT_GROUPS)) {
    if (groupKey === "other") continue;
    if (group.types.some((t) => normalized.includes(t))) {
      return groupKey;
    }
  }
  return "other";
}

type DocumentRow = {
  id: string;
  fund_name: string | null;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  description: string | null;
  created_at: string;
  status: string;
  group: string;
};

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: { fund?: string; year?: string; type?: string };
}) {
  const { supabase, userId } = await getEffectiveAuth();

  // Build query
  let query = supabase
    .from("documents")
    .select("*, funds(name)")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  if (searchParams.fund) {
    query = query.eq("fund_id", searchParams.fund);
  }

  if (searchParams.type) {
    query = query.eq("document_type", searchParams.type);
  }

  const { data: rawDocuments } = await query;

  type DocumentJoined = {
    id: string;
    fund_id: string | null;
    document_type: string;
    file_name: string;
    file_path: string;
    file_size: number | null;
    description: string | null;
    created_at: string;
    status: string;
    funds: { name: string } | null;
  };

  const documents = (rawDocuments as unknown as DocumentJoined[]) ?? [];

  // Resolve auth user to investors.id
  const investorId = await getInvestorId(supabase, userId);

  // Get funds for filter
  const { data: commitments } = investorId
    ? await supabase
        .from("investor_commitments")
        .select("fund_id, funds(id, name)")
        .eq("investor_id", investorId)
    : { data: null };

  const funds = (commitments ?? [])
    .map((c) => {
      const fund = (c as any).funds as { id: string; name: string } | null;
      return fund ? { id: fund.id, name: fund.name } : null;
    })
    .filter(Boolean) as { id: string; name: string }[];

  const uniqueFunds = Array.from(
    new Map(funds.map((f) => [f.id, f])).values()
  );

  // Get available document types
  const docTypes = Array.from(
    new Set(documents.map((d) => d.document_type))
  ).sort();

  // Get available years
  const years = Array.from(
    new Set(
      documents.map((d) =>
        new Date(d.created_at).getFullYear().toString()
      )
    )
  ).sort((a, b) => Number(b) - Number(a));

  // Transform and filter by year if specified
  let rows: DocumentRow[] = documents.map((doc) => ({
    id: doc.id,
    fund_name: doc.funds?.name ?? null,
    document_type: doc.document_type,
    file_name: doc.file_name,
    file_path: doc.file_path,
    file_size: doc.file_size,
    description: doc.description,
    created_at: doc.created_at,
    status: doc.status,
    group: getDocumentGroup(doc.document_type),
  }));

  if (searchParams.year) {
    rows = rows.filter(
      (r) =>
        new Date(r.created_at).getFullYear().toString() === searchParams.year
    );
  }

  // Group documents
  const groupedDocs: Record<string, DocumentRow[]> = {};
  rows.forEach((doc) => {
    if (!groupedDocs[doc.group]) {
      groupedDocs[doc.group] = [];
    }
    groupedDocs[doc.group].push(doc);
  });

  // Order groups: tax, statements, reports, capital_call_notices, other
  const groupOrder = [
    "tax",
    "statements",
    "reports",
    "capital_call_notices",
    "other",
  ];

  function formatFileSize(bytes: number | null): string {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Access your investment documents, tax forms, statements, and reports."
      />

      {/* Summary */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          {rows.length} document{rows.length !== 1 ? "s" : ""}
        </span>
        {Object.entries(groupedDocs).map(([groupKey, docs]) => (
          <Badge
            key={groupKey}
            variant="outline"
            className="bg-muted font-normal"
          >
            {DOCUMENT_GROUPS[groupKey]?.label ?? groupKey}: {docs.length}
          </Badge>
        ))}
      </div>

      {/* Filters */}
      <DocumentFilters
        funds={uniqueFunds}
        years={years}
        documentTypes={docTypes}
        currentFund={searchParams.fund}
        currentYear={searchParams.year}
        currentType={searchParams.type}
      />

      {/* Grouped Document Lists */}
      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p className="text-lg font-medium text-foreground">
              No documents found
            </p>
            <p className="text-sm mt-1">
              Adjust your filters or check back later for new documents.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupOrder.map((groupKey) => {
            const docs = groupedDocs[groupKey];
            if (!docs || docs.length === 0) return null;
            const group = DOCUMENT_GROUPS[groupKey];

            return (
              <Card key={groupKey}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    {group.icon}
                    <CardTitle className="text-base font-semibold text-foreground">
                      {group.label}
                    </CardTitle>
                    <Badge variant="outline" className="ml-auto font-normal">
                      {docs.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="divide-y">
                    {docs.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                      >
                        <div className="flex-1 min-w-0 mr-4">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground truncate">
                              {doc.file_name}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            {doc.fund_name && (
                              <span className="text-xs text-muted-foreground">
                                {doc.fund_name}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatDate(doc.created_at)}
                            </span>
                            {doc.file_size && (
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(doc.file_size)}
                              </span>
                            )}
                            {doc.description && (
                              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {doc.description}
                              </span>
                            )}
                          </div>
                        </div>
                        <DocumentDownload
                          filePath={doc.file_path}
                          fileName={doc.file_name}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

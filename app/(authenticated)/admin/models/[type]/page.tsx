import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Building2, Home, TrendingUp, FlaskConical } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { requireAdmin } from "@/lib/auth/require-admin";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const VALID_TYPES = ["commercial", "rtl", "dscr"] as const;
type ModelType = (typeof VALID_TYPES)[number];

const MODEL_META: Record<
  ModelType,
  {
    label: string;
    icon: typeof Building2;
    description: string;
    sandboxAvailable: boolean;
    inputFields: { name: string; description: string }[];
    outputMetrics: { name: string; description: string }[];
  }
> = {
  commercial: {
    label: "Commercial Underwriting",
    icon: Building2,
    description:
      "A multi-table relational model for commercial real estate loans. Includes rent roll analysis, T12 historical financials, operating expense breakdowns, pro forma year projections, and debt service coverage calculations. Data is stored across multiple database tables rather than a single JSONB blob.",
    sandboxAvailable: false,
    inputFields: [
      { name: "Rent Roll", description: "Unit-level rent schedule with market rents and vacancy" },
      { name: "T12 Historicals", description: "Trailing 12-month income and expense actuals" },
      { name: "Operating Expenses", description: "Line-item expense breakdown (taxes, insurance, management, etc.)" },
      { name: "Financing Terms", description: "Loan amount, rate, term, amortization, IO period" },
      { name: "Acquisition Details", description: "Purchase price, closing costs, capital reserves" },
    ],
    outputMetrics: [
      { name: "NOI", description: "Net Operating Income — EGI minus total operating expenses" },
      { name: "DSCR", description: "Debt Service Coverage Ratio — NOI / annual debt service" },
      { name: "Cap Rate", description: "Capitalization Rate — NOI / purchase price" },
      { name: "EGI", description: "Effective Gross Income — gross rent minus vacancy and concessions" },
      { name: "Cash-on-Cash Return", description: "Annual pre-tax cash flow / total equity invested" },
    ],
  },
  rtl: {
    label: "Fix & Flip / RTL",
    icon: Home,
    description:
      "A single-formula calculator for residential transitional loans (fix & flip). Takes property acquisition cost, rehab budget, after-repair value, and loan terms as inputs. Computes key ratios (LTV, LTARV, LTC), holding costs, closing costs, and full P&L with borrower ROI projections.",
    sandboxAvailable: true,
    inputFields: [
      { name: "Loan Amount", description: "Total loan principal" },
      { name: "Purchase Price", description: "Property acquisition cost" },
      { name: "Appraised Value", description: "Current as-is appraisal value" },
      { name: "After Repair Value (ARV)", description: "Estimated post-renovation value" },
      { name: "Rehab Budget", description: "Total renovation cost" },
      { name: "Interest Rate", description: "Annual interest rate (IO)" },
      { name: "Points", description: "Origination fee as percentage of loan" },
      { name: "Loan Term", description: "Loan duration in months" },
      { name: "Holding Period", description: "Expected months to complete project" },
      { name: "Projected Sale Price", description: "Expected exit sale price (defaults to ARV)" },
      { name: "Sales Disposition %", description: "Closing costs as percent of sale (agent fees, etc.)" },
      { name: "Lender Fees (Flat)", description: "Fixed lender fees (processing, doc prep, etc.)" },
      { name: "Title / Closing / Escrow", description: "Third-party closing costs" },
    ],
    outputMetrics: [
      { name: "LTV", description: "Loan-to-Value — loan / appraised value" },
      { name: "LTARV", description: "Loan-to-ARV — loan / after repair value" },
      { name: "LTC", description: "Loan-to-Cost — loan / total project cost" },
      { name: "Total Cash to Close", description: "Borrower equity needed at closing" },
      { name: "Monthly Holding Costs", description: "Interest + taxes + insurance + HOA per month" },
      { name: "Net Profit", description: "Net sale proceeds minus total cost basis" },
      { name: "Borrower ROI", description: "Net profit / total cash invested" },
      { name: "Annualized ROI", description: "ROI scaled to 12-month basis" },
      { name: "Max Loan (LTV)", description: "75% of appraised value" },
      { name: "Max Loan (LTARV)", description: "70% of after repair value" },
    ],
  },
  dscr: {
    label: "DSCR Calculator",
    icon: TrendingUp,
    description:
      "A calculator for debt service coverage ratio on rental investment properties. Takes property income and expense data along with loan terms to compute DSCR, net yield, and investor return metrics.",
    sandboxAvailable: true,
    inputFields: [
      { name: "Loan Amount", description: "Total loan principal" },
      { name: "Purchase Price", description: "Property acquisition cost" },
      { name: "Appraised Value", description: "Current appraisal value" },
      { name: "Interest Rate", description: "Annual interest rate" },
      { name: "Points", description: "Origination fee percentage" },
      { name: "Loan Term", description: "Loan duration in months" },
      { name: "Monthly Rent", description: "Gross monthly rental income" },
      { name: "Annual Property Tax", description: "Annual property tax assessment" },
      { name: "Annual Insurance", description: "Annual hazard insurance premium" },
      { name: "Monthly HOA", description: "Homeowners association dues" },
      { name: "Monthly Utilities", description: "Landlord-paid utilities" },
      { name: "Operating Expenses", description: "Other monthly operating expenses" },
    ],
    outputMetrics: [
      { name: "DSCR", description: "Debt Service Coverage — NOI / monthly payment" },
      { name: "LTV", description: "Loan-to-Value ratio" },
      { name: "Monthly Payment", description: "Interest-only monthly payment" },
      { name: "Net Yield", description: "Annual interest income / loan amount" },
      { name: "Investor Return", description: "(Interest + origination) / loan amount, annualized" },
      { name: "Total Cash to Close", description: "Equity required at closing" },
      { name: "Max Loan (LTV)", description: "75% of appraised value" },
      { name: "Max Loan (LTARV)", description: "70% of after repair value" },
    ],
  },
};

export default async function ModelTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { user } = await requireAdmin();
  if (!user) redirect("/login");

  const { type } = await params;
  if (!VALID_TYPES.includes(type as ModelType)) notFound();

  const meta = MODEL_META[type as ModelType];
  const Icon = meta.icon;

  return (
    <div className="p-6 max-w-4xl">
      <PageHeader
        title={meta.label}
        description={meta.description}
        action={
          meta.sandboxAvailable ? (
            <Button asChild>
              <Link href={`/admin/models/${type}/sandbox`}>
                <FlaskConical size={14} className="mr-1.5" strokeWidth={1.5} />
                Open Sandbox
              </Link>
            </Button>
          ) : (
            <Button disabled>
              <FlaskConical size={14} className="mr-1.5" strokeWidth={1.5} />
              Sandbox Coming Soon
            </Button>
          )
        }
      />

      {/* Input Schema */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-foreground mb-3">Input Fields</h2>
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Field</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Description</th>
              </tr>
            </thead>
            <tbody>
              {meta.inputFields.map((f) => (
                <tr key={f.name} className="border-t border-border">
                  <td className="px-4 py-2 font-medium text-foreground">{f.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">{f.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Output Schema */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Output Metrics</h2>
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Metric</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Description</th>
              </tr>
            </thead>
            <tbody>
              {meta.outputMetrics.map((m) => (
                <tr key={m.name} className="border-t border-border">
                  <td className="px-4 py-2 font-medium text-foreground">{m.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">{m.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

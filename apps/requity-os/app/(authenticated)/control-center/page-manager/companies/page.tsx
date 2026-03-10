import { fetchPageLayout, fetchAvailableFields } from "../actions";
import { CompanyPageManagerView } from "./CompanyPageManagerView";

export const dynamic = "force-dynamic";

const COMPANY_FIELD_MODULES = [
  "company_info",
];

export default async function CompanyPageManagerPage() {
  const [layoutResult, fieldsResult] = await Promise.all([
    fetchPageLayout("company_detail"),
    fetchAvailableFields(COMPANY_FIELD_MODULES),
  ]);

  if (layoutResult.error || fieldsResult.error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-destructive">
          Failed to load layout: {layoutResult.error || fieldsResult.error}
        </p>
      </div>
    );
  }

  return (
    <CompanyPageManagerView
      initialSections={layoutResult.sections ?? []}
      initialFields={layoutResult.fields ?? []}
      availableFieldConfigs={fieldsResult.data ?? []}
    />
  );
}

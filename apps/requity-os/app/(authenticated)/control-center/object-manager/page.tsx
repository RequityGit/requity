import {
  fetchObjectDefinitions,
  fetchFieldCounts,
  fetchRelationshipCounts,
} from "./actions";
import { ObjectManagerView } from "./ObjectManagerView";

export const dynamic = "force-dynamic";

export default async function ObjectManagerPage() {
  const [objResult, fieldCountResult, relCountResult] = await Promise.all([
    fetchObjectDefinitions(),
    fetchFieldCounts(),
    fetchRelationshipCounts(),
  ]);

  if (objResult.error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-destructive">
          Failed to load objects: {objResult.error}
        </p>
      </div>
    );
  }

  return (
    <ObjectManagerView
      objects={objResult.data ?? []}
      fieldCounts={fieldCountResult.data ?? {}}
      relationshipCounts={relCountResult.data ?? {}}
    />
  );
}

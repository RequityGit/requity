import { getStagesWithRules } from "./actions";
import { PipelineStageConfig } from "./_components/pipeline-stage-config";

export default async function PipelineStageConfigPage() {
  const { data: stages, error } = await getStagesWithRules();

  return (
    <PipelineStageConfig
      initialStages={stages ?? []}
      loadError={error}
    />
  );
}

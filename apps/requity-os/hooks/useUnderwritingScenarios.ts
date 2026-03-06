"use client";

import { useCallback } from "react";
import type { UnderwritingModelType } from "@/lib/underwriting/resolver";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface UseUnderwritingScenariosParams {
  modelType: UnderwritingModelType;
  opportunityId?: string | null;
  loanId?: string | null;
  equityDealId?: string | null;
}

export interface ScenarioRow {
  id: string;
  name: string;
  model_type: string;
  status: string;
  active_version_id: string | null;
  opportunity_id: string | null;
  loan_id: string | null;
  equity_deal_id: string | null;
  created_at: string;
  created_by: string;
}

export function useUnderwritingScenarios({
  modelType,
  opportunityId,
  loanId,
  equityDealId,
}: UseUnderwritingScenariosParams) {
  const fetchScenarios = useCallback(async () => {
    let query = supabase
      .from("model_scenarios")
      .select("*")
      .eq("model_type", modelType)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (opportunityId) query = query.eq("opportunity_id", opportunityId);
    if (loanId) query = query.eq("loan_id", loanId);
    if (equityDealId) query = query.eq("equity_deal_id", equityDealId);

    const { data, error } = await query;
    if (error) throw error;
    return data as ScenarioRow[];
  }, [modelType, opportunityId, loanId, equityDealId]);

  const createScenario = useCallback(
    async (name: string, userId: string) => {
      // 1. Create model_scenario
      const { data: scenario, error: scenarioError } = await supabase
        .from("model_scenarios")
        .insert({
          name,
          model_type: modelType,
          created_by: userId,
          opportunity_id: opportunityId ?? null,
          loan_id: loanId ?? null,
          equity_deal_id: equityDealId ?? null,
          status: "active",
        })
        .select()
        .single();

      if (scenarioError) throw scenarioError;

      // 2. Create initial version in the model-specific table
      let versionId: string;

      if (modelType === "rtl") {
        const { data, error } = await supabase
          .from("loan_underwriting_versions")
          .insert({
            scenario_id: scenario.id,
            model_type: "rtl",
            opportunity_id: opportunityId ?? null,
            loan_id: loanId ?? null,
            version_number: 1,
            is_active: true,
            status: "draft",
            created_by: userId,
            label: "Initial",
            calculator_inputs: {},
            calculator_outputs: {},
          })
          .select()
          .single();
        if (error) throw error;
        versionId = data.id;
      } else if (modelType === "commercial") {
        const { data, error } = await supabase
          .from("commercial_underwriting")
          .insert({
            scenario_id: scenario.id,
            opportunity_id: opportunityId ?? null,
            loan_id: loanId ?? null,
            equity_deal_id: equityDealId ?? null,
            version_number: 1,
            is_active: true,
            status: "draft",
            created_by: userId,
            label: "Initial",
            property_type: "mhp",
          })
          .select()
          .single();
        if (error) throw error;
        versionId = data.id;
      } else if (modelType === "dscr") {
        const { data, error } = await supabase
          .from("dscr_underwriting")
          .insert({
            scenario_id: scenario.id,
            opportunity_id: opportunityId ?? null,
            loan_id: loanId ?? null,
            version_number: 1,
            is_active: true,
            status: "draft",
            created_by: userId,
          })
          .select()
          .single();
        if (error) throw error;
        versionId = data.id;
      } else if (modelType === "guc") {
        const { data, error } = await supabase
          .from("guc_underwriting")
          .insert({
            scenario_id: scenario.id,
            opportunity_id: opportunityId ?? null,
            loan_id: loanId ?? null,
            version_number: 1,
            is_active: true,
            status: "draft",
            created_by: userId,
          })
          .select()
          .single();
        if (error) throw error;
        versionId = data.id;
      } else if (modelType === "equity") {
        const { data, error } = await supabase
          .from("equity_underwriting")
          .insert({
            scenario_id: scenario.id,
            deal_id: equityDealId!,
            version_number: 1,
            is_active: true,
            status: "draft",
            created_by: userId,
          })
          .select()
          .single();
        if (error) throw error;
        versionId = data.id;
      } else {
        throw new Error(`Unknown model type: ${modelType}`);
      }

      // 3. Set active_version_id on scenario
      await supabase
        .from("model_scenarios")
        .update({ active_version_id: versionId })
        .eq("id", scenario.id);

      return scenario;
    },
    [modelType, opportunityId, loanId, equityDealId]
  );

  return { fetchScenarios, createScenario };
}

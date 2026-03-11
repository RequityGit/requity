"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { getVisibleSteps } from "@/lib/form-engine/evaluator";
import { createSubmission, immediateSave, debouncedSave } from "@/lib/form-engine/autosave";
import { lookupContactByEmail } from "@/lib/form-engine/email-lookup";
import { submitForm } from "@/lib/form-engine/submission-handler";
import { StepRenderer } from "./StepRenderer";
import { FormProgress } from "./FormProgress";
import { FormSummary } from "./FormSummary";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2, Send } from "lucide-react";
import type {
  FormDefinition,
  FormEngineProps,
  FormState,
  FormStep,
  SubmissionType,
} from "@/lib/form-engine/types";
import { toast } from "sonner";

export function FormEngine({
  formId,
  formSlug,
  context,
  mode: initialMode = "create",
  recordId,
  recordType,
  prefillData,
  sessionToken,
  onComplete,
  onClose,
}: FormEngineProps) {
  const [formDef, setFormDef] = useState<FormDefinition | null>(null);
  const [state, setState] = useState<FormState>({
    data: prefillData || {},
    currentStepIndex: 0,
    submissionId: null,
    sessionToken: sessionToken || null,
    isSubmitting: false,
    isLoading: true,
    error: null,
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mode = recordId ? "edit" : initialMode;
  const visibilityContext = context === "page" ? "external" : "internal";

  // Load form definition
  useEffect(() => {
    async function loadForm() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase: any = createClient();
      let query = supabase.from("form_definitions").select("*");

      if (formId) {
        query = query.eq("id", formId);
      } else if (formSlug) {
        query = query.eq("slug", formSlug);
      } else {
        setState((s) => ({ ...s, isLoading: false, error: "No form ID or slug provided" }));
        return;
      }

      const { data, error } = await query.single();

      if (error || !data) {
        setState((s) => ({ ...s, isLoading: false, error: "Form not found" }));
        return;
      }

      const definition: FormDefinition = {
        ...data,
        steps: (data.steps || []) as FormStep[],
        settings: (data.settings || {}) as FormDefinition["settings"],
        contexts: (data.contexts || []) as FormDefinition["contexts"],
      };

      setFormDef(definition);

      // Resume from session token
      if (sessionToken) {
        const { data: submission } = await supabase
          .from("form_submissions")
          .select("*")
          .eq("session_token", sessionToken)
          .single();

        if (submission && submission.token_expires_at && new Date(submission.token_expires_at) > new Date()) {
          const submissionData = (submission.data || {}) as Record<string, unknown>;
          const visibleSteps = getVisibleSteps(definition.steps, submissionData);
          const resumeIndex = submission.current_step_id
            ? visibleSteps.findIndex((s) => s.id === submission.current_step_id)
            : 0;

          setState((s) => ({
            ...s,
            data: { ...prefillData, ...submissionData },
            currentStepIndex: Math.max(0, resumeIndex),
            submissionId: submission.id,
            sessionToken: submission.session_token,
            isLoading: false,
          }));
          return;
        }
      }

      // Create new submission record
      const result = await createSubmission(data.id, prefillData || {}, definition.steps[0]?.id || null);
      if (result) {
        setState((s) => ({
          ...s,
          submissionId: result.id,
          sessionToken: result.session_token,
          isLoading: false,
        }));
      } else {
        setState((s) => ({ ...s, isLoading: false }));
      }
    }

    loadForm();
  }, [formId, formSlug, sessionToken, prefillData]);

  // Get visible steps based on current data
  const visibleSteps = formDef ? getVisibleSteps(formDef.steps, state.data) : [];
  const currentStep = visibleSteps[state.currentStepIndex];
  const isLastStep = state.currentStepIndex === visibleSteps.length - 1;
  const isFirstStep = state.currentStepIndex === 0;

  // Handle field changes
  const handleFieldChange = useCallback(
    (fieldId: string, value: unknown) => {
      setState((s) => {
        const newData = { ...s.data, [fieldId]: value };
        return { ...s, data: newData };
      });
      setErrors((e) => {
        const next = { ...e };
        delete next[fieldId];
        return next;
      });

      // Auto-advance for card-select on router steps
      if (currentStep?.type === "router") {
        if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = setTimeout(() => {
          goNext();
        }, 300);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentStep]
  );

  // Field blur handler (auto-save + email lookup)
  const handleFieldBlur = useCallback(
    (fieldId: string) => {
      if (state.submissionId) {
        debouncedSave(state.submissionId, state.data, currentStep?.id || null);
      }

      // Email lookup for external forms
      if (fieldId === "email" && context === "page" && state.data.email) {
        lookupContactByEmail(state.data.email as string).then((result) => {
          if (result.found) {
            setState((s) => ({
              ...s,
              data: {
                ...s.data,
                ...(result.name && !s.data.full_name ? { full_name: result.name } : {}),
                ...(result.phone && !s.data.phone ? { phone: result.phone } : {}),
                ...(result.entity_name && !s.data.entity_name ? { entity_name: result.entity_name } : {}),
              },
            }));
            toast.success("Welcome back! We've filled in your details.");
          }
        });
      }
    },
    [state.submissionId, state.data, currentStep, context]
  );

  // Validate current step
  const validateStep = useCallback((): boolean => {
    if (!currentStep) return true;

    const stepErrors: Record<string, string> = {};
    for (const field of currentStep.fields) {
      if (!field.required) continue;

      // Check visibility
      if (field.visibility_mode === "external_only" && visibilityContext !== "external") continue;
      if (field.visibility_mode === "internal_only" && visibilityContext !== "internal") continue;
      if (field.visibility_form_mode === "create_only" && mode !== "create") continue;
      if (field.visibility_form_mode === "edit_only" && mode !== "edit") continue;

      const value = state.data[field.id];
      if (value === null || value === undefined || value === "" || value === false) {
        stepErrors[field.id] = `${field.label || "This field"} is required`;
      }
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  }, [currentStep, state.data, visibilityContext, mode]);

  // Navigate next
  const goNext = useCallback(() => {
    if (!validateStep()) return;

    if (state.submissionId && currentStep) {
      immediateSave(state.submissionId, state.data, currentStep.id);
    }

    if (isLastStep) {
      handleSubmit();
    } else {
      setState((s) => ({ ...s, currentStepIndex: s.currentStepIndex + 1 }));
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validateStep, state.submissionId, state.data, currentStep, isLastStep]);

  // Navigate back
  const goBack = useCallback(() => {
    if (state.submissionId && currentStep) {
      immediateSave(state.submissionId, state.data, currentStep.id);
    }
    setState((s) => ({ ...s, currentStepIndex: Math.max(0, s.currentStepIndex - 1) }));
    setErrors({});
  }, [state.submissionId, state.data, currentStep]);

  // Submit
  const handleSubmit = useCallback(async () => {
    if (!formDef || !state.submissionId) return;
    if (!validateStep()) return;

    setState((s) => ({ ...s, isSubmitting: true, error: null }));

    const result = await submitForm({
      submissionId: state.submissionId,
      formId: formDef.id,
      data: state.data,
      mode: (mode === "edit" ? "update" : "create") as "create" | "update",
      recordId,
    });

    if (result.success) {
      setIsSubmitted(true);
      setState((s) => ({ ...s, isSubmitting: false }));
      if (onComplete && result.submission_id) {
        onComplete({
          id: result.submission_id,
          form_id: formDef.id,
          status: "submitted",
          type: (mode === "edit" ? "update" : "create") as SubmissionType,
          data: state.data,
          current_step_id: null,
          session_token: state.sessionToken || "",
          record_id: recordId || null,
          record_type: recordType || null,
          prefilled_by: null,
          submitted_by: null,
          submitted_by_email: null,
          entity_ids: result.entity_ids || {},
          changes: null,
          ip_address: null,
          user_agent: null,
          token_expires_at: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } else {
      setState((s) => ({
        ...s,
        isSubmitting: false,
        error: result.error || "Submission failed. Please try again.",
      }));
    }
  }, [formDef, state.submissionId, state.data, state.sessionToken, mode, recordId, recordType, onComplete, validateStep]);

  // Loading state
  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} strokeWidth={1.5} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (state.error && !formDef) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm text-destructive">{state.error}</p>
      </div>
    );
  }

  // Submitted state
  if (isSubmitted && formDef) {
    return (
      <FormSummary
        message={formDef.settings.success_message || "Your submission has been received."}
        onClose={onClose}
      />
    );
  }

  if (!formDef || !currentStep) return null;

  return (
    <div className="space-y-6">
      <FormProgress
        currentStep={state.currentStepIndex}
        totalSteps={visibleSteps.length}
      />

      <StepRenderer
        step={currentStep}
        data={state.data}
        onChange={handleFieldChange}
        onBlur={handleFieldBlur}
        visibilityContext={visibilityContext}
        formMode={mode}
        errors={errors}
      />

      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      {/* Navigation buttons (hidden for router steps since they auto-advance) */}
      {currentStep.type !== "router" && (
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            onClick={goBack}
            disabled={isFirstStep}
            className={isFirstStep ? "invisible" : ""}
          >
            <ArrowLeft size={16} strokeWidth={1.5} className="mr-2" />
            Back
          </Button>

          {isLastStep ? (
            <Button onClick={handleSubmit} disabled={state.isSubmitting}>
              {state.isSubmitting ? (
                <Loader2 size={16} strokeWidth={1.5} className="mr-2 animate-spin" />
              ) : (
                <Send size={16} strokeWidth={1.5} className="mr-2" />
              )}
              Submit
            </Button>
          ) : (
            <Button onClick={goNext}>
              Continue
              <ArrowRight size={16} strokeWidth={1.5} className="ml-2" />
            </Button>
          )}
        </div>
      )}

      {/* Back button for router steps */}
      {currentStep.type === "router" && !isFirstStep && (
        <div className="pt-2">
          <Button variant="ghost" size="sm" onClick={goBack}>
            <ArrowLeft size={16} strokeWidth={1.5} className="mr-2" />
            Back
          </Button>
        </div>
      )}
    </div>
  );
}

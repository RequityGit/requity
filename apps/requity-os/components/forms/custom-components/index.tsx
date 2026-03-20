"use client";

import { LoanAmountSlider } from "./LoanAmountSlider";
import { PricingCalculator } from "./PricingCalculator";
import { GooglePlacesInput } from "./GooglePlacesInput";
import { ThousandsCurrencyInput } from "./ThousandsCurrencyInput";
import { SignaturePad } from "./SignaturePad";
import type { FormFieldDefinition } from "@/lib/form-engine/types";

export interface CustomFieldComponentProps {
  field: FormFieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  onBlur?: () => void;
  formData: Record<string, unknown>; // All form data for calculations
  error?: string;
}

// Registry of custom components
export const CUSTOM_COMPONENT_REGISTRY: Record<
  string,
  React.ComponentType<CustomFieldComponentProps>
> = {
  "loan-amount-slider": LoanAmountSlider,
  "pricing-calculator": PricingCalculator,
  "google-places": GooglePlacesInput,
  "thousands-currency": ThousandsCurrencyInput,
  "signature": SignaturePad,
};

export function renderCustomComponent(
  componentType: string,
  props: CustomFieldComponentProps
): React.ReactNode {
  const Component = CUSTOM_COMPONENT_REGISTRY[componentType];
  if (!Component) {
    console.warn(`Unknown custom component type: ${componentType}`);
    return null;
  }
  return <Component {...props} />;
}

# Form Engine Custom Components

The form engine now supports custom React components for specialized field types. This enables dynamic features like real-time calculations, interactive sliders, and third-party integrations.

## Available Components

### 1. `loan-amount-slider`
Interactive slider for selecting loan amount with real-time LTC/LTV/equity calculations.

**Configuration:**
```json
{
  "component_type": "loan-amount-slider",
  "component_config": {
    "min": 50,
    "max": 90,
    "default": 75,
    "purchase_price_field": "purchase_price",
    "rehab_budget_field": "rehab_budget",
    "arv_field": "after_repair_value"
  }
}
```

**Features:**
- Visual slider (50-90% of total cost by default)
- Real-time LTC/LTV/equity calculations
- Color-coded risk indicators
- Falls back to text input if total cost < $100k

### 2. `pricing-calculator`
Real-time term sheet preview based on borrower profile and loan parameters.

**Configuration:**
```json
{
  "component_type": "pricing-calculator",
  "component_config": {
    "loan_type_field": "loan_type",
    "credit_score_field": "credit_score",
    "deals_24_months_field": "deals_in_last_24_months",
    "citizenship_field": "citizenship_status",
    "purchase_price_field": "purchase_price",
    "rehab_budget_field": "rehab_budget",
    "arv_field": "after_repair_value",
    "loan_amount_field": "loan_amount"
  }
}
```

**Features:**
- Auto-qualifies borrower for loan programs
- Displays interest rate, loan amount, term, origination fee
- Shows monthly interest payment
- Warns if loan is capped due to LTV/LTC limits

### 3. `google-places`
Google Places Autocomplete for address input with automatic parsing.

**Configuration:**
```json
{
  "component_type": "google-places",
  "component_config": {
    "address_field": "property_address",
    "city_field": "city",
    "state_field": "state",
    "zip_field": "zip"
  }
}
```

**Features:**
- Google Places Autocomplete integration
- Parses address components (street, city, state, zip)
- US-only address restriction
- MapPin icon indicator

### 4. `thousands-currency`
Currency input that accepts values in thousands (e.g., "500" = $500,000).

**Configuration:**
```json
{
  "component_type": "thousands-currency"
}
```

**Features:**
- Keyboard-only input (digits only)
- Auto-formats to full currency value
- Helpful hint text
- Paste support

## Usage in Form Definitions

To use a custom component, set the field `type` to `"custom"` and specify `component_type`:

```json
{
  "id": "loan_amount",
  "type": "custom",
  "label": "Loan Amount",
  "component_type": "loan-amount-slider",
  "component_config": {
    "min": 50,
    "max": 90,
    "purchase_price_field": "purchase_price",
    "rehab_budget_field": "rehab_budget",
    "arv_field": "after_repair_value"
  },
  "required": true,
  "width": "full"
}
```

## Creating New Custom Components

1. **Create the component** in `apps/requity-os/components/forms/custom-components/YourComponent.tsx`:

```tsx
"use client";

import type { CustomFieldComponentProps } from "./index";

export function YourComponent({
  field,
  value,
  onChange,
  onBlur,
  formData,
  error,
}: CustomFieldComponentProps) {
  // Your component logic
  return (
    <div className="space-y-1.5">
      {field.label && (
        <Label>{field.label}</Label>
      )}
      {/* Your component UI */}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
```

2. **Register it** in `apps/requity-os/components/forms/custom-components/index.tsx`:

```tsx
import { YourComponent } from "./YourComponent";

export const CUSTOM_COMPONENT_REGISTRY: Record<
  string,
  React.ComponentType<CustomFieldComponentProps>
> = {
  // ... existing components
  "your-component-type": YourComponent,
};
```

3. **Use it** in form definitions with `type: "custom"` and `component_type: "your-component-type"`.

## Component Props

All custom components receive:

- `field: FormFieldDefinition` - The field definition from the form
- `value: unknown` - Current field value
- `onChange: (value: unknown) => void` - Update handler
- `onBlur?: () => void` - Blur handler (optional)
- `formData: Record<string, unknown>` - All form data (for calculations/dependencies)
- `error?: string` - Validation error message (if any)

## Notes

- Custom components have access to all form data via `formData`, enabling real-time calculations
- Components should handle their own validation feedback via the `error` prop
- Use `field.component_config` for component-specific settings
- Components are client-side only (`"use client"` directive required)
- Follow the design system (shadcn/ui primitives, no navy/gold/serifs)

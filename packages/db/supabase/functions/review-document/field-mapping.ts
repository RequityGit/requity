// Maps extracted fields to unified_deals jsonb column paths

export interface FieldMapping {
  label: string;
  target_table: string;
  target_column: string; // 'uw_data' or 'property_data'
  target_json_path: string; // key inside the jsonb column
}

export const FIELD_MAPPINGS: Record<string, Record<string, FieldMapping>> = {
  appraisal: {
    as_is_value: {
      label: "As-Is Value",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "property_value",
    },
    arv: {
      label: "After-Repair Value (ARV)",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "after_repair_value",
    },
    property_address: {
      label: "Property Address",
      target_table: "unified_deals",
      target_column: "property_data",
      target_json_path: "property_address",
    },
    property_type: {
      label: "Property Type",
      target_table: "unified_deals",
      target_column: "property_data",
      target_json_path: "property_type",
    },
    property_condition: {
      label: "Property Condition",
      target_table: "unified_deals",
      target_column: "property_data",
      target_json_path: "property_condition",
    },
    year_built: {
      label: "Year Built",
      target_table: "unified_deals",
      target_column: "property_data",
      target_json_path: "year_built",
    },
    gross_living_area: {
      label: "Square Footage (GLA)",
      target_table: "unified_deals",
      target_column: "property_data",
      target_json_path: "sqft",
    },
    bedroom_count: {
      label: "Bedrooms",
      target_table: "unified_deals",
      target_column: "property_data",
      target_json_path: "bedrooms",
    },
    bathroom_count: {
      label: "Bathrooms",
      target_table: "unified_deals",
      target_column: "property_data",
      target_json_path: "bathrooms",
    },
  },

  bank_statement: {
    ending_balance: {
      label: "Cash Reserves (Ending Balance)",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "borrower_cash_reserves",
    },
    average_daily_balance: {
      label: "Avg Daily Balance",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "avg_daily_balance",
    },
    bank_name: {
      label: "Bank Name",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "bank_name",
    },
  },

  pnl_tax_return: {
    net_operating_income: {
      label: "Net Operating Income",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "noi",
    },
    gross_revenue: {
      label: "Gross Revenue",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "gross_revenue",
    },
    total_expenses: {
      label: "Total Expenses",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "annual_expenses",
    },
    net_income: {
      label: "Net Income",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "net_income",
    },
    depreciation: {
      label: "Depreciation",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "depreciation",
    },
  },

  rent_roll: {
    total_units: {
      label: "Total Units",
      target_table: "unified_deals",
      target_column: "property_data",
      target_json_path: "unit_count",
    },
    occupancy_rate: {
      label: "Occupancy Rate",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "occupancy_rate",
    },
    total_monthly_rent: {
      label: "Monthly Rental Income",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "monthly_rental_income",
    },
    total_annual_rent: {
      label: "Annual Rental Income",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "annual_rental_income",
    },
    average_rent_per_unit: {
      label: "Avg Rent Per Unit",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "avg_rent_per_unit",
    },
  },

  title_report: {
    property_address: {
      label: "Property Address",
      target_table: "unified_deals",
      target_column: "property_data",
      target_json_path: "property_address",
    },
    legal_description: {
      label: "Legal Description",
      target_table: "unified_deals",
      target_column: "property_data",
      target_json_path: "legal_description",
    },
    current_owner: {
      label: "Current Owner",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "vesting",
    },
    title_company: {
      label: "Title Company",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "title_company",
    },
    policy_amount: {
      label: "Title Policy Amount",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "title_policy_amount",
    },
  },

  insurance_policy: {
    carrier_name: {
      label: "Insurance Carrier",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "insurance_carrier",
    },
    policy_number: {
      label: "Policy Number",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "insurance_policy_number",
    },
    coverage_amount: {
      label: "Coverage Amount",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "insurance_coverage_amount",
    },
    deductible: {
      label: "Deductible",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "insurance_deductible",
    },
    annual_premium: {
      label: "Annual Premium",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "insurance_premium",
    },
    expiration_date: {
      label: "Policy Expiration",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "insurance_expiration",
    },
  },

  entity_document: {
    entity_name: {
      label: "Borrowing Entity Name",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "borrower_entity_name",
    },
    ein: {
      label: "EIN",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "borrower_ein",
    },
    formation_state: {
      label: "State of Formation",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "entity_formation_state",
    },
    formation_date: {
      label: "Formation Date",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "entity_formation_date",
    },
    managing_member: {
      label: "Managing Member",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "managing_member",
    },
  },

  // 'other' type has no field mappings — everything goes to notes only
  other: {},
};

// Document classification and extraction prompts for Claude API

export const CLASSIFICATION_PROMPT = `You are a document classifier for a real estate lending company. Analyze the first pages of this document and classify it into EXACTLY ONE of these types:

- appraisal (property appraisal, BPO, valuation report)
- bank_statement (bank account statements, account summaries)
- pnl_tax_return (profit & loss statements, tax returns, K-1s, 1040/1065/1120 forms, Schedule C/E/K)
- rent_roll (rent rolls, unit mixes, occupancy reports)
- title_report (title commitments, preliminary title reports, title searches)
- insurance_policy (insurance binders, certificates, policies, COIs)
- entity_document (articles of organization, operating agreements, EIN letters, certificates of good standing, resolutions)
- other (anything that doesn't match the above)

Respond with ONLY valid JSON:
{
  "document_type": "<type>",
  "confidence": <0.0-1.0>,
  "reasoning": "<brief explanation>"
}`;

export const EXTRACTION_PROMPTS: Record<string, string> = {
  appraisal: `You are extracting structured data from a real estate appraisal for a lending company's underwriting system.

Extract the following fields. For each field, provide the value, your confidence (0.0-1.0), and the source location in the document.

Required fields:
- as_is_value: The as-is market value / opinion of value (number)
- arv: After-repair value if available (number, null if not present)
- property_address: Full property address including city, state, zip
- property_type: SFR, 2-4 Unit, Condo, Townhouse, MHC, Mixed Use, etc.
- property_condition: C1-C6 rating or descriptive condition
- year_built: Year the property was built
- gross_living_area: GLA / square footage (number)
- lot_size: Lot size in sq ft or acres
- bedroom_count: Number of bedrooms
- bathroom_count: Number of bathrooms
- appraiser_name: Name of the appraiser
- effective_date: Effective date of the appraisal
- comparable_sales: Array of up to 3 comparable sales with address, sale_price, sale_date, adjustments

Also provide:
- summary: 2-3 sentence summary of the appraisal
- flags: Array of any concerns (value discrepancies, old comps, condition issues, market decline)

Respond with ONLY valid JSON matching this exact schema:
{
  "document_type": "appraisal",
  "extracted_fields": {
    "<field_name>": {
      "value": <extracted value>,
      "confidence": <0.0-1.0>,
      "source": "<page/section reference>"
    }
  },
  "summary": "<summary>",
  "flags": ["<flag1>", "<flag2>"]
}`,

  bank_statement: `You are extracting structured data from bank statements for a lending company's underwriting system.

Extract the following fields:
- account_holder_name: Name on the account
- bank_name: Name of the financial institution
- account_type: Checking, Savings, Money Market, etc.
- account_number_last4: Last 4 digits of account number
- statement_period_start: Start date of the statement period
- statement_period_end: End date of the statement period
- beginning_balance: Opening balance (number)
- ending_balance: Closing balance (number)
- total_deposits: Total deposits during period (number)
- total_withdrawals: Total withdrawals during period (number)
- average_daily_balance: Average daily balance if shown (number, null if not present)
- large_deposits: Array of deposits over $5,000 with date, amount, description
- nsf_occurrences: Number of NSF/overdraft events (number)

Also provide:
- summary: 2-3 sentence summary
- flags: Array of concerns (low balance, NSFs, large unexplained deposits, inconsistent deposits)

Respond with ONLY valid JSON matching the schema:
{
  "document_type": "bank_statement",
  "extracted_fields": {
    "<field_name>": { "value": <value>, "confidence": <0.0-1.0>, "source": "<reference>" }
  },
  "summary": "<summary>",
  "flags": ["<flag>"]
}`,

  pnl_tax_return: `You are extracting structured data from profit & loss statements or tax returns for a lending company's underwriting system.

Extract the following fields:
- entity_name: Business name or individual taxpayer name
- tax_year: Tax year or P&L period
- form_type: 1040, 1065, 1120, 1120-S, K-1, Schedule C, Schedule E, P&L Statement
- gross_revenue: Total gross income/revenue (number)
- total_expenses: Total deductions/expenses (number)
- net_operating_income: NOI or net income before taxes (number)
- net_income: Net income after taxes (number)
- depreciation: Depreciation amount (number, important for cash flow addback)
- amortization: Amortization amount (number)
- interest_expense: Total interest expense (number)
- rental_income: Rental income if present (number)
- filing_status: Single, MFJ, MFS, HOH, etc. (for 1040s)
- agi: Adjusted gross income (for 1040s)

Also provide:
- summary: 2-3 sentence summary
- flags: Concerns (declining revenue, high expense ratio, negative NOI, missing schedules)

Respond with ONLY valid JSON:
{
  "document_type": "pnl_tax_return",
  "extracted_fields": {
    "<field_name>": { "value": <value>, "confidence": <0.0-1.0>, "source": "<reference>" }
  },
  "summary": "<summary>",
  "flags": ["<flag>"]
}`,

  rent_roll: `You are extracting structured data from a rent roll for a lending company's underwriting system.

Extract the following fields:
- property_name: Property name or address
- report_date: Date of the rent roll
- total_units: Total number of units (number)
- occupied_units: Number of occupied units (number)
- vacant_units: Number of vacant units (number)
- occupancy_rate: Occupancy percentage (number, e.g. 94.5)
- total_monthly_rent: Total scheduled monthly rent (number)
- total_annual_rent: Total annualized rent (number)
- average_rent_per_unit: Average rent per occupied unit (number)
- unit_mix: Array of unit types with count, rent, sqft (e.g. [{type: "1BR/1BA", count: 10, rent: 1200, sqft: 750}])
- delinquent_units: Number of units with past-due rent (number)
- total_delinquency: Total delinquent amount (number)

Also provide:
- summary: 2-3 sentence summary
- flags: Concerns (high vacancy, delinquencies, below-market rents, rent concentration)

Respond with ONLY valid JSON:
{
  "document_type": "rent_roll",
  "extracted_fields": {
    "<field_name>": { "value": <value>, "confidence": <0.0-1.0>, "source": "<reference>" }
  },
  "summary": "<summary>",
  "flags": ["<flag>"]
}`,

  title_report: `You are extracting structured data from a title report/commitment for a lending company's underwriting system.

Extract the following fields:
- property_address: Full property address
- legal_description: Legal description (abbreviated if very long)
- current_owner: Name of current property owner / vesting
- title_company: Name of the title company
- effective_date: Effective date of the title search
- commitment_number: Title commitment or file number
- proposed_insured: Name of proposed insured
- policy_amount: Proposed policy amount (number)
- existing_liens: Array of existing liens with position, holder, amount, recording_info
- exceptions: Array of schedule B exceptions (easements, restrictions, etc.)
- taxes_current: Whether property taxes are current (boolean)
- tax_amount: Annual tax amount if shown (number)
- vesting_type: Fee simple, leasehold, etc.

Also provide:
- summary: 2-3 sentence summary
- flags: Concerns (unreleased liens, judgments, tax delinquencies, unusual exceptions)

Respond with ONLY valid JSON:
{
  "document_type": "title_report",
  "extracted_fields": {
    "<field_name>": { "value": <value>, "confidence": <0.0-1.0>, "source": "<reference>" }
  },
  "summary": "<summary>",
  "flags": ["<flag>"]
}`,

  insurance_policy: `You are extracting structured data from an insurance policy/binder/COI for a lending company's underwriting system.

Extract the following fields:
- carrier_name: Insurance company name
- policy_number: Policy number
- insured_name: Named insured
- property_address: Insured property address
- policy_type: Homeowners, Commercial Property, Builders Risk, Flood, etc.
- coverage_amount: Dwelling/building coverage amount (number)
- liability_coverage: Liability coverage amount (number)
- deductible: Deductible amount (number)
- annual_premium: Annual premium (number)
- effective_date: Policy effective date
- expiration_date: Policy expiration date
- mortgagee_clause: Whether lender is listed as mortgagee/loss payee (boolean)
- mortgagee_name: Name in the mortgagee clause if present
- flood_zone: Flood zone designation if shown
- replacement_cost: Whether coverage is replacement cost vs ACV

Also provide:
- summary: 2-3 sentence summary
- flags: Concerns (insufficient coverage, missing mortgagee, expiring soon, high deductible, flood zone)

Respond with ONLY valid JSON:
{
  "document_type": "insurance_policy",
  "extracted_fields": {
    "<field_name>": { "value": <value>, "confidence": <0.0-1.0>, "source": "<reference>" }
  },
  "summary": "<summary>",
  "flags": ["<flag>"]
}`,

  entity_document: `You are extracting structured data from entity/corporate documents for a lending company's underwriting system.

Extract the following fields:
- entity_name: Full legal entity name
- entity_type: LLC, Corporation, LP, Trust, etc.
- formation_state: State of formation/organization
- formation_date: Date of formation
- ein: EIN / Tax ID number (if present in an EIN letter)
- registered_agent: Registered agent name and address
- members_managers: Array of members/managers/officers with name, title, ownership_percentage
- managing_member: Name of the managing member or authorized signatory
- good_standing: Whether the entity is in good standing (boolean, from CoGS)
- good_standing_date: Date of the certificate of good standing
- document_subtype: articles, operating_agreement, ein_letter, cogs, resolution, bylaws

Also provide:
- summary: 2-3 sentence summary
- flags: Concerns (dissolved entity, missing members, no EIN, expired good standing)

Respond with ONLY valid JSON:
{
  "document_type": "entity_document",
  "extracted_fields": {
    "<field_name>": { "value": <value>, "confidence": <0.0-1.0>, "source": "<reference>" }
  },
  "summary": "<summary>",
  "flags": ["<flag>"]
}`,

  other: `You are extracting structured data from a document uploaded to a real estate lending deal. The document type is not one of the standard categories, so perform a general extraction.

Extract any relevant information you find, focusing on:
- Names (people, companies, entities)
- Addresses (property or mailing)
- Dollar amounts (loan amounts, values, prices, costs)
- Dates (effective dates, expiration dates, closing dates)
- Percentages (rates, LTV, ownership)
- Key terms and conditions
- Any data that would be relevant to underwriting a real estate loan

Do NOT map these to specific deal fields — instead, present them as informational notes.

Respond with ONLY valid JSON:
{
  "document_type": "other",
  "extracted_fields": {
    "<descriptive_key>": { "value": <value>, "confidence": <0.0-1.0>, "source": "<reference>" }
  },
  "summary": "<summary of what this document is and what it contains>",
  "flags": ["<any concerns or notable items>"]
}`,
};

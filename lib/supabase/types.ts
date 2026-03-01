export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      borrower_entities: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          articles_of_org_url: string | null
          borrower_id: string
          certificate_good_standing_url: string | null
          city: string | null
          country: string | null
          created_at: string
          ein: string | null
          ein_letter_url: string | null
          entity_name: string
          entity_type: string
          foreign_filed_states: string[] | null
          id: string
          is_foreign_filed: boolean | null
          notes: string | null
          operating_agreement_url: string | null
          state: string | null
          state_of_formation: string | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          articles_of_org_url?: string | null
          borrower_id: string
          certificate_good_standing_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          ein?: string | null
          ein_letter_url?: string | null
          entity_name: string
          entity_type: string
          foreign_filed_states?: string[] | null
          id?: string
          is_foreign_filed?: boolean | null
          notes?: string | null
          operating_agreement_url?: string | null
          state?: string | null
          state_of_formation?: string | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          articles_of_org_url?: string | null
          borrower_id?: string
          certificate_good_standing_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          ein?: string | null
          ein_letter_url?: string | null
          entity_name?: string
          entity_type?: string
          foreign_filed_states?: string[] | null
          id?: string
          is_foreign_filed?: boolean | null
          notes?: string | null
          operating_agreement_url?: string | null
          state?: string | null
          state_of_formation?: string | null
          updated_at?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "borrower_entities_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "borrower_entities_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers_portal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "borrower_entities_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      borrowers: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          country: string | null
          created_at: string
          credit_report_date: string | null
          credit_score: number | null
          date_of_birth: string | null
          email: string | null
          experience_count: number | null
          first_name: string
          id: string
          is_us_citizen: boolean | null
          last_name: string
          notes: string | null
          phone: string | null
          ssn_last_four: string | null
          state: string | null
          updated_at: string
          user_id: string | null
          zip: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          credit_report_date?: string | null
          credit_score?: number | null
          date_of_birth?: string | null
          email?: string | null
          experience_count?: number | null
          first_name: string
          id?: string
          is_us_citizen?: boolean | null
          last_name: string
          notes?: string | null
          phone?: string | null
          ssn_last_four?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string | null
          zip?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          credit_report_date?: string | null
          credit_score?: number | null
          date_of_birth?: string | null
          email?: string | null
          experience_count?: number | null
          first_name?: string
          id?: string
          is_us_citizen?: boolean | null
          last_name?: string
          notes?: string | null
          phone?: string | null
          ssn_last_four?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      campaign_sends: {
        Row: {
          campaign_id: string
          clicked_at: string | null
          contact_id: string
          created_at: string
          id: string
          opened_at: string | null
          postmark_message_id: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["send_status_enum"] | null
          unsubscribed_at: string | null
        }
        Insert: {
          campaign_id: string
          clicked_at?: string | null
          contact_id: string
          created_at?: string
          id?: string
          opened_at?: string | null
          postmark_message_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["send_status_enum"] | null
          unsubscribed_at?: string | null
        }
        Update: {
          campaign_id?: string
          clicked_at?: string | null
          contact_id?: string
          created_at?: string
          id?: string
          opened_at?: string | null
          postmark_message_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["send_status_enum"] | null
          unsubscribed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_sends_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_sends_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts_active"
            referencedColumns: ["id"]
          },
        ]
      }
      capital_call_line_items: {
        Row: {
          amount: number
          capital_call_id: string
          commitment_id: string
          created_at: string
          id: string
          notes: string | null
          paid_amount: number | null
          paid_date: string | null
          status: string
          updated_at: string
          wire_reference: string | null
        }
        Insert: {
          amount: number
          capital_call_id: string
          commitment_id: string
          created_at?: string
          id?: string
          notes?: string | null
          paid_amount?: number | null
          paid_date?: string | null
          status?: string
          updated_at?: string
          wire_reference?: string | null
        }
        Update: {
          amount?: number
          capital_call_id?: string
          commitment_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          paid_amount?: number | null
          paid_date?: string | null
          status?: string
          updated_at?: string
          wire_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "capital_call_line_items_capital_call_id_fkey"
            columns: ["capital_call_id"]
            isOneToOne: false
            referencedRelation: "capital_calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capital_call_line_items_commitment_id_fkey"
            columns: ["commitment_id"]
            isOneToOne: false
            referencedRelation: "investor_commitments"
            referencedColumns: ["id"]
          },
        ]
      }
      capital_calls: {
        Row: {
          call_amount: number | null
          call_date: string
          call_number: number
          commitment_id: string | null
          created_at: string
          due_date: string
          fund_id: string
          id: string
          investor_id: string | null
          issued_at: string | null
          issued_by: string | null
          notes: string | null
          notice_url: string | null
          paid_date: string | null
          purpose: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          call_amount?: number | null
          call_date?: string
          call_number: number
          commitment_id?: string | null
          created_at?: string
          due_date: string
          fund_id: string
          id?: string
          investor_id?: string | null
          issued_at?: string | null
          issued_by?: string | null
          notes?: string | null
          notice_url?: string | null
          paid_date?: string | null
          purpose?: string | null
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          call_amount?: number | null
          call_date?: string
          call_number?: number
          commitment_id?: string | null
          created_at?: string
          due_date?: string
          fund_id?: string
          id?: string
          investor_id?: string | null
          issued_at?: string | null
          issued_by?: string | null
          notes?: string | null
          notice_url?: string | null
          paid_date?: string | null
          purpose?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "capital_calls_commitment_id_fkey"
            columns: ["commitment_id"]
            isOneToOne: false
            referencedRelation: "investor_commitments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capital_calls_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capital_calls_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capital_calls_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_mentions: {
        Row: {
          comment_id: string
          comment_type: string
          condition_id: string | null
          created_at: string
          id: string
          loan_id: string
          mentioned_user_id: string
          notification_sent: boolean
        }
        Insert: {
          comment_id: string
          comment_type: string
          condition_id?: string | null
          created_at?: string
          id?: string
          loan_id: string
          mentioned_user_id: string
          notification_sent?: boolean
        }
        Update: {
          comment_id?: string
          comment_type?: string
          condition_id?: string | null
          created_at?: string
          id?: string
          loan_id?: string
          mentioned_user_id?: string
          notification_sent?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "comment_mentions_condition_id_fkey"
            columns: ["condition_id"]
            isOneToOne: false
            referencedRelation: "loan_conditions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_mentions_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_mentions_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_ancillary_income: {
        Row: {
          created_at: string | null
          current_annual_amount: number | null
          id: string
          income_source: string
          sort_order: number | null
          stabilized_annual_amount: number | null
          underwriting_id: string
        }
        Insert: {
          created_at?: string | null
          current_annual_amount?: number | null
          id?: string
          income_source: string
          sort_order?: number | null
          stabilized_annual_amount?: number | null
          underwriting_id: string
        }
        Update: {
          created_at?: string | null
          current_annual_amount?: number | null
          id?: string
          income_source?: string
          sort_order?: number | null
          stabilized_annual_amount?: number | null
          underwriting_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commercial_ancillary_income_underwriting_id_fkey"
            columns: ["underwriting_id"]
            isOneToOne: false
            referencedRelation: "commercial_underwriting"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_expense_defaults: {
        Row: {
          basis: string
          expense_category: string
          id: string
          notes: string | null
          per_unit_amount: number
          property_type: string
          range_high: number | null
          range_low: number | null
        }
        Insert: {
          basis: string
          expense_category: string
          id?: string
          notes?: string | null
          per_unit_amount: number
          property_type: string
          range_high?: number | null
          range_low?: number | null
        }
        Update: {
          basis?: string
          expense_category?: string
          id?: string
          notes?: string | null
          per_unit_amount?: number
          property_type?: string
          range_high?: number | null
          range_low?: number | null
        }
        Relationships: []
      }
      commercial_occupancy_income: {
        Row: {
          count: number | null
          created_at: string | null
          id: string
          occupancy_pct: number | null
          occupancy_pct_yr1: number | null
          occupancy_pct_yr2: number | null
          occupancy_pct_yr3: number | null
          occupancy_pct_yr4: number | null
          occupancy_pct_yr5: number | null
          operating_days: number | null
          rate_per_night: number | null
          sort_order: number | null
          space_type: string
          target_occupancy_pct: number | null
          target_rate: number | null
          underwriting_id: string
        }
        Insert: {
          count?: number | null
          created_at?: string | null
          id?: string
          occupancy_pct?: number | null
          occupancy_pct_yr1?: number | null
          occupancy_pct_yr2?: number | null
          occupancy_pct_yr3?: number | null
          occupancy_pct_yr4?: number | null
          occupancy_pct_yr5?: number | null
          operating_days?: number | null
          rate_per_night?: number | null
          sort_order?: number | null
          space_type: string
          target_occupancy_pct?: number | null
          target_rate?: number | null
          underwriting_id: string
        }
        Update: {
          count?: number | null
          created_at?: string | null
          id?: string
          occupancy_pct?: number | null
          occupancy_pct_yr1?: number | null
          occupancy_pct_yr2?: number | null
          occupancy_pct_yr3?: number | null
          occupancy_pct_yr4?: number | null
          occupancy_pct_yr5?: number | null
          operating_days?: number | null
          rate_per_night?: number | null
          sort_order?: number | null
          space_type?: string
          target_occupancy_pct?: number | null
          target_rate?: number | null
          underwriting_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commercial_occupancy_income_underwriting_id_fkey"
            columns: ["underwriting_id"]
            isOneToOne: false
            referencedRelation: "commercial_underwriting"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_proforma_years: {
        Row: {
          bad_debt: number | null
          cap_rate: number | null
          contract_services: number | null
          cumulative_cash_flow: number | null
          debt_service: number | null
          dscr: number | null
          egi: number | null
          expense_ratio: number | null
          ga: number | null
          gpi: number | null
          id: string
          insurance: number | null
          marketing: number | null
          mgmt_fee: number | null
          net_cash_flow: number | null
          noi: number | null
          payroll: number | null
          price_per_unit: number | null
          repairs: number | null
          replacement_reserve: number | null
          taxes: number | null
          total_opex: number | null
          underwriting_id: string
          utilities: number | null
          vacancy: number | null
          year: number
        }
        Insert: {
          bad_debt?: number | null
          cap_rate?: number | null
          contract_services?: number | null
          cumulative_cash_flow?: number | null
          debt_service?: number | null
          dscr?: number | null
          egi?: number | null
          expense_ratio?: number | null
          ga?: number | null
          gpi?: number | null
          id?: string
          insurance?: number | null
          marketing?: number | null
          mgmt_fee?: number | null
          net_cash_flow?: number | null
          noi?: number | null
          payroll?: number | null
          price_per_unit?: number | null
          repairs?: number | null
          replacement_reserve?: number | null
          taxes?: number | null
          total_opex?: number | null
          underwriting_id: string
          utilities?: number | null
          vacancy?: number | null
          year: number
        }
        Update: {
          bad_debt?: number | null
          cap_rate?: number | null
          contract_services?: number | null
          cumulative_cash_flow?: number | null
          debt_service?: number | null
          dscr?: number | null
          egi?: number | null
          expense_ratio?: number | null
          ga?: number | null
          gpi?: number | null
          id?: string
          insurance?: number | null
          marketing?: number | null
          mgmt_fee?: number | null
          net_cash_flow?: number | null
          noi?: number | null
          payroll?: number | null
          price_per_unit?: number | null
          repairs?: number | null
          replacement_reserve?: number | null
          taxes?: number | null
          total_opex?: number | null
          underwriting_id?: string
          utilities?: number | null
          vacancy?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "commercial_proforma_years_underwriting_id_fkey"
            columns: ["underwriting_id"]
            isOneToOne: false
            referencedRelation: "commercial_underwriting"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_rent_roll: {
        Row: {
          baths: number | null
          beds_type: string | null
          cam_nnn: number | null
          created_at: string | null
          current_monthly_rent: number | null
          id: string
          is_vacant: boolean | null
          lease_end: string | null
          lease_start: string | null
          lease_type: string | null
          market_cam_nnn: number | null
          market_other: number | null
          market_rent: number | null
          other_income: number | null
          poh_income: number | null
          sf: number | null
          sort_order: number | null
          tenant_name: string | null
          underwriting_id: string
          unit_number: string | null
        }
        Insert: {
          baths?: number | null
          beds_type?: string | null
          cam_nnn?: number | null
          created_at?: string | null
          current_monthly_rent?: number | null
          id?: string
          is_vacant?: boolean | null
          lease_end?: string | null
          lease_start?: string | null
          lease_type?: string | null
          market_cam_nnn?: number | null
          market_other?: number | null
          market_rent?: number | null
          other_income?: number | null
          poh_income?: number | null
          sf?: number | null
          sort_order?: number | null
          tenant_name?: string | null
          underwriting_id: string
          unit_number?: string | null
        }
        Update: {
          baths?: number | null
          beds_type?: string | null
          cam_nnn?: number | null
          created_at?: string | null
          current_monthly_rent?: number | null
          id?: string
          is_vacant?: boolean | null
          lease_end?: string | null
          lease_start?: string | null
          lease_type?: string | null
          market_cam_nnn?: number | null
          market_other?: number | null
          market_rent?: number | null
          other_income?: number | null
          poh_income?: number | null
          sf?: number | null
          sort_order?: number | null
          tenant_name?: string | null
          underwriting_id?: string
          unit_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commercial_rent_roll_underwriting_id_fkey"
            columns: ["underwriting_id"]
            isOneToOne: false
            referencedRelation: "commercial_underwriting"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_underwriting: {
        Row: {
          bad_debt_pct: number | null
          bridge_amortization_months: number | null
          bridge_io_months: number | null
          bridge_loan_amount: number | null
          bridge_origination_pts: number | null
          bridge_rate: number | null
          bridge_term_months: number | null
          created_at: string | null
          created_by: string | null
          current_ancillary_income: number | null
          current_gpi: number | null
          current_lease_income: number | null
          current_occupancy_revenue: number | null
          disposition_cost_pct: number | null
          equity_invested: number | null
          exit_amortization_years: number | null
          exit_cap_rate: number | null
          exit_io_months: number | null
          exit_lender_name: string | null
          exit_loan_amount: number | null
          exit_rate: number | null
          expense_growth_yr1: number | null
          expense_growth_yr2: number | null
          expense_growth_yr3: number | null
          expense_growth_yr4: number | null
          expense_growth_yr5: number | null
          going_in_cap_rate: number | null
          id: string
          loan_id: string
          operating_days_per_year: number | null
          poh_expense_ratio: number | null
          poh_rental_income: number | null
          property_type: string
          purchase_price: number | null
          rent_growth_yr1: number | null
          rent_growth_yr2: number | null
          rent_growth_yr3: number | null
          rent_growth_yr4: number | null
          rent_growth_yr5: number | null
          rent_roll_upload_id: string | null
          stabilized_ancillary_income: number | null
          stabilized_gpi: number | null
          stabilized_lease_income: number | null
          stabilized_occupancy_revenue: number | null
          stabilized_vacancy_pct: number | null
          status: string | null
          t12_bad_debt_pct: number | null
          t12_contract_services: number | null
          t12_ga: number | null
          t12_gpi: number | null
          t12_insurance: number | null
          t12_marketing: number | null
          t12_mgmt_fee: number | null
          t12_payroll: number | null
          t12_repairs: number | null
          t12_replacement_reserve: number | null
          t12_taxes: number | null
          t12_upload_id: string | null
          t12_utilities: number | null
          t12_vacancy_pct: number | null
          total_sf: number | null
          total_units_spaces: number | null
          updated_at: string | null
          vacancy_pct_yr1: number | null
          vacancy_pct_yr2: number | null
          vacancy_pct_yr3: number | null
          vacancy_pct_yr4: number | null
          vacancy_pct_yr5: number | null
          year_built: number | null
          yr1_contract_override: number | null
          yr1_ga_override: number | null
          yr1_insurance_override: number | null
          yr1_marketing_override: number | null
          yr1_mgmt_fee_pct: number | null
          yr1_payroll_override: number | null
          yr1_repairs_override: number | null
          yr1_reserve_override: number | null
          yr1_taxes_override: number | null
          yr1_utilities_override: number | null
        }
        Insert: {
          bad_debt_pct?: number | null
          bridge_amortization_months?: number | null
          bridge_io_months?: number | null
          bridge_loan_amount?: number | null
          bridge_origination_pts?: number | null
          bridge_rate?: number | null
          bridge_term_months?: number | null
          created_at?: string | null
          created_by?: string | null
          current_ancillary_income?: number | null
          current_gpi?: number | null
          current_lease_income?: number | null
          current_occupancy_revenue?: number | null
          disposition_cost_pct?: number | null
          equity_invested?: number | null
          exit_amortization_years?: number | null
          exit_cap_rate?: number | null
          exit_io_months?: number | null
          exit_lender_name?: string | null
          exit_loan_amount?: number | null
          exit_rate?: number | null
          expense_growth_yr1?: number | null
          expense_growth_yr2?: number | null
          expense_growth_yr3?: number | null
          expense_growth_yr4?: number | null
          expense_growth_yr5?: number | null
          going_in_cap_rate?: number | null
          id?: string
          loan_id: string
          operating_days_per_year?: number | null
          poh_expense_ratio?: number | null
          poh_rental_income?: number | null
          property_type: string
          purchase_price?: number | null
          rent_growth_yr1?: number | null
          rent_growth_yr2?: number | null
          rent_growth_yr3?: number | null
          rent_growth_yr4?: number | null
          rent_growth_yr5?: number | null
          rent_roll_upload_id?: string | null
          stabilized_ancillary_income?: number | null
          stabilized_gpi?: number | null
          stabilized_lease_income?: number | null
          stabilized_occupancy_revenue?: number | null
          stabilized_vacancy_pct?: number | null
          status?: string | null
          t12_bad_debt_pct?: number | null
          t12_contract_services?: number | null
          t12_ga?: number | null
          t12_gpi?: number | null
          t12_insurance?: number | null
          t12_marketing?: number | null
          t12_mgmt_fee?: number | null
          t12_payroll?: number | null
          t12_repairs?: number | null
          t12_replacement_reserve?: number | null
          t12_taxes?: number | null
          t12_upload_id?: string | null
          t12_utilities?: number | null
          t12_vacancy_pct?: number | null
          total_sf?: number | null
          total_units_spaces?: number | null
          updated_at?: string | null
          vacancy_pct_yr1?: number | null
          vacancy_pct_yr2?: number | null
          vacancy_pct_yr3?: number | null
          vacancy_pct_yr4?: number | null
          vacancy_pct_yr5?: number | null
          year_built?: number | null
          yr1_contract_override?: number | null
          yr1_ga_override?: number | null
          yr1_insurance_override?: number | null
          yr1_marketing_override?: number | null
          yr1_mgmt_fee_pct?: number | null
          yr1_payroll_override?: number | null
          yr1_repairs_override?: number | null
          yr1_reserve_override?: number | null
          yr1_taxes_override?: number | null
          yr1_utilities_override?: number | null
        }
        Update: {
          bad_debt_pct?: number | null
          bridge_amortization_months?: number | null
          bridge_io_months?: number | null
          bridge_loan_amount?: number | null
          bridge_origination_pts?: number | null
          bridge_rate?: number | null
          bridge_term_months?: number | null
          created_at?: string | null
          created_by?: string | null
          current_ancillary_income?: number | null
          current_gpi?: number | null
          current_lease_income?: number | null
          current_occupancy_revenue?: number | null
          disposition_cost_pct?: number | null
          equity_invested?: number | null
          exit_amortization_years?: number | null
          exit_cap_rate?: number | null
          exit_io_months?: number | null
          exit_lender_name?: string | null
          exit_loan_amount?: number | null
          exit_rate?: number | null
          expense_growth_yr1?: number | null
          expense_growth_yr2?: number | null
          expense_growth_yr3?: number | null
          expense_growth_yr4?: number | null
          expense_growth_yr5?: number | null
          going_in_cap_rate?: number | null
          id?: string
          loan_id?: string
          operating_days_per_year?: number | null
          poh_expense_ratio?: number | null
          poh_rental_income?: number | null
          property_type?: string
          purchase_price?: number | null
          rent_growth_yr1?: number | null
          rent_growth_yr2?: number | null
          rent_growth_yr3?: number | null
          rent_growth_yr4?: number | null
          rent_growth_yr5?: number | null
          rent_roll_upload_id?: string | null
          stabilized_ancillary_income?: number | null
          stabilized_gpi?: number | null
          stabilized_lease_income?: number | null
          stabilized_occupancy_revenue?: number | null
          stabilized_vacancy_pct?: number | null
          status?: string | null
          t12_bad_debt_pct?: number | null
          t12_contract_services?: number | null
          t12_ga?: number | null
          t12_gpi?: number | null
          t12_insurance?: number | null
          t12_marketing?: number | null
          t12_mgmt_fee?: number | null
          t12_payroll?: number | null
          t12_repairs?: number | null
          t12_replacement_reserve?: number | null
          t12_taxes?: number | null
          t12_upload_id?: string | null
          t12_utilities?: number | null
          t12_vacancy_pct?: number | null
          total_sf?: number | null
          total_units_spaces?: number | null
          updated_at?: string | null
          vacancy_pct_yr1?: number | null
          vacancy_pct_yr2?: number | null
          vacancy_pct_yr3?: number | null
          vacancy_pct_yr4?: number | null
          vacancy_pct_yr5?: number | null
          year_built?: number | null
          yr1_contract_override?: number | null
          yr1_ga_override?: number | null
          yr1_insurance_override?: number | null
          yr1_marketing_override?: number | null
          yr1_mgmt_fee_pct?: number | null
          yr1_payroll_override?: number | null
          yr1_repairs_override?: number | null
          yr1_reserve_override?: number | null
          yr1_taxes_override?: number | null
          yr1_utilities_override?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "commercial_underwriting_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: true
            referencedRelation: "loan_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_underwriting_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: true
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_upload_mappings: {
        Row: {
          column_mapping: Json
          created_at: string | null
          created_by: string | null
          id: string
          original_filename: string | null
          parsed_data: Json | null
          row_count: number | null
          underwriting_id: string
          upload_type: string
        }
        Insert: {
          column_mapping: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          original_filename?: string | null
          parsed_data?: Json | null
          row_count?: number | null
          underwriting_id: string
          upload_type: string
        }
        Update: {
          column_mapping?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          original_filename?: string | null
          parsed_data?: Json | null
          row_count?: number | null
          underwriting_id?: string
          upload_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "commercial_upload_mappings_underwriting_id_fkey"
            columns: ["underwriting_id"]
            isOneToOne: false
            referencedRelation: "commercial_underwriting"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_uw_assumptions: {
        Row: {
          bad_debt_pct: number
          created_at: string
          disposition_cost_pct: number
          exit_cap_rate: number
          expense_growth_yr1: number
          expense_growth_yr2: number
          expense_growth_yr3: number
          expense_growth_yr4: number
          expense_growth_yr5: number
          going_in_cap_rate: number
          id: string
          mgmt_fee_pct: number
          property_type: string
          rent_growth_yr1: number
          rent_growth_yr2: number
          rent_growth_yr3: number
          rent_growth_yr4: number
          rent_growth_yr5: number
          stabilized_vacancy_pct: number
          updated_at: string
          vacancy_pct: number
        }
        Insert: {
          bad_debt_pct?: number
          created_at?: string
          disposition_cost_pct?: number
          exit_cap_rate?: number
          expense_growth_yr1?: number
          expense_growth_yr2?: number
          expense_growth_yr3?: number
          expense_growth_yr4?: number
          expense_growth_yr5?: number
          going_in_cap_rate?: number
          id?: string
          mgmt_fee_pct?: number
          property_type: string
          rent_growth_yr1?: number
          rent_growth_yr2?: number
          rent_growth_yr3?: number
          rent_growth_yr4?: number
          rent_growth_yr5?: number
          stabilized_vacancy_pct?: number
          updated_at?: string
          vacancy_pct?: number
        }
        Update: {
          bad_debt_pct?: number
          created_at?: string
          disposition_cost_pct?: number
          exit_cap_rate?: number
          expense_growth_yr1?: number
          expense_growth_yr2?: number
          expense_growth_yr3?: number
          expense_growth_yr4?: number
          expense_growth_yr5?: number
          going_in_cap_rate?: number
          id?: string
          mgmt_fee_pct?: number
          property_type?: string
          rent_growth_yr1?: number
          rent_growth_yr2?: number
          rent_growth_yr3?: number
          rent_growth_yr4?: number
          rent_growth_yr5?: number
          stabilized_vacancy_pct?: number
          updated_at?: string
          vacancy_pct?: number
        }
        Relationships: []
      }
      companies: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          company_type: Database["public"]["Enums"]["company_type_enum"]
          country: string | null
          created_at: string
          email: string | null
          fee_agreement_on_file: boolean | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          phone: string | null
          primary_contact_id: string | null
          state: string | null
          updated_at: string
          website: string | null
          zip: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_type: Database["public"]["Enums"]["company_type_enum"]
          country?: string | null
          created_at?: string
          email?: string | null
          fee_agreement_on_file?: boolean | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          primary_contact_id?: string | null
          state?: string | null
          updated_at?: string
          website?: string | null
          zip?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_type?: Database["public"]["Enums"]["company_type_enum"]
          country?: string | null
          created_at?: string
          email?: string | null
          fee_agreement_on_file?: boolean | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          primary_contact_id?: string | null
          state?: string | null
          updated_at?: string
          website?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_companies_primary_contact"
            columns: ["primary_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_companies_primary_contact"
            columns: ["primary_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts_active"
            referencedColumns: ["id"]
          },
        ]
      }
      condition_template_items: {
        Row: {
          borrower_description: string | null
          category: string
          created_at: string | null
          description: string | null
          due_date_offset_days: number | null
          id: string
          is_critical_path: boolean | null
          name: string
          responsible_party: string | null
          sort_order: number | null
          template_id: string
        }
        Insert: {
          borrower_description?: string | null
          category: string
          created_at?: string | null
          description?: string | null
          due_date_offset_days?: number | null
          id?: string
          is_critical_path?: boolean | null
          name: string
          responsible_party?: string | null
          sort_order?: number | null
          template_id: string
        }
        Update: {
          borrower_description?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          due_date_offset_days?: number | null
          id?: string
          is_critical_path?: boolean | null
          name?: string
          responsible_party?: string | null
          sort_order?: number | null
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "condition_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "condition_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      condition_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_default: boolean | null
          loan_type: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          loan_type?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          loan_type?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "condition_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_audit_log: {
        Row: {
          action: Database["public"]["Enums"]["audit_action_enum"]
          changed_at: string
          changed_by: string | null
          contact_id: string
          context: string | null
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action_enum"]
          changed_at?: string
          changed_by?: string | null
          contact_id: string
          context?: string | null
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action_enum"]
          changed_at?: string
          changed_by?: string | null
          contact_id?: string
          context?: string | null
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_audit_log_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_audit_log_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts_active"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_relationship_types: {
        Row: {
          contact_id: string
          created_at: string
          ended_at: string | null
          id: string
          is_active: boolean | null
          lender_direction: Database["public"]["Enums"]["lender_direction_enum"] | null
          notes: string | null
          relationship_type: Database["public"]["Enums"]["relationship_type_enum"]
          started_at: string
          vendor_type: Database["public"]["Enums"]["vendor_type_enum"] | null
        }
        Insert: {
          contact_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          lender_direction?: Database["public"]["Enums"]["lender_direction_enum"] | null
          notes?: string | null
          relationship_type: Database["public"]["Enums"]["relationship_type_enum"]
          started_at?: string
          vendor_type?: Database["public"]["Enums"]["vendor_type_enum"] | null
        }
        Update: {
          contact_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          lender_direction?: Database["public"]["Enums"]["lender_direction_enum"] | null
          notes?: string | null
          relationship_type?: Database["public"]["Enums"]["relationship_type_enum"]
          started_at?: string
          vendor_type?: Database["public"]["Enums"]["vendor_type_enum"] | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_relationship_types_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_relationship_types_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts_active"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_tags: {
        Row: {
          contact_id: string
          created_at: string
          created_by: string | null
          id: string
          tag: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          tag: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_tags_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_tags_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_tags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_activities: {
        Row: {
          activity_type: string
          completed_at: string | null
          contact_id: string
          created_at: string
          description: string | null
          direction: Database["public"]["Enums"]["activity_direction_enum"] | null
          id: string
          is_completed: boolean | null
          linked_entity_id: string | null
          linked_entity_type: Database["public"]["Enums"]["linked_entity_type_enum"] | null
          metadata: Json | null
          performed_by: string | null
          performed_by_name: string | null
          scheduled_at: string | null
          subject: string | null
        }
        Insert: {
          activity_type: string
          completed_at?: string | null
          contact_id: string
          created_at?: string
          description?: string | null
          direction?: Database["public"]["Enums"]["activity_direction_enum"] | null
          id?: string
          is_completed?: boolean | null
          linked_entity_id?: string | null
          linked_entity_type?: Database["public"]["Enums"]["linked_entity_type_enum"] | null
          metadata?: Json | null
          performed_by?: string | null
          performed_by_name?: string | null
          scheduled_at?: string | null
          subject?: string | null
        }
        Update: {
          activity_type?: string
          completed_at?: string | null
          contact_id?: string
          created_at?: string
          description?: string | null
          direction?: Database["public"]["Enums"]["activity_direction_enum"] | null
          id?: string
          is_completed?: boolean | null
          linked_entity_id?: string | null
          linked_entity_type?: Database["public"]["Enums"]["linked_entity_type_enum"] | null
          metadata?: Json | null
          performed_by?: string | null
          performed_by_name?: string | null
          scheduled_at?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contacts: {
        Row: {
          address_line1: string | null
          assigned_to: string | null
          borrower_id: string | null
          city: string | null
          company_id: string | null
          company_name: string | null
          consent_granted_at: string | null
          contact_type: Database["public"]["Enums"]["crm_contact_type"]
          created_at: string
          deleted_at: string | null
          dnc: boolean | null
          dnc_reason: string | null
          email: string | null
          first_name: string | null
          id: string
          last_contacted_at: string | null
          last_name: string | null
          lifecycle_stage: Database["public"]["Enums"]["lifecycle_stage_enum"] | null
          lifecycle_updated_at: string | null
          linked_investor_id: string | null
          linked_loan_id: string | null
          marketing_consent: boolean | null
          name: string | null
          next_follow_up_date: string | null
          notes: string | null
          phone: string | null
          postmark_contact_id: string | null
          source: Database["public"]["Enums"]["crm_contact_source"] | null
          state: string | null
          status: Database["public"]["Enums"]["crm_contact_status"]
          twilio_contact_id: string | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          address_line1?: string | null
          assigned_to?: string | null
          borrower_id?: string | null
          city?: string | null
          company_id?: string | null
          company_name?: string | null
          consent_granted_at?: string | null
          contact_type?: Database["public"]["Enums"]["crm_contact_type"]
          created_at?: string
          deleted_at?: string | null
          dnc?: boolean | null
          dnc_reason?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_contacted_at?: string | null
          last_name?: string | null
          lifecycle_stage?: Database["public"]["Enums"]["lifecycle_stage_enum"] | null
          lifecycle_updated_at?: string | null
          linked_investor_id?: string | null
          linked_loan_id?: string | null
          marketing_consent?: boolean | null
          name?: string | null
          next_follow_up_date?: string | null
          notes?: string | null
          phone?: string | null
          postmark_contact_id?: string | null
          source?: Database["public"]["Enums"]["crm_contact_source"] | null
          state?: string | null
          status?: Database["public"]["Enums"]["crm_contact_status"]
          twilio_contact_id?: string | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          address_line1?: string | null
          assigned_to?: string | null
          borrower_id?: string | null
          city?: string | null
          company_id?: string | null
          company_name?: string | null
          consent_granted_at?: string | null
          contact_type?: Database["public"]["Enums"]["crm_contact_type"]
          created_at?: string
          deleted_at?: string | null
          dnc?: boolean | null
          dnc_reason?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_contacted_at?: string | null
          last_name?: string | null
          lifecycle_stage?: Database["public"]["Enums"]["lifecycle_stage_enum"] | null
          lifecycle_updated_at?: string | null
          linked_investor_id?: string | null
          linked_loan_id?: string | null
          marketing_consent?: boolean | null
          name?: string | null
          next_follow_up_date?: string | null
          notes?: string | null
          phone?: string | null
          postmark_contact_id?: string | null
          source?: Database["public"]["Enums"]["crm_contact_source"] | null
          state?: string | null
          status?: Database["public"]["Enums"]["crm_contact_status"]
          twilio_contact_id?: string | null
          updated_at?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_linked_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_linked_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers_portal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_linked_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_linked_investor_id_fkey"
            columns: ["linked_investor_id"]
            isOneToOne: false
            referencedRelation: "investors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_linked_loan_id_fkey"
            columns: ["linked_loan_id"]
            isOneToOne: false
            referencedRelation: "loan_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_linked_loan_id_fkey"
            columns: ["linked_loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_emails: {
        Row: {
          attachments: Json | null
          bcc_emails: string[] | null
          body_html: string | null
          body_text: string | null
          cc_emails: string[] | null
          created_at: string
          delivered_at: string | null
          email_template_id: string | null
          from_email: string
          id: string
          linked_borrower_id: string | null
          linked_contact_id: string | null
          linked_investor_id: string | null
          linked_loan_id: string | null
          opened_at: string | null
          postmark_error: string | null
          postmark_message_id: string | null
          postmark_status: string | null
          sent_by: string | null
          sent_by_name: string | null
          subject: string
          template_data: Json | null
          to_email: string
          to_name: string | null
        }
        Insert: {
          attachments?: Json | null
          bcc_emails?: string[] | null
          body_html?: string | null
          body_text?: string | null
          cc_emails?: string[] | null
          created_at?: string
          delivered_at?: string | null
          email_template_id?: string | null
          from_email?: string
          id?: string
          linked_borrower_id?: string | null
          linked_contact_id?: string | null
          linked_investor_id?: string | null
          linked_loan_id?: string | null
          opened_at?: string | null
          postmark_error?: string | null
          postmark_message_id?: string | null
          postmark_status?: string | null
          sent_by?: string | null
          sent_by_name?: string | null
          subject: string
          template_data?: Json | null
          to_email: string
          to_name?: string | null
        }
        Update: {
          attachments?: Json | null
          bcc_emails?: string[] | null
          body_html?: string | null
          body_text?: string | null
          cc_emails?: string[] | null
          created_at?: string
          delivered_at?: string | null
          email_template_id?: string | null
          from_email?: string
          id?: string
          linked_borrower_id?: string | null
          linked_contact_id?: string | null
          linked_investor_id?: string | null
          linked_loan_id?: string | null
          opened_at?: string | null
          postmark_error?: string | null
          postmark_message_id?: string | null
          postmark_status?: string | null
          sent_by?: string | null
          sent_by_name?: string | null
          subject?: string
          template_data?: Json | null
          to_email?: string
          to_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_emails_email_template_id_fkey"
            columns: ["email_template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_emails_linked_borrower_id_fkey"
            columns: ["linked_borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_emails_linked_borrower_id_fkey"
            columns: ["linked_borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers_portal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_emails_linked_borrower_id_fkey"
            columns: ["linked_borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_emails_linked_contact_id_fkey"
            columns: ["linked_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_emails_linked_contact_id_fkey"
            columns: ["linked_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_emails_linked_investor_id_fkey"
            columns: ["linked_investor_id"]
            isOneToOne: false
            referencedRelation: "investors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_emails_linked_loan_id_fkey"
            columns: ["linked_loan_id"]
            isOneToOne: false
            referencedRelation: "loan_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_emails_linked_loan_id_fkey"
            columns: ["linked_loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      dialer_calls: {
        Row: {
          called_at: string
          contact_id: string
          created_at: string
          direction: Database["public"]["Enums"]["call_direction_enum"]
          duration_seconds: number | null
          ended_at: string | null
          id: string
          loan_id: string | null
          notes: string | null
          performed_by: string | null
          recording_url: string | null
          status: Database["public"]["Enums"]["call_status_enum"] | null
          twilio_call_sid: string | null
        }
        Insert: {
          called_at?: string
          contact_id: string
          created_at?: string
          direction: Database["public"]["Enums"]["call_direction_enum"]
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          loan_id?: string | null
          notes?: string | null
          performed_by?: string | null
          recording_url?: string | null
          status?: Database["public"]["Enums"]["call_status_enum"] | null
          twilio_call_sid?: string | null
        }
        Update: {
          called_at?: string
          contact_id?: string
          created_at?: string
          direction?: Database["public"]["Enums"]["call_direction_enum"]
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          loan_id?: string | null
          notes?: string | null
          performed_by?: string | null
          recording_url?: string | null
          status?: Database["public"]["Enums"]["call_status_enum"] | null
          twilio_call_sid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dialer_calls_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dialer_calls_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dialer_calls_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dialer_calls_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dialer_calls_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      distribution_line_items: {
        Row: {
          amount: number
          commitment_id: string
          created_at: string
          distribution_id: string
          distribution_type: string
          id: string
          notes: string | null
          sent_date: string | null
          status: string
          updated_at: string
          wire_reference: string | null
        }
        Insert: {
          amount: number
          commitment_id: string
          created_at?: string
          distribution_id: string
          distribution_type?: string
          id?: string
          notes?: string | null
          sent_date?: string | null
          status?: string
          updated_at?: string
          wire_reference?: string | null
        }
        Update: {
          amount?: number
          commitment_id?: string
          created_at?: string
          distribution_id?: string
          distribution_type?: string
          id?: string
          notes?: string | null
          sent_date?: string | null
          status?: string
          updated_at?: string
          wire_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "distribution_line_items_commitment_id_fkey"
            columns: ["commitment_id"]
            isOneToOne: false
            referencedRelation: "investor_commitments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distribution_line_items_distribution_id_fkey"
            columns: ["distribution_id"]
            isOneToOne: false
            referencedRelation: "distributions"
            referencedColumns: ["id"]
          },
        ]
      }
      distributions: {
        Row: {
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          commitment_id: string | null
          created_at: string
          description: string | null
          distribution_date: string
          distribution_number: number
          distribution_type: string
          fund_id: string
          id: string
          investor_id: string | null
          notes: string | null
          notice_url: string | null
          period_end: string | null
          period_start: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          commitment_id?: string | null
          created_at?: string
          description?: string | null
          distribution_date?: string
          distribution_number: number
          distribution_type?: string
          fund_id: string
          id?: string
          investor_id?: string | null
          notes?: string | null
          notice_url?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          commitment_id?: string | null
          created_at?: string
          description?: string | null
          distribution_date?: string
          distribution_number?: number
          distribution_type?: string
          fund_id?: string
          id?: string
          investor_id?: string | null
          notes?: string | null
          notice_url?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "distributions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributions_commitment_id_fkey"
            columns: ["commitment_id"]
            isOneToOne: false
            referencedRelation: "investor_commitments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributions_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributions_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          description: string | null
          document_type: string | null
          file_name: string
          file_path: string | null
          file_size: number | null
          file_url: string | null
          fund_id: string | null
          id: string
          loan_id: string | null
          mime_type: string | null
          owner_id: string | null
          status: string | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_type?: string | null
          file_name: string
          file_path?: string | null
          file_size?: number | null
          file_url?: string | null
          fund_id?: string | null
          id?: string
          loan_id?: string | null
          mime_type?: string | null
          owner_id?: string | null
          status?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          document_type?: string | null
          file_name?: string
          file_path?: string | null
          file_size?: number | null
          file_url?: string | null
          fund_id?: string | null
          id?: string
          loan_id?: string | null
          mime_type?: string | null
          owner_id?: string | null
          status?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      draw_requests: {
        Row: {
          amount_approved: number | null
          amount_requested: number
          borrower_id: string | null
          completion_pct: number | null
          created_at: string
          description: string | null
          document_urls: string[] | null
          draw_number: number
          id: string
          inspection_date: string | null
          inspector_name: string | null
          loan_id: string
          reviewed_at: string | null
          reviewer_notes: string | null
          status: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          amount_approved?: number | null
          amount_requested: number
          borrower_id?: string | null
          completion_pct?: number | null
          created_at?: string
          description?: string | null
          document_urls?: string[] | null
          draw_number: number
          id?: string
          inspection_date?: string | null
          inspector_name?: string | null
          loan_id: string
          reviewed_at?: string | null
          reviewer_notes?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          amount_approved?: number | null
          amount_requested?: number
          borrower_id?: string | null
          completion_pct?: number | null
          created_at?: string
          description?: string | null
          document_urls?: string[] | null
          draw_number?: number
          id?: string
          inspection_date?: string | null
          inspector_name?: string | null
          loan_id?: string
          reviewed_at?: string | null
          reviewer_notes?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "draw_requests_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_draws_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_draws_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      email_template_versions: {
        Row: {
          change_notes: string | null
          created_at: string
          edited_by: string | null
          html_body_template: string
          id: string
          subject_template: string
          template_id: string
          text_body_template: string | null
          version: number
        }
        Insert: {
          change_notes?: string | null
          created_at?: string
          edited_by?: string | null
          html_body_template: string
          id?: string
          subject_template: string
          template_id: string
          text_body_template?: string | null
          version: number
        }
        Update: {
          change_notes?: string | null
          created_at?: string
          edited_by?: string | null
          html_body_template?: string
          id?: string
          subject_template?: string
          template_id?: string
          text_body_template?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "email_template_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          available_variables: Json
          created_at: string
          display_name: string
          html_body_template: string
          id: string
          is_active: boolean
          last_edited_at: string | null
          last_edited_by: string | null
          notification_type_id: string | null
          preview_data: Json | null
          slug: string
          subject_template: string
          text_body_template: string | null
          updated_at: string
          version: number
        }
        Insert: {
          available_variables?: Json
          created_at?: string
          display_name: string
          html_body_template: string
          id?: string
          is_active?: boolean
          last_edited_at?: string | null
          last_edited_by?: string | null
          notification_type_id?: string | null
          preview_data?: Json | null
          slug: string
          subject_template: string
          text_body_template?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          available_variables?: Json
          created_at?: string
          display_name?: string
          html_body_template?: string
          id?: string
          is_active?: boolean
          last_edited_at?: string | null
          last_edited_by?: string | null
          notification_type_id?: string | null
          preview_data?: Json | null
          slug?: string
          subject_template?: string
          text_body_template?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_notification_type_id_fkey"
            columns: ["notification_type_id"]
            isOneToOne: true
            referencedRelation: "notification_types"
            referencedColumns: ["id"]
          },
        ]
      }
      form_field_registry: {
        Row: {
          created_at: string | null
          form_file_path: string
          form_identifier: string
          id: string
          input_field_name: string
          last_validated_at: string | null
          mismatch_details: string | null
          target_column: string | null
          target_table: string
          updated_at: string | null
          validation_status: string
        }
        Insert: {
          created_at?: string | null
          form_file_path: string
          form_identifier: string
          id?: string
          input_field_name: string
          last_validated_at?: string | null
          mismatch_details?: string | null
          target_column?: string | null
          target_table: string
          updated_at?: string | null
          validation_status?: string
        }
        Update: {
          created_at?: string | null
          form_file_path?: string
          form_identifier?: string
          id?: string
          input_field_name?: string
          last_validated_at?: string | null
          mismatch_details?: string | null
          target_column?: string | null
          target_table?: string
          updated_at?: string | null
          validation_status?: string
        }
        Relationships: []
      }
      funds: {
        Row: {
          bank_account_info: string | null
          carry_pct: number | null
          close_date: string | null
          created_at: string
          created_by: string | null
          current_aum: number | null
          current_size: number | null
          deleted_at: string | null
          description: string | null
          fund_type: string
          gp_commitment: number | null
          hurdle_rate_pct: number | null
          id: string
          inception_date: string | null
          internal_notes: string | null
          irr_target: number | null
          management_fee: number | null
          management_fee_pct: number | null
          name: string
          notes: string | null
          preferred_return: number | null
          preferred_return_pct: number | null
          status: string
          strategy: string | null
          target_size: number | null
          term_years: number | null
          updated_at: string
          vintage_year: number | null
        }
        Insert: {
          bank_account_info?: string | null
          carry_pct?: number | null
          close_date?: string | null
          created_at?: string
          created_by?: string | null
          current_aum?: number | null
          current_size?: number | null
          deleted_at?: string | null
          description?: string | null
          fund_type?: string
          gp_commitment?: number | null
          hurdle_rate_pct?: number | null
          id?: string
          inception_date?: string | null
          internal_notes?: string | null
          irr_target?: number | null
          management_fee?: number | null
          management_fee_pct?: number | null
          name: string
          notes?: string | null
          preferred_return?: number | null
          preferred_return_pct?: number | null
          status?: string
          strategy?: string | null
          target_size?: number | null
          term_years?: number | null
          updated_at?: string
          vintage_year?: number | null
        }
        Update: {
          bank_account_info?: string | null
          carry_pct?: number | null
          close_date?: string | null
          created_at?: string
          created_by?: string | null
          current_aum?: number | null
          current_size?: number | null
          deleted_at?: string | null
          description?: string | null
          fund_type?: string
          gp_commitment?: number | null
          hurdle_rate_pct?: number | null
          id?: string
          inception_date?: string | null
          internal_notes?: string | null
          irr_target?: number | null
          management_fee?: number | null
          management_fee_pct?: number | null
          name?: string
          notes?: string | null
          preferred_return?: number | null
          preferred_return_pct?: number | null
          status?: string
          strategy?: string | null
          target_size?: number | null
          term_years?: number | null
          updated_at?: string
          vintage_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "funds_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      investing_entities: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          country: string | null
          created_at: string
          ein: string | null
          entity_name: string
          entity_type: string
          formation_doc_url: string | null
          id: string
          investor_id: string
          notes: string | null
          operating_agreement_url: string | null
          other_doc_urls: string[] | null
          state: string | null
          state_of_formation: string | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          ein?: string | null
          entity_name: string
          entity_type: string
          formation_doc_url?: string | null
          id?: string
          investor_id: string
          notes?: string | null
          operating_agreement_url?: string | null
          other_doc_urls?: string[] | null
          state?: string | null
          state_of_formation?: string | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          ein?: string | null
          entity_name?: string
          entity_type?: string
          formation_doc_url?: string | null
          id?: string
          investor_id?: string
          notes?: string | null
          operating_agreement_url?: string | null
          other_doc_urls?: string[] | null
          state?: string | null
          state_of_formation?: string | null
          updated_at?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investing_entities_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_commitments: {
        Row: {
          commitment_amount: number
          commitment_date: string | null
          created_at: string
          effective_date: string | null
          entity_id: string | null
          fund_id: string
          funded_amount: number
          id: string
          investor_id: string
          notes: string | null
          side_letter_url: string | null
          status: string
          subscription_doc_url: string | null
          unfunded_amount: number | null
          updated_at: string
        }
        Insert: {
          commitment_amount: number
          commitment_date?: string | null
          created_at?: string
          effective_date?: string | null
          entity_id?: string | null
          fund_id: string
          funded_amount?: number
          id?: string
          investor_id: string
          notes?: string | null
          side_letter_url?: string | null
          status?: string
          subscription_doc_url?: string | null
          unfunded_amount?: number | null
          updated_at?: string
        }
        Update: {
          commitment_amount?: number
          commitment_date?: string | null
          created_at?: string
          effective_date?: string | null
          entity_id?: string | null
          fund_id?: string
          funded_amount?: number
          id?: string
          investor_id?: string
          notes?: string | null
          side_letter_url?: string | null
          status?: string
          subscription_doc_url?: string | null
          unfunded_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "investor_commitments_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "investing_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_commitments_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "investing_entities_portal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_commitments_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_commitments_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors"
            referencedColumns: ["id"]
          },
        ]
      }
      investors: {
        Row: {
          accreditation_status: string
          accreditation_verified_at: string | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          notes: string | null
          phone: string | null
          state: string | null
          updated_at: string
          user_id: string | null
          zip: string | null
        }
        Insert: {
          accreditation_status?: string
          accreditation_verified_at?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string | null
          zip?: string | null
        }
        Update: {
          accreditation_status?: string
          accreditation_verified_at?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      loan_activity_log: {
        Row: {
          action: string
          created_at: string
          description: string
          id: string
          loan_id: string
          metadata: Json | null
          performed_by: string | null
        }
        Insert: {
          action: string
          created_at?: string
          description: string
          id?: string
          loan_id: string
          metadata?: Json | null
          performed_by?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          description?: string
          id?: string
          loan_id?: string
          metadata?: Json | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loan_activity_log_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_activity_log_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_comments: {
        Row: {
          author_id: string
          author_name: string | null
          comment: string
          created_at: string
          edited_at: string | null
          id: string
          is_edited: boolean
          is_internal: boolean
          loan_id: string
          mentions: string[] | null
          parent_comment_id: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          author_name?: string | null
          comment: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_edited?: boolean
          is_internal?: boolean
          loan_id: string
          mentions?: string[] | null
          parent_comment_id?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          author_name?: string | null
          comment?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_edited?: boolean
          is_internal?: boolean
          loan_id?: string
          mentions?: string[] | null
          parent_comment_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_comments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_comments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "loan_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_condition_comments: {
        Row: {
          author_id: string | null
          author_name: string | null
          comment: string
          condition_id: string
          created_at: string
          edited_at: string | null
          id: string
          is_edited: boolean
          is_internal: boolean
          loan_id: string
          mentions: string[] | null
          parent_comment_id: string | null
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          comment: string
          condition_id: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_edited?: boolean
          is_internal?: boolean
          loan_id: string
          mentions?: string[] | null
          parent_comment_id?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          comment?: string
          condition_id?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_edited?: boolean
          is_internal?: boolean
          loan_id?: string
          mentions?: string[] | null
          parent_comment_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_condition_comments_condition_id_fkey"
            columns: ["condition_id"]
            isOneToOne: false
            referencedRelation: "loan_conditions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_condition_comments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_condition_comments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_condition_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "loan_condition_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_condition_documents: {
        Row: {
          condition_id: string
          created_at: string | null
          document_id: string
          id: string
        }
        Insert: {
          condition_id: string
          created_at?: string | null
          document_id: string
          id?: string
        }
        Update: {
          condition_id?: string
          created_at?: string | null
          document_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_condition_documents_condition_id_fkey"
            columns: ["condition_id"]
            isOneToOne: false
            referencedRelation: "loan_conditions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_condition_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_condition_templates: {
        Row: {
          applies_to_commercial: boolean | null
          applies_to_dscr: boolean | null
          applies_to_guc: boolean | null
          applies_to_rtl: boolean | null
          applies_to_transactional: boolean | null
          borrower_description: string | null
          category: Database["public"]["Enums"]["condition_category"]
          condition_name: string
          created_at: string
          critical_path_item: boolean | null
          id: string
          internal_description: string | null
          is_active: boolean | null
          required_stage: Database["public"]["Enums"]["condition_stage"]
          responsible_party: string | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          applies_to_commercial?: boolean | null
          applies_to_dscr?: boolean | null
          applies_to_guc?: boolean | null
          applies_to_rtl?: boolean | null
          applies_to_transactional?: boolean | null
          borrower_description?: string | null
          category: Database["public"]["Enums"]["condition_category"]
          condition_name: string
          created_at?: string
          critical_path_item?: boolean | null
          id?: string
          internal_description?: string | null
          is_active?: boolean | null
          required_stage?: Database["public"]["Enums"]["condition_stage"]
          responsible_party?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          applies_to_commercial?: boolean | null
          applies_to_dscr?: boolean | null
          applies_to_guc?: boolean | null
          applies_to_rtl?: boolean | null
          applies_to_transactional?: boolean | null
          borrower_description?: string | null
          category?: Database["public"]["Enums"]["condition_category"]
          condition_name?: string
          created_at?: string
          critical_path_item?: boolean | null
          id?: string
          internal_description?: string | null
          is_active?: boolean | null
          required_stage?: Database["public"]["Enums"]["condition_stage"]
          responsible_party?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      loan_conditions: {
        Row: {
          approved_date: string | null
          assigned_to: string | null
          borrower_description: string | null
          category: Database["public"]["Enums"]["condition_category"]
          condition_name: string
          created_at: string
          critical_path_item: boolean | null
          document_url: string | null
          document_urls: string[] | null
          due_date: string | null
          id: string
          internal_description: string | null
          is_required: boolean | null
          loan_id: string
          notes: string | null
          received_date: string | null
          rejection_reason: string | null
          required_stage: Database["public"]["Enums"]["condition_stage"]
          responsible_party: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sort_order: number | null
          status: Database["public"]["Enums"]["condition_status"]
          submitted_at: string | null
          template_id: string | null
          updated_at: string
        }
        Insert: {
          approved_date?: string | null
          assigned_to?: string | null
          borrower_description?: string | null
          category: Database["public"]["Enums"]["condition_category"]
          condition_name: string
          created_at?: string
          critical_path_item?: boolean | null
          document_url?: string | null
          document_urls?: string[] | null
          due_date?: string | null
          id?: string
          internal_description?: string | null
          is_required?: boolean | null
          loan_id: string
          notes?: string | null
          received_date?: string | null
          rejection_reason?: string | null
          required_stage?: Database["public"]["Enums"]["condition_stage"]
          responsible_party?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sort_order?: number | null
          status?: Database["public"]["Enums"]["condition_status"]
          submitted_at?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          approved_date?: string | null
          assigned_to?: string | null
          borrower_description?: string | null
          category?: Database["public"]["Enums"]["condition_category"]
          condition_name?: string
          created_at?: string
          critical_path_item?: boolean | null
          document_url?: string | null
          document_urls?: string[] | null
          due_date?: string | null
          id?: string
          internal_description?: string | null
          is_required?: boolean | null
          loan_id?: string
          notes?: string | null
          received_date?: string | null
          rejection_reason?: string | null
          required_stage?: Database["public"]["Enums"]["condition_stage"]
          responsible_party?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sort_order?: number | null
          status?: Database["public"]["Enums"]["condition_status"]
          submitted_at?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_conditions_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_conditions_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_conditions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "loan_condition_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_documents: {
        Row: {
          condition_id: string | null
          created_at: string
          document_name: string
          document_type: string | null
          file_size_bytes: number | null
          file_url: string
          id: string
          loan_id: string
          mime_type: string | null
          notes: string | null
          uploaded_by: string | null
        }
        Insert: {
          condition_id?: string | null
          created_at?: string
          document_name: string
          document_type?: string | null
          file_size_bytes?: number | null
          file_url: string
          id?: string
          loan_id: string
          mime_type?: string | null
          notes?: string | null
          uploaded_by?: string | null
        }
        Update: {
          condition_id?: string | null
          created_at?: string
          document_name?: string
          document_type?: string | null
          file_size_bytes?: number | null
          file_url?: string
          id?: string
          loan_id?: string
          mime_type?: string | null
          notes?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loan_documents_condition_id_fkey"
            columns: ["condition_id"]
            isOneToOne: false
            referencedRelation: "loan_conditions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_documents_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_documents_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          interest_amount: number | null
          late_fee: number | null
          loan_id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
          principal_amount: number | null
          reference_number: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          interest_amount?: number | null
          late_fee?: number | null
          loan_id: string
          notes?: string | null
          payment_date: string
          payment_method?: string | null
          principal_amount?: number | null
          reference_number?: string | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          interest_amount?: number | null
          late_fee?: number | null
          loan_id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          principal_amount?: number | null
          reference_number?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_payments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_payments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_underwriting_versions: {
        Row: {
          calculator_inputs: Json
          calculator_outputs: Json
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          label: string | null
          loan_id: string
          notes: string | null
          status: string
          version_number: number
        }
        Insert: {
          calculator_inputs?: Json
          calculator_outputs?: Json
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          label?: string | null
          loan_id: string
          notes?: string | null
          status?: string
          version_number?: number
        }
        Update: {
          calculator_inputs?: Json
          calculator_outputs?: Json
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          label?: string | null
          loan_id?: string
          notes?: string | null
          status?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "loan_underwriting_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_underwriting_versions_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_underwriting_versions_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          ach_autopull_active: boolean | null
          actual_close_date: string | null
          after_repair_value: number | null
          application_date: string | null
          appraised_value: number | null
          approval_date: string | null
          arv: number | null
          as_is_value: number | null
          borrower_entity_id: string | null
          borrower_id: string | null
          broker_contact_id: string | null
          broker_fee_amount: number | null
          broker_fee_pct: number | null
          broker_sourced: boolean | null
          capital_partner: string | null
          clear_to_close_date: string | null
          closer_id: string | null
          closing_attorney_name: string | null
          closing_date: string | null
          co_borrower_name: string | null
          created_at: string
          default_rate: number | null
          deleted_at: string | null
          dscr_ratio: number | null
          escrow_holdback: number | null
          expected_close_date: string | null
          extension_fee_pct: number | null
          extension_maturity_date: string | null
          extension_options: string | null
          extension_term_months: number | null
          file_complete_date: string | null
          first_payment_date: string | null
          flood_zone_type: string | null
          funding_date: string | null
          funding_source: string | null
          has_co_borrower: boolean | null
          id: string
          insurance_agent_contact: string | null
          insurance_agent_email: string | null
          insurance_agent_phone: string | null
          insurance_company_name: string | null
          interest_rate: number | null
          interest_reserve: number | null
          internal_notes: string | null
          is_in_flood_zone: boolean | null
          is_short_term_rental: boolean | null
          legal_fee: number | null
          loan_amount: number | null
          loan_number: string | null
          loan_term_months: number | null
          ltarv: number | null
          ltv: number | null
          maturity_date: string | null
          monthly_payment: number | null
          next_action: string | null
          note_rate: number | null
          note_sold: boolean | null
          note_sold_date: string | null
          note_sold_to: string | null
          notes: string | null
          number_of_units: number | null
          origination_date: string | null
          origination_fee: number | null
          origination_fee_amount: number | null
          origination_fee_pct: number | null
          originator: string | null
          originator_id: string | null
          parcel_id: string | null
          payoff_date: string | null
          points: number | null
          prepayment_penalty_months: number | null
          prepayment_terms: string | null
          priority: string | null
          processing_fee: number | null
          processor: string | null
          processor_id: string | null
          property_address: string | null
          property_address_line1: string | null
          property_address_line2: string | null
          property_city: string | null
          property_county: string | null
          property_state: string | null
          property_type: Database["public"]["Enums"]["property_type"] | null
          property_zip: string | null
          purchase_price: number | null
          purpose: Database["public"]["Enums"]["loan_purpose"]
          rehab_budget: number | null
          rehab_holdback: number | null
          salesforce_opportunity_id: string | null
          servicing_platform: string | null
          stage: Database["public"]["Enums"]["loan_status"]
          stage_history: Json | null
          stage_updated_at: string | null
          status: Database["public"]["Enums"]["loan_status"]
          title_company_contact: string | null
          title_company_email: string | null
          title_company_name: string | null
          title_company_phone: string | null
          total_loan_amount: number | null
          type: Database["public"]["Enums"]["loan_type"]
          underwriter: string | null
          underwriter_id: string | null
          updated_at: string
        }
        Insert: {
          ach_autopull_active?: boolean | null
          actual_close_date?: string | null
          after_repair_value?: number | null
          application_date?: string | null
          appraised_value?: number | null
          approval_date?: string | null
          arv?: number | null
          as_is_value?: number | null
          borrower_entity_id?: string | null
          borrower_id?: string | null
          broker_contact_id?: string | null
          broker_fee_amount?: number | null
          broker_fee_pct?: number | null
          broker_sourced?: boolean | null
          capital_partner?: string | null
          clear_to_close_date?: string | null
          closer_id?: string | null
          closing_attorney_name?: string | null
          closing_date?: string | null
          co_borrower_name?: string | null
          created_at?: string
          default_rate?: number | null
          deleted_at?: string | null
          dscr_ratio?: number | null
          escrow_holdback?: number | null
          expected_close_date?: string | null
          extension_fee_pct?: number | null
          extension_maturity_date?: string | null
          extension_options?: string | null
          extension_term_months?: number | null
          file_complete_date?: string | null
          first_payment_date?: string | null
          flood_zone_type?: string | null
          funding_date?: string | null
          funding_source?: string | null
          has_co_borrower?: boolean | null
          id?: string
          insurance_agent_contact?: string | null
          insurance_agent_email?: string | null
          insurance_agent_phone?: string | null
          insurance_company_name?: string | null
          interest_rate?: number | null
          interest_reserve?: number | null
          internal_notes?: string | null
          is_in_flood_zone?: boolean | null
          is_short_term_rental?: boolean | null
          legal_fee?: number | null
          loan_amount?: number | null
          loan_number?: string | null
          loan_term_months?: number | null
          ltarv?: number | null
          ltv?: number | null
          maturity_date?: string | null
          monthly_payment?: number | null
          next_action?: string | null
          note_rate?: number | null
          note_sold?: boolean | null
          note_sold_date?: string | null
          note_sold_to?: string | null
          notes?: string | null
          number_of_units?: number | null
          origination_date?: string | null
          origination_fee?: number | null
          origination_fee_amount?: number | null
          origination_fee_pct?: number | null
          originator?: string | null
          originator_id?: string | null
          parcel_id?: string | null
          payoff_date?: string | null
          points?: number | null
          prepayment_penalty_months?: number | null
          prepayment_terms?: string | null
          priority?: string | null
          processing_fee?: number | null
          processor?: string | null
          processor_id?: string | null
          property_address?: string | null
          property_address_line1?: string | null
          property_address_line2?: string | null
          property_city?: string | null
          property_county?: string | null
          property_state?: string | null
          property_type?: Database["public"]["Enums"]["property_type"] | null
          property_zip?: string | null
          purchase_price?: number | null
          purpose?: Database["public"]["Enums"]["loan_purpose"]
          rehab_budget?: number | null
          rehab_holdback?: number | null
          salesforce_opportunity_id?: string | null
          servicing_platform?: string | null
          stage?: Database["public"]["Enums"]["loan_status"]
          stage_history?: Json | null
          stage_updated_at?: string | null
          status?: Database["public"]["Enums"]["loan_status"]
          title_company_contact?: string | null
          title_company_email?: string | null
          title_company_name?: string | null
          title_company_phone?: string | null
          total_loan_amount?: number | null
          type?: Database["public"]["Enums"]["loan_type"]
          underwriter?: string | null
          underwriter_id?: string | null
          updated_at?: string
        }
        Update: {
          ach_autopull_active?: boolean | null
          actual_close_date?: string | null
          after_repair_value?: number | null
          application_date?: string | null
          appraised_value?: number | null
          approval_date?: string | null
          arv?: number | null
          as_is_value?: number | null
          borrower_entity_id?: string | null
          borrower_id?: string | null
          broker_contact_id?: string | null
          broker_fee_amount?: number | null
          broker_fee_pct?: number | null
          broker_sourced?: boolean | null
          capital_partner?: string | null
          clear_to_close_date?: string | null
          closer_id?: string | null
          closing_attorney_name?: string | null
          closing_date?: string | null
          co_borrower_name?: string | null
          created_at?: string
          default_rate?: number | null
          deleted_at?: string | null
          dscr_ratio?: number | null
          escrow_holdback?: number | null
          expected_close_date?: string | null
          extension_fee_pct?: number | null
          extension_maturity_date?: string | null
          extension_options?: string | null
          extension_term_months?: number | null
          file_complete_date?: string | null
          first_payment_date?: string | null
          flood_zone_type?: string | null
          funding_date?: string | null
          funding_source?: string | null
          has_co_borrower?: boolean | null
          id?: string
          insurance_agent_contact?: string | null
          insurance_agent_email?: string | null
          insurance_agent_phone?: string | null
          insurance_company_name?: string | null
          interest_rate?: number | null
          interest_reserve?: number | null
          internal_notes?: string | null
          is_in_flood_zone?: boolean | null
          is_short_term_rental?: boolean | null
          legal_fee?: number | null
          loan_amount?: number | null
          loan_number?: string | null
          loan_term_months?: number | null
          ltarv?: number | null
          ltv?: number | null
          maturity_date?: string | null
          monthly_payment?: number | null
          next_action?: string | null
          note_rate?: number | null
          note_sold?: boolean | null
          note_sold_date?: string | null
          note_sold_to?: string | null
          notes?: string | null
          number_of_units?: number | null
          origination_date?: string | null
          origination_fee?: number | null
          origination_fee_amount?: number | null
          origination_fee_pct?: number | null
          originator?: string | null
          originator_id?: string | null
          parcel_id?: string | null
          payoff_date?: string | null
          points?: number | null
          prepayment_penalty_months?: number | null
          prepayment_terms?: string | null
          priority?: string | null
          processing_fee?: number | null
          processor?: string | null
          processor_id?: string | null
          property_address?: string | null
          property_address_line1?: string | null
          property_address_line2?: string | null
          property_city?: string | null
          property_county?: string | null
          property_state?: string | null
          property_type?: Database["public"]["Enums"]["property_type"] | null
          property_zip?: string | null
          purchase_price?: number | null
          purpose?: Database["public"]["Enums"]["loan_purpose"]
          rehab_budget?: number | null
          rehab_holdback?: number | null
          salesforce_opportunity_id?: string | null
          servicing_platform?: string | null
          stage?: Database["public"]["Enums"]["loan_status"]
          stage_history?: Json | null
          stage_updated_at?: string | null
          status?: Database["public"]["Enums"]["loan_status"]
          title_company_contact?: string | null
          title_company_email?: string | null
          title_company_name?: string | null
          title_company_phone?: string | null
          total_loan_amount?: number | null
          type?: Database["public"]["Enums"]["loan_type"]
          underwriter?: string | null
          underwriter_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_borrower_entity_id_fkey"
            columns: ["borrower_entity_id"]
            isOneToOne: false
            referencedRelation: "borrower_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_broker_contact_id_fkey"
            columns: ["broker_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_broker_contact_id_fkey"
            columns: ["broker_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers_portal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_closer_id_fkey"
            columns: ["closer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_originator_id_fkey"
            columns: ["originator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_processor_id_fkey"
            columns: ["processor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_underwriter_id_fkey"
            columns: ["underwriter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          audience_rules: Json | null
          campaign_type: Database["public"]["Enums"]["campaign_type_enum"]
          created_at: string
          created_by: string | null
          id: string
          name: string
          status: Database["public"]["Enums"]["campaign_status_enum"] | null
          updated_at: string
        }
        Insert: {
          audience_rules?: Json | null
          campaign_type: Database["public"]["Enums"]["campaign_type_enum"]
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          status?: Database["public"]["Enums"]["campaign_status_enum"] | null
          updated_at?: string
        }
        Update: {
          audience_rules?: Json | null
          campaign_type?: Database["public"]["Enums"]["campaign_type_enum"]
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["campaign_status_enum"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          location: string | null
          name: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          location?: string | null
          name: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          location?: string | null
          name?: string
        }
        Relationships: []
      }
      notification_dispatch_log: {
        Row: {
          channel: string
          created_at: string
          id: string
          notification_id: string | null
          postmark_error: string | null
          postmark_message_id: string | null
          postmark_status: string | null
          recipient_email: string | null
          status: string
          template_alias: string | null
          template_data: Json | null
          user_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          id?: string
          notification_id?: string | null
          postmark_error?: string | null
          postmark_message_id?: string | null
          postmark_status?: string | null
          recipient_email?: string | null
          status?: string
          template_alias?: string | null
          template_data?: Json | null
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          notification_id?: string | null
          postmark_error?: string | null
          postmark_message_id?: string | null
          postmark_status?: string | null
          recipient_email?: string | null
          status?: string
          template_alias?: string | null
          template_data?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_dispatch_log_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_enabled: boolean
          id: string
          in_app_enabled: boolean
          notification_type_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          notification_type_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          notification_type_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_notification_type_id_fkey"
            columns: ["notification_type_id"]
            isOneToOne: false
            referencedRelation: "notification_types"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_types: {
        Row: {
          applicable_roles: string[]
          category: string
          created_at: string
          default_email_enabled: boolean
          default_in_app_enabled: boolean
          default_priority: string
          description: string | null
          display_name: string
          email_body_template: string | null
          email_subject_template: string | null
          id: string
          is_active: boolean
          last_template_edit_at: string | null
          last_template_edit_by: string | null
          postmark_template_alias: string | null
          slug: string
          sort_order: number
          template_variables: string[] | null
        }
        Insert: {
          applicable_roles?: string[]
          category: string
          created_at?: string
          default_email_enabled?: boolean
          default_in_app_enabled?: boolean
          default_priority?: string
          description?: string | null
          display_name: string
          email_body_template?: string | null
          email_subject_template?: string | null
          id?: string
          is_active?: boolean
          last_template_edit_at?: string | null
          last_template_edit_by?: string | null
          postmark_template_alias?: string | null
          slug: string
          sort_order?: number
          template_variables?: string[] | null
        }
        Update: {
          applicable_roles?: string[]
          category?: string
          created_at?: string
          default_email_enabled?: boolean
          default_in_app_enabled?: boolean
          default_priority?: string
          description?: string | null
          display_name?: string
          email_body_template?: string | null
          email_subject_template?: string | null
          id?: string
          is_active?: boolean
          last_template_edit_at?: string | null
          last_template_edit_by?: string | null
          postmark_template_alias?: string | null
          slug?: string
          sort_order?: number
          template_variables?: string[] | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          archived_at: string | null
          body: string | null
          created_at: string
          email_message_id: string | null
          email_sent: boolean
          email_sent_at: string | null
          entity_id: string | null
          entity_label: string | null
          entity_type: string | null
          id: string
          is_archived: boolean
          is_read: boolean
          notification_slug: string
          notification_type_id: string | null
          priority: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          archived_at?: string | null
          body?: string | null
          created_at?: string
          email_message_id?: string | null
          email_sent?: boolean
          email_sent_at?: string | null
          entity_id?: string | null
          entity_label?: string | null
          entity_type?: string | null
          id?: string
          is_archived?: boolean
          is_read?: boolean
          notification_slug: string
          notification_type_id?: string | null
          priority?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          archived_at?: string | null
          body?: string | null
          created_at?: string
          email_message_id?: string | null
          email_sent?: boolean
          email_sent_at?: string | null
          entity_id?: string | null
          entity_label?: string | null
          entity_type?: string | null
          id?: string
          is_archived?: boolean
          is_read?: boolean
          notification_slug?: string
          notification_type_id?: string | null
          priority?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_notification_type_id_fkey"
            columns: ["notification_type_id"]
            isOneToOne: false
            referencedRelation: "notification_types"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_project_comments: {
        Row: {
          author_id: string | null
          author_name: string | null
          comment: string
          comment_type: string
          created_at: string | null
          edited_at: string | null
          id: string
          is_edited: boolean
          mentions: string[] | null
          project_id: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          comment: string
          comment_type?: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_edited?: boolean
          mentions?: string[] | null
          project_id: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          comment?: string
          comment_type?: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_edited?: boolean
          mentions?: string[] | null
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ops_project_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ops_project_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ops_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_project_notes: {
        Row: {
          author_id: string | null
          author_name: string | null
          created_at: string | null
          id: string
          note: string
          project_id: string | null
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          created_at?: string | null
          id?: string
          note: string
          project_id?: string | null
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          created_at?: string | null
          id?: string
          note?: string
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ops_project_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ops_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_projects: {
        Row: {
          assigned_to: string | null
          category: string
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          latest_update: string | null
          owner: string
          priority: string
          project_name: string
          started_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          category: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          latest_update?: string | null
          owner: string
          priority?: string
          project_name: string
          started_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          latest_update?: string | null
          owner?: string
          priority?: string
          project_name?: string
          started_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ops_projects_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ops_projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_task_comments: {
        Row: {
          author_id: string | null
          author_name: string | null
          comment: string
          comment_type: string
          created_at: string | null
          edited_at: string | null
          id: string
          is_edited: boolean
          mentions: string[] | null
          task_id: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          comment: string
          comment_type?: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_edited?: boolean
          mentions?: string[] | null
          task_id: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          comment?: string
          comment_type?: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_edited?: boolean
          mentions?: string[] | null
          task_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ops_task_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ops_task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "ops_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_tasks: {
        Row: {
          assigned_to: string | null
          assigned_to_name: string | null
          category: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          is_active_recurrence: boolean | null
          is_recurring: boolean | null
          linked_entity_id: string | null
          linked_entity_label: string | null
          linked_entity_type: string | null
          next_recurrence_date: string | null
          parent_task_id: string | null
          priority: string
          project_id: string | null
          recurrence_day_of_month: number | null
          recurrence_day_of_week: number | null
          recurrence_end_date: string | null
          recurrence_pattern: string | null
          recurring_series_id: string | null
          source_task_id: string | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          assigned_to_name?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_active_recurrence?: boolean | null
          is_recurring?: boolean | null
          linked_entity_id?: string | null
          linked_entity_label?: string | null
          linked_entity_type?: string | null
          next_recurrence_date?: string | null
          parent_task_id?: string | null
          priority?: string
          project_id?: string | null
          recurrence_day_of_month?: number | null
          recurrence_day_of_week?: number | null
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          recurring_series_id?: string | null
          source_task_id?: string | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          assigned_to_name?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_active_recurrence?: boolean | null
          is_recurring?: boolean | null
          linked_entity_id?: string | null
          linked_entity_label?: string | null
          linked_entity_type?: string | null
          next_recurrence_date?: string | null
          parent_task_id?: string | null
          priority?: string
          project_id?: string | null
          recurrence_day_of_month?: number | null
          recurrence_day_of_week?: number | null
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          recurring_series_id?: string | null
          source_task_id?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ops_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ops_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ops_tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "ops_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ops_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ops_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ops_tasks_source_task_id_fkey"
            columns: ["source_task_id"]
            isOneToOne: false
            referencedRelation: "ops_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activation_status: string | null
          allowed_roles: string[] | null
          avatar_url: string | null
          company_name: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          location: string | null
          name: string | null
          phone: string | null
          role: string | null
        }
        Insert: {
          activation_status?: string | null
          allowed_roles?: string[] | null
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          location?: string | null
          name?: string | null
          phone?: string | null
          role?: string | null
        }
        Update: {
          activation_status?: string | null
          allowed_roles?: string[] | null
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          location?: string | null
          name?: string | null
          phone?: string | null
          role?: string | null
        }
        Relationships: []
      }
      site_company_info: {
        Row: {
          about_description: string | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          company_name: string
          email: string | null
          founded_year: number | null
          id: string
          investor_login_url: string | null
          investor_signup_url: string | null
          logo_url: string | null
          mission_statement: string | null
          phone: string | null
          social_links: Json | null
          state: string | null
          tagline: string | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          about_description?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_name?: string
          email?: string | null
          founded_year?: number | null
          id?: string
          investor_login_url?: string | null
          investor_signup_url?: string | null
          logo_url?: string | null
          mission_statement?: string | null
          phone?: string | null
          social_links?: Json | null
          state?: string | null
          tagline?: string | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          about_description?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_name?: string
          email?: string | null
          founded_year?: number | null
          id?: string
          investor_login_url?: string | null
          investor_signup_url?: string | null
          logo_url?: string | null
          mission_statement?: string | null
          phone?: string | null
          social_links?: Json | null
          state?: string | null
          tagline?: string | null
          updated_at?: string
          zip?: string | null
        }
        Relationships: []
      }
      site_insights: {
        Row: {
          body_content: string | null
          created_at: string
          detail_page_url: string | null
          excerpt: string | null
          id: string
          is_published: boolean
          published_date: string | null
          slug: string
          sort_order: number
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body_content?: string | null
          created_at?: string
          detail_page_url?: string | null
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_date?: string | null
          slug: string
          sort_order?: number
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body_content?: string | null
          created_at?: string
          detail_page_url?: string | null
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_date?: string | null
          slug?: string
          sort_order?: number
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_loan_programs: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          faqs: Json | null
          features: Json | null
          id: string
          is_published: boolean
          parameters: Json | null
          program_key: string
          sort_order: number
          tagline: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          faqs?: Json | null
          features?: Json | null
          id?: string
          is_published?: boolean
          parameters?: Json | null
          program_key: string
          sort_order?: number
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          faqs?: Json | null
          features?: Json | null
          id?: string
          is_published?: boolean
          parameters?: Json | null
          program_key?: string
          sort_order?: number
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_navigation: {
        Row: {
          created_at: string
          id: string
          is_published: boolean
          label: string
          menu_location: string
          parent_id: string | null
          sort_order: number
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_published?: boolean
          label: string
          menu_location?: string
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_published?: boolean
          label?: string
          menu_location?: string
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_navigation_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "site_navigation"
            referencedColumns: ["id"]
          },
        ]
      }
      site_page_sections: {
        Row: {
          body_text: string | null
          created_at: string
          cta_text: string | null
          cta_url: string | null
          heading: string | null
          id: string
          image_url: string | null
          is_published: boolean
          metadata: Json | null
          page_slug: string
          section_key: string
          sort_order: number
          subheading: string | null
          updated_at: string
        }
        Insert: {
          body_text?: string | null
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          heading?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          metadata?: Json | null
          page_slug: string
          section_key: string
          sort_order?: number
          subheading?: string | null
          updated_at?: string
        }
        Update: {
          body_text?: string | null
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          heading?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          metadata?: Json | null
          page_slug?: string
          section_key?: string
          sort_order?: number
          subheading?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_portfolio_properties: {
        Row: {
          created_at: string
          description: string | null
          detail_page_url: string | null
          id: string
          image_url: string | null
          is_published: boolean
          location: string
          metadata: Json | null
          name: string
          property_type: string | null
          slug: string
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          detail_page_url?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          location: string
          metadata?: Json | null
          name: string
          property_type?: string | null
          slug: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          detail_page_url?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          location?: string
          metadata?: Json | null
          name?: string
          property_type?: string | null
          slug?: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_stats: {
        Row: {
          created_at: string
          display_value: string
          id: string
          label: string
          page_slug: string
          sort_order: number
          stat_key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_value: string
          id?: string
          label: string
          page_slug?: string
          sort_order?: number
          stat_key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_value?: string
          id?: string
          label?: string
          page_slug?: string
          sort_order?: number
          stat_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_team_members: {
        Row: {
          bio: string | null
          created_at: string
          department: string
          headshot_url: string | null
          id: string
          is_published: boolean
          name: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          department?: string
          headshot_url?: string | null
          id?: string
          is_published?: boolean
          name: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          department?: string
          headshot_url?: string | null
          id?: string
          is_published?: boolean
          name?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_testimonials: {
        Row: {
          author_name: string
          created_at: string
          id: string
          is_featured: boolean
          is_published: boolean
          quote: string
          rating: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          author_name: string
          created_at?: string
          id?: string
          is_featured?: boolean
          is_published?: boolean
          quote: string
          rating?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          author_name?: string
          created_at?: string
          id?: string
          is_featured?: boolean
          is_published?: boolean
          quote?: string
          rating?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      site_values: {
        Row: {
          created_at: string
          description: string | null
          icon_identifier: string | null
          id: string
          is_published: boolean
          sort_order: number
          title: string
          updated_at: string
          value_type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon_identifier?: string | null
          id?: string
          is_published?: boolean
          sort_order?: number
          title: string
          updated_at?: string
          value_type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon_identifier?: string | null
          id?: string
          is_published?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
          value_type?: string
        }
        Relationships: []
      }
      t12_field_mappings: {
        Row: {
          created_at: string | null
          exclusion_reason: string | null
          id: string
          is_excluded: boolean | null
          mapped_category: string
          mapped_subcategory: string | null
          t12_line_item_id: string
          t12_upload_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          exclusion_reason?: string | null
          id?: string
          is_excluded?: boolean | null
          mapped_category: string
          mapped_subcategory?: string | null
          t12_line_item_id: string
          t12_upload_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          exclusion_reason?: string | null
          id?: string
          is_excluded?: boolean | null
          mapped_category?: string
          mapped_subcategory?: string | null
          t12_line_item_id?: string
          t12_upload_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "t12_field_mappings_t12_line_item_id_fkey"
            columns: ["t12_line_item_id"]
            isOneToOne: false
            referencedRelation: "t12_line_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "t12_field_mappings_t12_upload_id_fkey"
            columns: ["t12_upload_id"]
            isOneToOne: false
            referencedRelation: "t12_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      t12_line_items: {
        Row: {
          amount_month_1: number | null
          amount_month_10: number | null
          amount_month_11: number | null
          amount_month_12: number | null
          amount_month_2: number | null
          amount_month_3: number | null
          amount_month_4: number | null
          amount_month_5: number | null
          amount_month_6: number | null
          amount_month_7: number | null
          amount_month_8: number | null
          amount_month_9: number | null
          annual_total: number | null
          created_at: string | null
          id: string
          is_income: boolean | null
          original_category: string | null
          original_row_label: string
          sort_order: number | null
          t12_upload_id: string
        }
        Insert: {
          amount_month_1?: number | null
          amount_month_10?: number | null
          amount_month_11?: number | null
          amount_month_12?: number | null
          amount_month_2?: number | null
          amount_month_3?: number | null
          amount_month_4?: number | null
          amount_month_5?: number | null
          amount_month_6?: number | null
          amount_month_7?: number | null
          amount_month_8?: number | null
          amount_month_9?: number | null
          annual_total?: number | null
          created_at?: string | null
          id?: string
          is_income?: boolean | null
          original_category?: string | null
          original_row_label: string
          sort_order?: number | null
          t12_upload_id: string
        }
        Update: {
          amount_month_1?: number | null
          amount_month_10?: number | null
          amount_month_11?: number | null
          amount_month_12?: number | null
          amount_month_2?: number | null
          amount_month_3?: number | null
          amount_month_4?: number | null
          amount_month_5?: number | null
          amount_month_6?: number | null
          amount_month_7?: number | null
          amount_month_8?: number | null
          amount_month_9?: number | null
          annual_total?: number | null
          created_at?: string | null
          id?: string
          is_income?: boolean | null
          original_category?: string | null
          original_row_label?: string
          sort_order?: number | null
          t12_upload_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "t12_line_items_t12_upload_id_fkey"
            columns: ["t12_upload_id"]
            isOneToOne: false
            referencedRelation: "t12_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      t12_mapping_suggestions: {
        Row: {
          created_at: string | null
          id: string
          mapped_category: string
          original_label: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mapped_category: string
          original_label: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mapped_category?: string
          original_label?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      t12_overrides: {
        Row: {
          category: string
          created_at: string | null
          id: string
          override_annual_total: number
          t12_upload_id: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          override_annual_total: number
          t12_upload_id: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          override_annual_total?: number
          t12_upload_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "t12_overrides_t12_upload_id_fkey"
            columns: ["t12_upload_id"]
            isOneToOne: false
            referencedRelation: "t12_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      t12_uploads: {
        Row: {
          created_at: string | null
          file_name: string
          file_url: string
          id: string
          loan_id: string
          notes: string | null
          period_end: string
          period_start: string
          source_label: string | null
          status: string | null
          updated_at: string | null
          upload_date: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_url?: string
          id?: string
          loan_id: string
          notes?: string | null
          period_end: string
          period_start: string
          source_label?: string | null
          status?: string | null
          updated_at?: string | null
          upload_date?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_url?: string
          id?: string
          loan_id?: string
          notes?: string | null
          period_end?: string
          period_start?: string
          source_label?: string | null
          status?: string | null
          updated_at?: string | null
          upload_date?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "t12_uploads_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "t12_uploads_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      t12_versions: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          loan_id: string
          t12_upload_id: string
          version_label: string | null
          version_number: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          loan_id: string
          t12_upload_id: string
          version_label?: string | null
          version_number: number
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          loan_id?: string
          t12_upload_id?: string
          version_label?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "t12_versions_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "t12_versions_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "t12_versions_t12_upload_id_fkey"
            columns: ["t12_upload_id"]
            isOneToOne: false
            referencedRelation: "t12_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      term_sheet_generations: {
        Row: {
          created_at: string
          generated_by: string | null
          generated_by_name: string | null
          id: string
          loan_id: string
          notes: string | null
          pdf_storage_path: string | null
          snapshot_data: Json | null
          template_id: string | null
          version: number | null
        }
        Insert: {
          created_at?: string
          generated_by?: string | null
          generated_by_name?: string | null
          id?: string
          loan_id: string
          notes?: string | null
          pdf_storage_path?: string | null
          snapshot_data?: Json | null
          template_id?: string | null
          version?: number | null
        }
        Update: {
          created_at?: string
          generated_by?: string | null
          generated_by_name?: string | null
          id?: string
          loan_id?: string
          notes?: string | null
          pdf_storage_path?: string | null
          snapshot_data?: Json | null
          template_id?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "term_sheet_generations_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "term_sheet_generations_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "term_sheet_generations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "term_sheet_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      term_sheet_logs: {
        Row: {
          created_at: string
          file_url: string | null
          generated_by: string | null
          generated_by_name: string | null
          id: string
          loan_id: string
          notes: string | null
          snapshot_data: Json | null
          template_id: string | null
          version: number | null
        }
        Insert: {
          created_at?: string
          file_url?: string | null
          generated_by?: string | null
          generated_by_name?: string | null
          id?: string
          loan_id: string
          notes?: string | null
          snapshot_data?: Json | null
          template_id?: string | null
          version?: number | null
        }
        Update: {
          created_at?: string
          file_url?: string | null
          generated_by?: string | null
          generated_by_name?: string | null
          id?: string
          loan_id?: string
          notes?: string | null
          snapshot_data?: Json | null
          template_id?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "term_sheet_logs_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "term_sheet_logs_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "term_sheet_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "term_sheet_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      term_sheet_templates: {
        Row: {
          borrower_section_heading: string | null
          closing_costs_custom_text: string | null
          closing_costs_section_heading: string | null
          company_address: string | null
          company_email: string | null
          company_name: string
          company_phone: string | null
          company_website: string | null
          conditions_custom_text: string | null
          conditions_section_heading: string | null
          created_at: string
          custom_fields: Json | null
          dates_section_heading: string | null
          disclaimer_rich_text: string | null
          disclaimer_section_heading: string | null
          extension_section_heading: string | null
          fees_section_heading: string | null
          field_labels: Json | null
          field_visibility: Json | null
          footer_rich_text: string | null
          guarantor_custom_text: string | null
          guarantor_section_heading: string | null
          header_rich_text: string | null
          id: string
          is_active: boolean
          last_edited_at: string | null
          last_edited_by: string | null
          loan_terms_section_heading: string | null
          loan_type: string
          logo_url: string | null
          name: string
          prepayment_section_heading: string | null
          property_section_heading: string | null
          reserves_custom_text: string | null
          reserves_section_heading: string | null
          section_order: Json | null
          show_borrower_section: boolean
          show_closing_costs_section: boolean
          show_conditions_section: boolean
          show_dates_section: boolean
          show_disclaimer_section: boolean
          show_extension_section: boolean
          show_fees_section: boolean
          show_guarantor_section: boolean
          show_loan_terms_section: boolean
          show_prepayment_section: boolean
          show_property_section: boolean
          show_reserves_section: boolean
          updated_at: string
          version: number
        }
        Insert: {
          borrower_section_heading?: string | null
          closing_costs_custom_text?: string | null
          closing_costs_section_heading?: string | null
          company_address?: string | null
          company_email?: string | null
          company_name?: string
          company_phone?: string | null
          company_website?: string | null
          conditions_custom_text?: string | null
          conditions_section_heading?: string | null
          created_at?: string
          custom_fields?: Json | null
          dates_section_heading?: string | null
          disclaimer_rich_text?: string | null
          disclaimer_section_heading?: string | null
          extension_section_heading?: string | null
          fees_section_heading?: string | null
          field_labels?: Json | null
          field_visibility?: Json | null
          footer_rich_text?: string | null
          guarantor_custom_text?: string | null
          guarantor_section_heading?: string | null
          header_rich_text?: string | null
          id?: string
          is_active?: boolean
          last_edited_at?: string | null
          last_edited_by?: string | null
          loan_terms_section_heading?: string | null
          loan_type: string
          logo_url?: string | null
          name: string
          prepayment_section_heading?: string | null
          property_section_heading?: string | null
          reserves_custom_text?: string | null
          reserves_section_heading?: string | null
          section_order?: Json | null
          show_borrower_section?: boolean
          show_closing_costs_section?: boolean
          show_conditions_section?: boolean
          show_dates_section?: boolean
          show_disclaimer_section?: boolean
          show_extension_section?: boolean
          show_fees_section?: boolean
          show_guarantor_section?: boolean
          show_loan_terms_section?: boolean
          show_prepayment_section?: boolean
          show_property_section?: boolean
          show_reserves_section?: boolean
          updated_at?: string
          version?: number
        }
        Update: {
          borrower_section_heading?: string | null
          closing_costs_custom_text?: string | null
          closing_costs_section_heading?: string | null
          company_address?: string | null
          company_email?: string | null
          company_name?: string
          company_phone?: string | null
          company_website?: string | null
          conditions_custom_text?: string | null
          conditions_section_heading?: string | null
          created_at?: string
          custom_fields?: Json | null
          dates_section_heading?: string | null
          disclaimer_rich_text?: string | null
          disclaimer_section_heading?: string | null
          extension_section_heading?: string | null
          fees_section_heading?: string | null
          field_labels?: Json | null
          field_visibility?: Json | null
          footer_rich_text?: string | null
          guarantor_custom_text?: string | null
          guarantor_section_heading?: string | null
          header_rich_text?: string | null
          id?: string
          is_active?: boolean
          last_edited_at?: string | null
          last_edited_by?: string | null
          loan_terms_section_heading?: string | null
          loan_type?: string
          logo_url?: string | null
          name?: string
          prepayment_section_heading?: string | null
          property_section_heading?: string | null
          reserves_custom_text?: string | null
          reserves_section_heading?: string | null
          section_order?: Json | null
          show_borrower_section?: boolean
          show_closing_costs_section?: boolean
          show_conditions_section?: boolean
          show_dates_section?: boolean
          show_disclaimer_section?: boolean
          show_extension_section?: boolean
          show_fees_section?: boolean
          show_guarantor_section?: boolean
          show_loan_terms_section?: boolean
          show_prepayment_section?: boolean
          show_property_section?: boolean
          show_reserves_section?: boolean
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          borrower_id: string | null
          created_at: string
          granted_at: string
          granted_by: string | null
          id: string
          investor_id: string | null
          is_active: boolean
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          borrower_id?: string | null
          created_at?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          investor_id?: string | null
          is_active?: boolean
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          borrower_id?: string | null
          created_at?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          investor_id?: string | null
          is_active?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers_portal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      borrowers_portal: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          country: string | null
          created_at: string | null
          credit_report_date: string | null
          credit_score: number | null
          date_of_birth: string | null
          email: string | null
          experience_count: number | null
          first_name: string | null
          id: string | null
          is_us_citizen: boolean | null
          last_name: string | null
          notes: string | null
          phone: string | null
          ssn_last_four: string | null
          state: string | null
          updated_at: string | null
          user_id: string | null
          zip: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          credit_report_date?: string | null
          credit_score?: number | null
          date_of_birth?: never
          email?: string | null
          experience_count?: number | null
          first_name?: string | null
          id?: string | null
          is_us_citizen?: boolean | null
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          ssn_last_four?: never
          state?: string | null
          updated_at?: string | null
          user_id?: string | null
          zip?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          credit_report_date?: string | null
          credit_score?: number | null
          date_of_birth?: never
          email?: string | null
          experience_count?: number | null
          first_name?: string | null
          id?: string | null
          is_us_citizen?: boolean | null
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          ssn_last_four?: never
          state?: string | null
          updated_at?: string | null
          user_id?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      borrowers_safe: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          country: string | null
          created_at: string | null
          credit_report_date: string | null
          credit_score: number | null
          date_of_birth: string | null
          email: string | null
          experience_count: number | null
          first_name: string | null
          id: string | null
          is_us_citizen: boolean | null
          last_name: string | null
          notes: string | null
          phone: string | null
          ssn_last_four: string | null
          state: string | null
          updated_at: string | null
          zip: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          credit_report_date?: string | null
          credit_score?: number | null
          date_of_birth?: never
          email?: string | null
          experience_count?: number | null
          first_name?: string | null
          id?: string | null
          is_us_citizen?: boolean | null
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          ssn_last_four?: never
          state?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          credit_report_date?: string | null
          credit_score?: number | null
          date_of_birth?: never
          email?: string | null
          experience_count?: number | null
          first_name?: string | null
          id?: string | null
          is_us_citizen?: boolean | null
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          ssn_last_four?: never
          state?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      crm_contacts_active: {
        Row: {
          address_line1: string | null
          assigned_to: string | null
          borrower_id: string | null
          city: string | null
          company_id: string | null
          company_name: string | null
          consent_granted_at: string | null
          contact_type: Database["public"]["Enums"]["crm_contact_type"] | null
          created_at: string | null
          deleted_at: string | null
          dnc: boolean | null
          dnc_reason: string | null
          email: string | null
          first_name: string | null
          id: string | null
          last_contacted_at: string | null
          last_name: string | null
          lifecycle_stage: Database["public"]["Enums"]["lifecycle_stage_enum"] | null
          lifecycle_updated_at: string | null
          linked_investor_id: string | null
          linked_loan_id: string | null
          marketing_consent: boolean | null
          name: string | null
          next_follow_up_date: string | null
          notes: string | null
          phone: string | null
          postmark_contact_id: string | null
          source: Database["public"]["Enums"]["crm_contact_source"] | null
          state: string | null
          status: Database["public"]["Enums"]["crm_contact_status"] | null
          twilio_contact_id: string | null
          updated_at: string | null
          zip: string | null
        }
        Insert: {
          address_line1?: string | null
          assigned_to?: string | null
          borrower_id?: string | null
          city?: string | null
          company_id?: string | null
          company_name?: string | null
          consent_granted_at?: string | null
          contact_type?: Database["public"]["Enums"]["crm_contact_type"] | null
          created_at?: string | null
          deleted_at?: string | null
          dnc?: boolean | null
          dnc_reason?: string | null
          email?: string | null
          first_name?: string | null
          id?: string | null
          last_contacted_at?: string | null
          last_name?: string | null
          lifecycle_stage?: Database["public"]["Enums"]["lifecycle_stage_enum"] | null
          lifecycle_updated_at?: string | null
          linked_investor_id?: string | null
          linked_loan_id?: string | null
          marketing_consent?: boolean | null
          name?: string | null
          next_follow_up_date?: string | null
          notes?: string | null
          phone?: string | null
          postmark_contact_id?: string | null
          source?: Database["public"]["Enums"]["crm_contact_source"] | null
          state?: string | null
          status?: Database["public"]["Enums"]["crm_contact_status"] | null
          twilio_contact_id?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Update: {
          address_line1?: string | null
          assigned_to?: string | null
          borrower_id?: string | null
          city?: string | null
          company_id?: string | null
          company_name?: string | null
          consent_granted_at?: string | null
          contact_type?: Database["public"]["Enums"]["crm_contact_type"] | null
          created_at?: string | null
          deleted_at?: string | null
          dnc?: boolean | null
          dnc_reason?: string | null
          email?: string | null
          first_name?: string | null
          id?: string | null
          last_contacted_at?: string | null
          last_name?: string | null
          lifecycle_stage?: Database["public"]["Enums"]["lifecycle_stage_enum"] | null
          lifecycle_updated_at?: string | null
          linked_investor_id?: string | null
          linked_loan_id?: string | null
          marketing_consent?: boolean | null
          name?: string | null
          next_follow_up_date?: string | null
          notes?: string | null
          phone?: string | null
          postmark_contact_id?: string | null
          source?: Database["public"]["Enums"]["crm_contact_source"] | null
          state?: string | null
          status?: Database["public"]["Enums"]["crm_contact_status"] | null
          twilio_contact_id?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_linked_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_linked_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers_portal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_linked_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_linked_investor_id_fkey"
            columns: ["linked_investor_id"]
            isOneToOne: false
            referencedRelation: "investors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_linked_loan_id_fkey"
            columns: ["linked_loan_id"]
            isOneToOne: false
            referencedRelation: "loan_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_linked_loan_id_fkey"
            columns: ["linked_loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      investing_entities_portal: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          country: string | null
          created_at: string | null
          ein: string | null
          entity_name: string | null
          entity_type: string | null
          formation_doc_url: string | null
          id: string | null
          investor_id: string | null
          notes: string | null
          operating_agreement_url: string | null
          other_doc_urls: string[] | null
          state: string | null
          state_of_formation: string | null
          updated_at: string | null
          zip: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          ein?: never
          entity_name?: string | null
          entity_type?: string | null
          formation_doc_url?: string | null
          id?: string | null
          investor_id?: string | null
          notes?: string | null
          operating_agreement_url?: string | null
          other_doc_urls?: string[] | null
          state?: string | null
          state_of_formation?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          ein?: never
          entity_name?: string | null
          entity_type?: string | null
          formation_doc_url?: string | null
          id?: string | null
          investor_id?: string | null
          notes?: string | null
          operating_agreement_url?: string | null
          other_doc_urls?: string[] | null
          state?: string | null
          state_of_formation?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investing_entities_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_pipeline: {
        Row: {
          approved_conditions: number | null
          borrower_name: string | null
          closing_date: string | null
          created_at: string | null
          entity_name: string | null
          funding_source: string | null
          id: string | null
          interest_rate: number | null
          loan_amount: number | null
          loan_number: string | null
          loan_purpose: string | null
          loan_stage: string | null
          loan_term_months: number | null
          loan_type: string | null
          ltv: number | null
          maturity_date: string | null
          originator: string | null
          pending_conditions: number | null
          priority: string | null
          processor: string | null
          property_address: string | null
          stage_updated_at: string | null
          total_conditions: number | null
          updated_at: string | null
        }
        Relationships: []
      }
      search_index: {
        Row: {
          entity_type: string | null
          id: string | null
          metadata: Json | null
          owner_ref: string | null
          search_text: string | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      assign_role: {
        Args: {
          target_borrower_id?: string
          target_investor_id?: string
          target_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: string
      }
      create_notification: {
        Args: {
          p_action_url?: string
          p_body?: string
          p_entity_id?: string
          p_entity_label?: string
          p_entity_type?: string
          p_priority?: string
          p_slug: string
          p_title: string
          p_user_id: string
        }
        Returns: string
      }
      daitch_mokotoff: { Args: { "": string }; Returns: string[] }
      dmetaphone: { Args: { "": string }; Returns: string }
      dmetaphone_alt: { Args: { "": string }; Returns: string }
      generate_loan_conditions: { Args: { p_loan_id: string }; Returns: number }
      get_my_roles: {
        Args: never
        Returns: {
          borrower_id: string
          entity_display_name: string
          investor_id: string
          is_active: boolean
          role: Database["public"]["Enums"]["app_role"]
          role_id: string
        }[]
      }
      get_portal_context: { Args: never; Returns: Json }
      get_unread_notification_count: { Args: never; Returns: number }
      grant_role: {
        Args: {
          _borrower_id?: string
          _investor_id?: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: string
      }
      has_role: {
        Args: { check_role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      mark_all_notifications_read: { Args: never; Returns: undefined }
      mark_notifications_read: {
        Args: { p_notification_ids: string[] }
        Returns: undefined
      }
      my_borrower_ids: { Args: never; Returns: string[] }
      my_investor_ids: { Args: never; Returns: string[] }
      notify_admins: {
        Args: {
          p_action_url?: string
          p_body?: string
          p_entity_id?: string
          p_entity_label?: string
          p_entity_type?: string
          p_exclude_user_id?: string
          p_priority?: string
          p_slug: string
          p_title: string
        }
        Returns: undefined
      }
      refresh_search_index: { Args: never; Returns: undefined }
      revoke_role: {
        Args: {
          _borrower_id?: string
          _investor_id?: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      search_portal: {
        Args: {
          entity_filter?: string[]
          query_text: string
          result_limit?: number
          user_id?: string
          user_role?: string
        }
        Returns: {
          entity_type: string
          id: string
          metadata: Json
          rank: number
          updated_at: string
        }[]
      }
      set_active_underwriting_version: {
        Args: { p_version_id: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      soundex: { Args: { "": string }; Returns: string }
      text_soundex: { Args: { "": string }; Returns: string }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      activity_direction_enum: "inbound" | "outbound"
      app_role: "super_admin" | "admin" | "investor" | "borrower"
      audit_action_enum: "insert" | "update" | "delete"
      call_direction_enum: "inbound" | "outbound"
      call_status_enum:
        | "initiated"
        | "ringing"
        | "in_progress"
        | "completed"
        | "failed"
        | "no_answer"
        | "busy"
        | "voicemail"
      campaign_status_enum: "draft" | "active" | "paused" | "completed"
      campaign_type_enum:
        | "investor_update"
        | "lead_nurture"
        | "borrower_reengagement"
        | "broker_reengagement"
      company_type_enum:
        | "brokerage"
        | "lender"
        | "title_company"
        | "law_firm"
        | "insurance"
        | "appraisal"
        | "other"
      condition_category:
        | "borrower_documents"
        | "non_us_citizen"
        | "entity_documents"
        | "deal_level_items"
        | "appraisal_request"
        | "title_fraud_protection"
        | "lender_package"
        | "insurance_request"
        | "title_request"
        | "fundraising"
        | "closing_prep"
        | "post_closing_items"
        | "note_sell_process"
        | "post_loan_payoff"
        | "prior_to_approval"
        | "prior_to_funding"
      condition_stage:
        | "processing"
        | "closed_onboarding"
        | "note_sell_process"
        | "post_loan_payoff"
      condition_status:
        | "pending"
        | "submitted"
        | "under_review"
        | "approved"
        | "waived"
        | "not_applicable"
        | "rejected"
        | "not_requested"
        | "requested"
        | "received"
      crm_contact_source:
        | "website"
        | "referral"
        | "cold_call"
        | "email_campaign"
        | "social_media"
        | "event"
        | "paid_ad"
        | "organic"
        | "broker"
        | "repeat_client"
        | "other"
      crm_contact_status:
        | "active"
        | "inactive"
        | "converted"
        | "lost"
        | "do_not_contact"
      crm_contact_type:
        | "lead"
        | "prospect"
        | "borrower"
        | "investor"
        | "vendor"
        | "partner"
        | "referral"
        | "other"
      lender_direction_enum:
        | "broker_to"
        | "note_buyer"
        | "capital_partner"
        | "co_lender"
        | "referral_from"
      lifecycle_stage_enum: "lead" | "prospect" | "active" | "past"
      linked_entity_type_enum: "loan" | "borrower" | "investor" | "fund"
      loan_purpose: "purchase" | "refinance" | "cash_out_refinance"
      loan_status:
        | "lead"
        | "application"
        | "processing"
        | "underwriting"
        | "approved"
        | "clear_to_close"
        | "funded"
        | "servicing"
        | "payoff"
        | "default"
        | "note_sold"
        | "withdrawn"
        | "denied"
        | "reo"
        | "paid_off"
      loan_type: "commercial" | "dscr" | "guc" | "rtl" | "transactional"
      property_type:
        | "sfr"
        | "condo"
        | "townhouse"
        | "duplex"
        | "triplex"
        | "fourplex"
        | "multifamily_5_plus"
        | "mixed_use"
        | "retail"
        | "office"
        | "industrial"
        | "mobile_home_park"
        | "land"
        | "other"
      relationship_type_enum:
        | "borrower"
        | "investor"
        | "broker"
        | "lender"
        | "vendor"
        | "referral_partner"
      send_status_enum: "pending" | "sent" | "delivered" | "bounced" | "failed"
      vendor_type_enum:
        | "title_company"
        | "law_firm"
        | "insurance"
        | "appraisal"
        | "engineer"
        | "inspector"
        | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_direction_enum: ["inbound", "outbound"],
      app_role: ["super_admin", "admin", "investor", "borrower"],
      audit_action_enum: ["insert", "update", "delete"],
      call_direction_enum: ["inbound", "outbound"],
      call_status_enum: [
        "initiated",
        "ringing",
        "in_progress",
        "completed",
        "failed",
        "no_answer",
        "busy",
        "voicemail",
      ],
      campaign_status_enum: ["draft", "active", "paused", "completed"],
      campaign_type_enum: [
        "investor_update",
        "lead_nurture",
        "borrower_reengagement",
        "broker_reengagement",
      ],
      company_type_enum: [
        "brokerage",
        "lender",
        "title_company",
        "law_firm",
        "insurance",
        "appraisal",
        "other",
      ],
      condition_category: [
        "borrower_documents",
        "non_us_citizen",
        "entity_documents",
        "deal_level_items",
        "appraisal_request",
        "title_fraud_protection",
        "lender_package",
        "insurance_request",
        "title_request",
        "fundraising",
        "closing_prep",
        "post_closing_items",
        "note_sell_process",
        "post_loan_payoff",
        "prior_to_approval",
        "prior_to_funding",
      ],
      condition_stage: [
        "processing",
        "closed_onboarding",
        "note_sell_process",
        "post_loan_payoff",
      ],
      condition_status: [
        "pending",
        "submitted",
        "under_review",
        "approved",
        "waived",
        "not_applicable",
        "rejected",
        "not_requested",
        "requested",
        "received",
      ],
      crm_contact_source: [
        "website",
        "referral",
        "cold_call",
        "email_campaign",
        "social_media",
        "event",
        "paid_ad",
        "organic",
        "broker",
        "repeat_client",
        "other",
      ],
      crm_contact_status: [
        "active",
        "inactive",
        "converted",
        "lost",
        "do_not_contact",
      ],
      crm_contact_type: [
        "lead",
        "prospect",
        "borrower",
        "investor",
        "vendor",
        "partner",
        "referral",
        "other",
      ],
      lender_direction_enum: [
        "broker_to",
        "note_buyer",
        "capital_partner",
        "co_lender",
        "referral_from",
      ],
      lifecycle_stage_enum: ["lead", "prospect", "active", "past"],
      linked_entity_type_enum: ["loan", "borrower", "investor", "fund"],
      loan_purpose: ["purchase", "refinance", "cash_out_refinance"],
      loan_status: [
        "lead",
        "application",
        "processing",
        "underwriting",
        "approved",
        "clear_to_close",
        "funded",
        "servicing",
        "payoff",
        "default",
        "note_sold",
        "withdrawn",
        "denied",
        "reo",
        "paid_off",
      ],
      loan_type: ["commercial", "dscr", "guc", "rtl", "transactional"],
      property_type: [
        "sfr",
        "condo",
        "townhouse",
        "duplex",
        "triplex",
        "fourplex",
        "multifamily_5_plus",
        "mixed_use",
        "retail",
        "office",
        "industrial",
        "mobile_home_park",
        "land",
        "other",
      ],
      relationship_type_enum: [
        "borrower",
        "investor",
        "broker",
        "lender",
        "vendor",
        "referral_partner",
      ],
      send_status_enum: ["pending", "sent", "delivered", "bounced", "failed"],
      vendor_type_enum: [
        "title_company",
        "law_firm",
        "insurance",
        "appraisal",
        "engineer",
        "inspector",
        "other",
      ],
    },
  },
} as const

// ---------------------------------------------------------------------------
// Convenience aliases for common row types
// ---------------------------------------------------------------------------
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Borrower = Database["public"]["Tables"]["borrowers"]["Row"];
export type BorrowerInsert = Database["public"]["Tables"]["borrowers"]["Insert"];
export type BorrowerUpdate = Database["public"]["Tables"]["borrowers"]["Update"];
export type BorrowerEntity = Database["public"]["Tables"]["borrower_entities"]["Row"];
export type Investor = Database["public"]["Tables"]["investors"]["Row"];
export type InvestorInsert = Database["public"]["Tables"]["investors"]["Insert"];
export type Loan = Database["public"]["Tables"]["loans"]["Row"];
export type LoanInsert = Database["public"]["Tables"]["loans"]["Insert"];
export type LoanUpdate = Database["public"]["Tables"]["loans"]["Update"];
export type LoanCondition = Database["public"]["Tables"]["loan_conditions"]["Row"];
export type LoanConditionTemplate = Database["public"]["Tables"]["loan_condition_templates"]["Row"];
export type LoanDocument = Database["public"]["Tables"]["loan_documents"]["Row"];
export type DrawRequest = Database["public"]["Tables"]["draw_requests"]["Row"];
export type LoanPayment = Database["public"]["Tables"]["loan_payments"]["Row"];
export type Document = Database["public"]["Tables"]["documents"]["Row"];
export type Fund = Database["public"]["Tables"]["funds"]["Row"];
export type InvestorCommitment = Database["public"]["Tables"]["investor_commitments"]["Row"];
export type CapitalCall = Database["public"]["Tables"]["capital_calls"]["Row"];
export type Distribution = Database["public"]["Tables"]["distributions"]["Row"];
export type CrmContact = Database["public"]["Tables"]["crm_contacts"]["Row"];
export type CrmActivity = Database["public"]["Tables"]["crm_activities"]["Row"];
export type CrmEmail = Database["public"]["Tables"]["crm_emails"]["Row"];
export type CrmEmailInsert = Database["public"]["Tables"]["crm_emails"]["Insert"];
export type OpsProject = Database["public"]["Tables"]["ops_projects"]["Row"];
export type OpsTask = Database["public"]["Tables"]["ops_tasks"]["Row"];

// CRM table aliases
export type CampaignSendRow = Database["public"]["Tables"]["campaign_sends"]["Row"];
export type CampaignSendInsertRow = Database["public"]["Tables"]["campaign_sends"]["Insert"];
export type CompanyRow = Database["public"]["Tables"]["companies"]["Row"];
export type CompanyInsertRow = Database["public"]["Tables"]["companies"]["Insert"];
export type ContactAuditLogRow = Database["public"]["Tables"]["contact_audit_log"]["Row"];
export type ContactRelationshipTypeRow = Database["public"]["Tables"]["contact_relationship_types"]["Row"];
export type ContactTagRow = Database["public"]["Tables"]["contact_tags"]["Row"];
export type DialerCallRow = Database["public"]["Tables"]["dialer_calls"]["Row"];
export type MarketingCampaignRow = Database["public"]["Tables"]["marketing_campaigns"]["Row"];
export type MarketingCampaignInsertRow = Database["public"]["Tables"]["marketing_campaigns"]["Insert"];

// RTL Underwriting Engine types — tables removed from DB, using stubs
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PricingProgram = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PricingProgramInsert = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PricingProgramVersion = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LeverageAdjuster = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DealLeverageAdjustment = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DealLeverageAdjustmentInsert = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LoanComp = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LoanCompInsert = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LoanDraw = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LoanDrawInsert = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LoanEligibilityCheck = any;

// Underwriting versions
export type LoanUnderwritingVersion = Database["public"]["Tables"]["loan_underwriting_versions"]["Row"];
export type LoanUnderwritingVersionInsert = Database["public"]["Tables"]["loan_underwriting_versions"]["Insert"];

// ---------------------------------------------------------------------------
// Chatter system types (added via migration, not yet in generated Database type)
// ---------------------------------------------------------------------------
export interface LoanCommentRow {
  id: string;
  created_at: string;
  updated_at: string;
  loan_id: string;
  author_id: string;
  author_name: string | null;
  comment: string;
  mentions: string[] | null;
  is_internal: boolean;
  is_edited: boolean;
  edited_at: string | null;
  parent_comment_id: string | null;
}

export interface LoanConditionCommentRow {
  id: string;
  condition_id: string;
  loan_id: string;
  author_id: string | null;
  author_name: string | null;
  comment: string;
  mentions: string[] | null;
  is_internal: boolean;
  is_edited: boolean;
  edited_at: string | null;
  parent_comment_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommentMentionRow {
  id: string;
  created_at: string;
  comment_type: string;
  comment_id: string;
  mentioned_user_id: string;
  loan_id: string;
  condition_id: string | null;
  notification_sent: boolean;
}


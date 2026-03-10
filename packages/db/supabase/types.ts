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
      approval_audit_log: {
        Row: {
          action: string
          approval_id: string
          created_at: string
          deal_snapshot: Json | null
          id: string
          metadata: Json | null
          notes: string | null
          performed_by: string
        }
        Insert: {
          action: string
          approval_id: string
          created_at?: string
          deal_snapshot?: Json | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          performed_by: string
        }
        Update: {
          action?: string
          approval_id?: string
          created_at?: string
          deal_snapshot?: Json | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          performed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_audit_log_approval_id_fkey"
            columns: ["approval_id"]
            isOneToOne: false
            referencedRelation: "approval_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_checklists: {
        Row: {
          created_at: string
          entity_type: string
          id: string
          is_active: boolean | null
          items: Json
          name: string
        }
        Insert: {
          created_at?: string
          entity_type: string
          id?: string
          is_active?: boolean | null
          items?: Json
          name: string
        }
        Update: {
          created_at?: string
          entity_type?: string
          id?: string
          is_active?: boolean | null
          items?: Json
          name?: string
        }
        Relationships: []
      }
      approval_requests: {
        Row: {
          assigned_to: string
          checklist_results: Json | null
          created_at: string
          deal_snapshot: Json
          decision_at: string | null
          decision_notes: string | null
          entity_id: string
          entity_type: string
          id: string
          priority: string
          sla_breached: boolean | null
          sla_deadline: string | null
          status: string
          submission_notes: string | null
          submitted_by: string
          task_id: string | null
          updated_at: string
        }
        Insert: {
          assigned_to: string
          checklist_results?: Json | null
          created_at?: string
          deal_snapshot?: Json
          decision_at?: string | null
          decision_notes?: string | null
          entity_id: string
          entity_type: string
          id?: string
          priority?: string
          sla_breached?: boolean | null
          sla_deadline?: string | null
          status?: string
          submission_notes?: string | null
          submitted_by: string
          task_id?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string
          checklist_results?: Json | null
          created_at?: string
          deal_snapshot?: Json
          decision_at?: string | null
          decision_notes?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          priority?: string
          sla_breached?: boolean | null
          sla_deadline?: string | null
          status?: string
          submission_notes?: string | null
          submitted_by?: string
          task_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_requests_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "ops_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_routing_rules: {
        Row: {
          approver_id: string
          auto_priority: string | null
          conditions: Json
          created_at: string
          entity_type: string
          fallback_approver_id: string | null
          id: string
          is_active: boolean | null
          name: string
          priority_order: number
          sla_hours: number
          updated_at: string
        }
        Insert: {
          approver_id: string
          auto_priority?: string | null
          conditions?: Json
          created_at?: string
          entity_type: string
          fallback_approver_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          priority_order?: number
          sla_hours?: number
          updated_at?: string
        }
        Update: {
          approver_id?: string
          auto_priority?: string | null
          conditions?: Json
          created_at?: string
          entity_type?: string
          fallback_approver_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          priority_order?: number
          sla_hours?: number
          updated_at?: string
        }
        Relationships: []
      }
      billing_cycles: {
        Row: {
          billing_month: string
          generated_at: string
          generated_by: string | null
          id: string
          loan_count: number
          nacha_file_path: string | null
          notes: string | null
          status: Database["public"]["Enums"]["billing_cycle_status"]
          submitted_at: string | null
          total_billed: number
        }
        Insert: {
          billing_month: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          loan_count?: number
          nacha_file_path?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["billing_cycle_status"]
          submitted_at?: string | null
          total_billed?: number
        }
        Update: {
          billing_month?: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          loan_count?: number
          nacha_file_path?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["billing_cycle_status"]
          submitted_at?: string | null
          total_billed?: number
        }
        Relationships: []
      }
      billing_line_items: {
        Row: {
          base_interest: number
          billing_cycle_id: string
          billing_date: string
          calculation_detail: Json
          committed_balance: number
          days_in_period: number
          draw_proration_adjustment: number
          funded_balance: number
          id: string
          interest_method: Database["public"]["Enums"]["interest_method_type"]
          interest_rate: number
          late_fee: number
          loan_id: string
          other_fees: number
          per_diem: number
          status: Database["public"]["Enums"]["billing_line_item_status"]
          total_amount_due: number
          total_interest_billed: number
        }
        Insert: {
          base_interest: number
          billing_cycle_id: string
          billing_date: string
          calculation_detail?: Json
          committed_balance: number
          days_in_period: number
          draw_proration_adjustment?: number
          funded_balance: number
          id?: string
          interest_method: Database["public"]["Enums"]["interest_method_type"]
          interest_rate: number
          late_fee?: number
          loan_id: string
          other_fees?: number
          per_diem: number
          status?: Database["public"]["Enums"]["billing_line_item_status"]
          total_amount_due: number
          total_interest_billed: number
        }
        Update: {
          base_interest?: number
          billing_cycle_id?: string
          billing_date?: string
          calculation_detail?: Json
          committed_balance?: number
          days_in_period?: number
          draw_proration_adjustment?: number
          funded_balance?: number
          id?: string
          interest_method?: Database["public"]["Enums"]["interest_method_type"]
          interest_rate?: number
          late_fee?: number
          loan_id?: string
          other_fees?: number
          per_diem?: number
          status?: Database["public"]["Enums"]["billing_line_item_status"]
          total_amount_due?: number
          total_interest_billed?: number
        }
        Relationships: [
          {
            foreignKeyName: "billing_line_items_billing_cycle_id_fkey"
            columns: ["billing_cycle_id"]
            isOneToOne: false
            referencedRelation: "billing_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_line_items_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "servicing_loans"
            referencedColumns: ["loan_id"]
          },
          {
            foreignKeyName: "billing_line_items_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "servicing_maturity_schedule"
            referencedColumns: ["loan_id"]
          },
        ]
      }
      borrower_ach_info: {
        Row: {
          account_holder_name: string
          account_number: string
          account_type: Database["public"]["Enums"]["ach_account_type"]
          bank_name: string
          created_at: string
          id: string
          is_active: boolean
          loan_id: string
          routing_number: string
          verified_at: string | null
        }
        Insert: {
          account_holder_name: string
          account_number: string
          account_type?: Database["public"]["Enums"]["ach_account_type"]
          bank_name: string
          created_at?: string
          id?: string
          is_active?: boolean
          loan_id: string
          routing_number: string
          verified_at?: string | null
        }
        Update: {
          account_holder_name?: string
          account_number?: string
          account_type?: Database["public"]["Enums"]["ach_account_type"]
          bank_name?: string
          created_at?: string
          id?: string
          is_active?: boolean
          loan_id?: string
          routing_number?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "borrower_ach_info_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "servicing_loans"
            referencedColumns: ["loan_id"]
          },
          {
            foreignKeyName: "borrower_ach_info_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "servicing_maturity_schedule"
            referencedColumns: ["loan_id"]
          },
        ]
      }
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
          formation_date: string | null
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
          formation_date?: string | null
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
          formation_date?: string | null
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
      borrower_requests: {
        Row: {
          borrower_name: string
          created_at: string | null
          description: string
          follow_up_count: number | null
          id: string
          last_follow_up_at: string | null
          loan_id: string
          requested_by: string
          resolved_at: string | null
          sent_at: string | null
        }
        Insert: {
          borrower_name: string
          created_at?: string | null
          description: string
          follow_up_count?: number | null
          id?: string
          last_follow_up_at?: string | null
          loan_id: string
          requested_by: string
          resolved_at?: string | null
          sent_at?: string | null
        }
        Update: {
          borrower_name?: string
          created_at?: string | null
          description?: string
          follow_up_count?: number | null
          id?: string
          last_follow_up_at?: string | null
          loan_id?: string
          requested_by?: string
          resolved_at?: string | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "borrower_requests_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "borrower_requests_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      borrowers: {
        Row: {
          created_at: string
          credit_report_date: string | null
          credit_score: number | null
          crm_contact_id: string | null
          date_of_birth: string | null
          experience_count: number | null
          id: string
          is_us_citizen: boolean | null
          marital_status: string | null
          notes: string | null
          ssn_last_four: string | null
          stated_liquidity: number | null
          stated_net_worth: number | null
          updated_at: string
          user_id: string | null
          verified_liquidity: number | null
          verified_net_worth: number | null
        }
        Insert: {
          created_at?: string
          credit_report_date?: string | null
          credit_score?: number | null
          crm_contact_id?: string | null
          date_of_birth?: string | null
          experience_count?: number | null
          id?: string
          is_us_citizen?: boolean | null
          marital_status?: string | null
          notes?: string | null
          ssn_last_four?: string | null
          stated_liquidity?: number | null
          stated_net_worth?: number | null
          updated_at?: string
          user_id?: string | null
          verified_liquidity?: number | null
          verified_net_worth?: number | null
        }
        Update: {
          created_at?: string
          credit_report_date?: string | null
          credit_score?: number | null
          crm_contact_id?: string | null
          date_of_birth?: string | null
          experience_count?: number | null
          id?: string
          is_us_citizen?: boolean | null
          marital_status?: string | null
          notes?: string | null
          ssn_last_four?: string | null
          stated_liquidity?: number | null
          stated_net_worth?: number | null
          updated_at?: string
          user_id?: string | null
          verified_liquidity?: number | null
          verified_net_worth?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "borrowers_crm_contact_id_fkey"
            columns: ["crm_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "borrowers_crm_contact_id_fkey"
            columns: ["crm_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "borrowers_crm_contact_id_fkey"
            columns: ["crm_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "borrowers_crm_contact_id_fkey"
            columns: ["crm_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["potential_duplicate_id"]
          },
        ]
      }
      budget_change_request_line_items: {
        Row: {
          budget_change_request_id: string
          budget_line_item_id: string | null
          category: string | null
          change_action: Database["public"]["Enums"]["budget_change_action"]
          current_amount: number | null
          delta_amount: number
          description: string | null
          id: string
          proposed_amount: number | null
        }
        Insert: {
          budget_change_request_id: string
          budget_line_item_id?: string | null
          category?: string | null
          change_action: Database["public"]["Enums"]["budget_change_action"]
          current_amount?: number | null
          delta_amount: number
          description?: string | null
          id?: string
          proposed_amount?: number | null
        }
        Update: {
          budget_change_request_id?: string
          budget_line_item_id?: string | null
          category?: string | null
          change_action?: Database["public"]["Enums"]["budget_change_action"]
          current_amount?: number | null
          delta_amount?: number
          description?: string | null
          id?: string
          proposed_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_change_request_line_items_budget_change_request_id_fkey"
            columns: ["budget_change_request_id"]
            isOneToOne: false
            referencedRelation: "budget_change_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_change_request_line_items_budget_line_item_id_fkey"
            columns: ["budget_line_item_id"]
            isOneToOne: false
            referencedRelation: "budget_line_items"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_change_requests: {
        Row: {
          construction_budget_id: string
          created_at: string
          id: string
          loan_id: string
          net_budget_change: number
          reason: string
          request_date: string
          request_number: string | null
          requested_by: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["budget_change_request_status"]
          updated_at: string
        }
        Insert: {
          construction_budget_id: string
          created_at?: string
          id?: string
          loan_id: string
          net_budget_change?: number
          reason: string
          request_date?: string
          request_number?: string | null
          requested_by: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["budget_change_request_status"]
          updated_at?: string
        }
        Update: {
          construction_budget_id?: string
          created_at?: string
          id?: string
          loan_id?: string
          net_budget_change?: number
          reason?: string
          request_date?: string
          request_number?: string | null
          requested_by?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["budget_change_request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_change_requests_construction_budget_id_fkey"
            columns: ["construction_budget_id"]
            isOneToOne: false
            referencedRelation: "construction_budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_change_requests_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_change_requests_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_line_item_history: {
        Row: {
          budget_change_request_id: string | null
          budget_line_item_id: string
          change_reason: string | null
          change_type: Database["public"]["Enums"]["budget_line_item_change_type"]
          changed_at: string
          changed_by: string
          construction_budget_id: string
          id: string
          new_amount: number | null
          previous_amount: number | null
        }
        Insert: {
          budget_change_request_id?: string | null
          budget_line_item_id: string
          change_reason?: string | null
          change_type: Database["public"]["Enums"]["budget_line_item_change_type"]
          changed_at?: string
          changed_by: string
          construction_budget_id: string
          id?: string
          new_amount?: number | null
          previous_amount?: number | null
        }
        Update: {
          budget_change_request_id?: string | null
          budget_line_item_id?: string
          change_reason?: string | null
          change_type?: Database["public"]["Enums"]["budget_line_item_change_type"]
          changed_at?: string
          changed_by?: string
          construction_budget_id?: string
          id?: string
          new_amount?: number | null
          previous_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_line_item_history_budget_line_item_id_fkey"
            columns: ["budget_line_item_id"]
            isOneToOne: false
            referencedRelation: "budget_line_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_line_item_history_construction_budget_id_fkey"
            columns: ["construction_budget_id"]
            isOneToOne: false
            referencedRelation: "construction_budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_line_items: {
        Row: {
          budgeted_amount: number
          category: string
          construction_budget_id: string
          created_at: string
          description: string | null
          drawn_amount: number
          id: string
          is_active: boolean
          loan_id: string
          percent_complete: number
          remaining_amount: number | null
          revised_amount: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          budgeted_amount: number
          category: string
          construction_budget_id: string
          created_at?: string
          description?: string | null
          drawn_amount?: number
          id?: string
          is_active?: boolean
          loan_id: string
          percent_complete?: number
          remaining_amount?: number | null
          revised_amount: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          budgeted_amount?: number
          category?: string
          construction_budget_id?: string
          created_at?: string
          description?: string | null
          drawn_amount?: number
          id?: string
          is_active?: boolean
          loan_id?: string
          percent_complete?: number
          remaining_amount?: number | null
          revised_amount?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_line_items_construction_budget_id_fkey"
            columns: ["construction_budget_id"]
            isOneToOne: false
            referencedRelation: "construction_budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_line_items_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_line_items_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
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
            foreignKeyName: "capital_calls_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors_portal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capital_calls_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capital_calls_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
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
          equity_deal_id: string | null
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
          is_active: boolean
          label: string | null
          loan_id: string | null
          notes: string | null
          operating_days_per_year: number | null
          opportunity_id: string | null
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
          scenario_id: string | null
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
          version_number: number
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
          equity_deal_id?: string | null
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
          is_active?: boolean
          label?: string | null
          loan_id?: string | null
          notes?: string | null
          operating_days_per_year?: number | null
          opportunity_id?: string | null
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
          scenario_id?: string | null
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
          version_number?: number
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
          equity_deal_id?: string | null
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
          is_active?: boolean
          label?: string | null
          loan_id?: string | null
          notes?: string | null
          operating_days_per_year?: number | null
          opportunity_id?: string | null
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
          scenario_id?: string | null
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
          version_number?: number
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
            foreignKeyName: "commercial_underwriting_equity_deal_id_fkey"
            columns: ["equity_deal_id"]
            isOneToOne: false
            referencedRelation: "equity_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_underwriting_equity_deal_id_fkey"
            columns: ["equity_deal_id"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_underwriting_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_underwriting_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_underwriting_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_underwriting_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunity_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_underwriting_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "model_scenarios"
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
          asset_types: string[] | null
          city: string | null
          company_capabilities: string[] | null
          company_subtype:
            | Database["public"]["Enums"]["company_subtype_enum"]
            | null
          company_type: Database["public"]["Enums"]["company_type_enum"]
          company_types: string[] | null
          country: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          fee_agreement_on_file: boolean | null
          geographies: string[] | null
          id: string
          is_active: boolean | null
          lender_programs: string[] | null
          name: string
          nda_created_date: string | null
          nda_expiration_date: string | null
          notes: string | null
          other_names: string | null
          phone: string | null
          primary_contact_id: string | null
          referral_contact_id: string | null
          source: string | null
          state: string | null
          title_company_verified: boolean | null
          updated_at: string
          website: string | null
          zip: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          asset_types?: string[] | null
          city?: string | null
          company_capabilities?: string[] | null
          company_subtype?:
            | Database["public"]["Enums"]["company_subtype_enum"]
            | null
          company_type: Database["public"]["Enums"]["company_type_enum"]
          company_types?: string[] | null
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          fee_agreement_on_file?: boolean | null
          geographies?: string[] | null
          id?: string
          is_active?: boolean | null
          lender_programs?: string[] | null
          name: string
          nda_created_date?: string | null
          nda_expiration_date?: string | null
          notes?: string | null
          other_names?: string | null
          phone?: string | null
          primary_contact_id?: string | null
          referral_contact_id?: string | null
          source?: string | null
          state?: string | null
          title_company_verified?: boolean | null
          updated_at?: string
          website?: string | null
          zip?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          asset_types?: string[] | null
          city?: string | null
          company_capabilities?: string[] | null
          company_subtype?:
            | Database["public"]["Enums"]["company_subtype_enum"]
            | null
          company_type?: Database["public"]["Enums"]["company_type_enum"]
          company_types?: string[] | null
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          fee_agreement_on_file?: boolean | null
          geographies?: string[] | null
          id?: string
          is_active?: boolean | null
          lender_programs?: string[] | null
          name?: string
          nda_created_date?: string | null
          nda_expiration_date?: string | null
          notes?: string | null
          other_names?: string | null
          phone?: string | null
          primary_contact_id?: string | null
          referral_contact_id?: string | null
          source?: string | null
          state?: string | null
          title_company_verified?: boolean | null
          updated_at?: string
          website?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_referral_contact_id_fkey"
            columns: ["referral_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_referral_contact_id_fkey"
            columns: ["referral_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_referral_contact_id_fkey"
            columns: ["referral_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "companies_referral_contact_id_fkey"
            columns: ["referral_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["potential_duplicate_id"]
          },
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
          {
            foreignKeyName: "fk_companies_primary_contact"
            columns: ["primary_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "fk_companies_primary_contact"
            columns: ["primary_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["potential_duplicate_id"]
          },
        ]
      }
      company_files: {
        Row: {
          company_id: string
          created_at: string | null
          file_name: string
          file_size: number | null
          file_type: string
          id: string
          mime_type: string | null
          notes: string | null
          storage_path: string
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_type: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          storage_path: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          storage_path?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_files_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_wire_instructions: {
        Row: {
          account_name: string
          account_number: string
          bank_name: string
          company_id: string | null
          id: string
          routing_number: string
          updated_at: string
          updated_by: string | null
          wire_type: string
        }
        Insert: {
          account_name?: string
          account_number?: string
          bank_name?: string
          company_id?: string | null
          id?: string
          routing_number?: string
          updated_at?: string
          updated_by?: string | null
          wire_type?: string
        }
        Update: {
          account_name?: string
          account_number?: string
          bank_name?: string
          company_id?: string | null
          id?: string
          routing_number?: string
          updated_at?: string
          updated_by?: string | null
          wire_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_wire_instructions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
          {
            foreignKeyName: "condition_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      construction_budgets: {
        Row: {
          budget_version: number
          created_at: string
          created_by: string
          id: string
          loan_id: string
          notes: string | null
          status: Database["public"]["Enums"]["budget_status"]
          total_budget: number
          total_drawn: number
          total_remaining: number | null
          updated_at: string
        }
        Insert: {
          budget_version?: number
          created_at?: string
          created_by: string
          id?: string
          loan_id: string
          notes?: string | null
          status?: Database["public"]["Enums"]["budget_status"]
          total_budget: number
          total_drawn?: number
          total_remaining?: number | null
          updated_at?: string
        }
        Update: {
          budget_version?: number
          created_at?: string
          created_by?: string
          id?: string
          loan_id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["budget_status"]
          total_budget?: number
          total_drawn?: number
          total_remaining?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "construction_budgets_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: true
            referencedRelation: "loan_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "construction_budgets_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: true
            referencedRelation: "loans"
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
          {
            foreignKeyName: "contact_audit_log_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "contact_audit_log_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["potential_duplicate_id"]
          },
        ]
      }
      contact_files: {
        Row: {
          contact_id: string
          created_at: string | null
          file_name: string
          file_size: number | null
          file_type: string
          id: string
          mime_type: string | null
          notes: string | null
          storage_path: string
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_type: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          storage_path: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          storage_path?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_files_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_files_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_files_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "contact_files_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["potential_duplicate_id"]
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
          is_auto_derived: boolean | null
          lender_direction:
            | Database["public"]["Enums"]["lender_direction_enum"]
            | null
          notes: string | null
          relationship_type: Database["public"]["Enums"]["relationship_type_enum"]
          started_at: string | null
          vendor_type: Database["public"]["Enums"]["vendor_type_enum"] | null
        }
        Insert: {
          contact_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          is_auto_derived?: boolean | null
          lender_direction?:
            | Database["public"]["Enums"]["lender_direction_enum"]
            | null
          notes?: string | null
          relationship_type: Database["public"]["Enums"]["relationship_type_enum"]
          started_at?: string | null
          vendor_type?: Database["public"]["Enums"]["vendor_type_enum"] | null
        }
        Update: {
          contact_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          is_auto_derived?: boolean | null
          lender_direction?:
            | Database["public"]["Enums"]["lender_direction_enum"]
            | null
          notes?: string | null
          relationship_type?: Database["public"]["Enums"]["relationship_type_enum"]
          started_at?: string | null
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
          {
            foreignKeyName: "contact_relationship_types_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "contact_relationship_types_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["potential_duplicate_id"]
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
            foreignKeyName: "contact_tags_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "contact_tags_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["potential_duplicate_id"]
          },
          {
            foreignKeyName: "contact_tags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
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
          call_disposition: string | null
          call_duration_seconds: number | null
          call_recording_url: string | null
          company_id: string | null
          completed_at: string | null
          contact_id: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          direction:
            | Database["public"]["Enums"]["activity_direction_enum"]
            | null
          email_message_id: string | null
          id: string
          is_completed: boolean | null
          linked_entity_id: string | null
          linked_entity_type:
            | Database["public"]["Enums"]["linked_entity_type_enum"]
            | null
          metadata: Json | null
          performed_by: string | null
          performed_by_name: string | null
          scheduled_at: string | null
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          activity_type: string
          call_disposition?: string | null
          call_duration_seconds?: number | null
          call_recording_url?: string | null
          company_id?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          direction?:
            | Database["public"]["Enums"]["activity_direction_enum"]
            | null
          email_message_id?: string | null
          id?: string
          is_completed?: boolean | null
          linked_entity_id?: string | null
          linked_entity_type?:
            | Database["public"]["Enums"]["linked_entity_type_enum"]
            | null
          metadata?: Json | null
          performed_by?: string | null
          performed_by_name?: string | null
          scheduled_at?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          activity_type?: string
          call_disposition?: string | null
          call_duration_seconds?: number | null
          call_recording_url?: string | null
          company_id?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          direction?:
            | Database["public"]["Enums"]["activity_direction_enum"]
            | null
          email_message_id?: string | null
          id?: string
          is_completed?: boolean | null
          linked_entity_id?: string | null
          linked_entity_type?:
            | Database["public"]["Enums"]["linked_entity_type_enum"]
            | null
          metadata?: Json | null
          performed_by?: string | null
          performed_by_name?: string | null
          scheduled_at?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "crm_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "crm_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["potential_duplicate_id"]
          },
          {
            foreignKeyName: "crm_activities_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
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
          address_line2: string | null
          assigned_to: string | null
          borrower_id: string | null
          city: string | null
          company_id: string | null
          company_name: string | null
          consent_granted_at: string | null
          contact_type: Database["public"]["Enums"]["crm_contact_type"]
          contact_types: string[]
          country: string | null
          created_at: string
          deleted_at: string | null
          dnc: boolean | null
          dnc_reason: string | null
          email: string | null
          first_name: string | null
          id: string
          is_independent_broker: boolean | null
          language_preference: Database["public"]["Enums"]["language_preference_enum"]
          last_contacted_at: string | null
          last_name: string | null
          lifecycle_stage:
            | Database["public"]["Enums"]["lifecycle_stage_enum"]
            | null
          lifecycle_updated_at: string | null
          linked_investor_id: string | null
          linked_loan_id: string | null
          marketing_consent: boolean | null
          name: string | null
          next_follow_up_date: string | null
          notes: string | null
          phone: string | null
          postmark_contact_id: string | null
          rating: Database["public"]["Enums"]["contact_rating_enum"] | null
          source: Database["public"]["Enums"]["crm_contact_source"] | null
          state: string | null
          status: Database["public"]["Enums"]["crm_contact_status"]
          twilio_contact_id: string | null
          updated_at: string
          user_function: string | null
          user_id: string | null
          zip: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          assigned_to?: string | null
          borrower_id?: string | null
          city?: string | null
          company_id?: string | null
          company_name?: string | null
          consent_granted_at?: string | null
          contact_type?: Database["public"]["Enums"]["crm_contact_type"]
          contact_types?: string[]
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          dnc?: boolean | null
          dnc_reason?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          is_independent_broker?: boolean | null
          language_preference?: Database["public"]["Enums"]["language_preference_enum"]
          last_contacted_at?: string | null
          last_name?: string | null
          lifecycle_stage?:
            | Database["public"]["Enums"]["lifecycle_stage_enum"]
            | null
          lifecycle_updated_at?: string | null
          linked_investor_id?: string | null
          linked_loan_id?: string | null
          marketing_consent?: boolean | null
          name?: string | null
          next_follow_up_date?: string | null
          notes?: string | null
          phone?: string | null
          postmark_contact_id?: string | null
          rating?: Database["public"]["Enums"]["contact_rating_enum"] | null
          source?: Database["public"]["Enums"]["crm_contact_source"] | null
          state?: string | null
          status?: Database["public"]["Enums"]["crm_contact_status"]
          twilio_contact_id?: string | null
          updated_at?: string
          user_function?: string | null
          user_id?: string | null
          zip?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          assigned_to?: string | null
          borrower_id?: string | null
          city?: string | null
          company_id?: string | null
          company_name?: string | null
          consent_granted_at?: string | null
          contact_type?: Database["public"]["Enums"]["crm_contact_type"]
          contact_types?: string[]
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          dnc?: boolean | null
          dnc_reason?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          is_independent_broker?: boolean | null
          language_preference?: Database["public"]["Enums"]["language_preference_enum"]
          last_contacted_at?: string | null
          last_name?: string | null
          lifecycle_stage?:
            | Database["public"]["Enums"]["lifecycle_stage_enum"]
            | null
          lifecycle_updated_at?: string | null
          linked_investor_id?: string | null
          linked_loan_id?: string | null
          marketing_consent?: boolean | null
          name?: string | null
          next_follow_up_date?: string | null
          notes?: string | null
          phone?: string | null
          postmark_contact_id?: string | null
          rating?: Database["public"]["Enums"]["contact_rating_enum"] | null
          source?: Database["public"]["Enums"]["crm_contact_source"] | null
          state?: string | null
          status?: Database["public"]["Enums"]["crm_contact_status"]
          twilio_contact_id?: string | null
          updated_at?: string
          user_function?: string | null
          user_id?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
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
            foreignKeyName: "crm_contacts_linked_investor_id_fkey"
            columns: ["linked_investor_id"]
            isOneToOne: false
            referencedRelation: "investors_portal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_linked_investor_id_fkey"
            columns: ["linked_investor_id"]
            isOneToOne: false
            referencedRelation: "investors_safe"
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
          {
            foreignKeyName: "crm_contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
          {
            foreignKeyName: "crm_contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          direction: string
          email_template_id: string | null
          from_email: string | null
          from_name: string | null
          gmail_labels: string[] | null
          gmail_message_id: string | null
          gmail_thread_id: string | null
          id: string
          is_read: boolean | null
          linked_borrower_id: string | null
          linked_contact_id: string | null
          linked_fund_id: string | null
          linked_investor_id: string | null
          linked_loan_id: string | null
          match_status: string | null
          opened_at: string | null
          postmark_error: string | null
          postmark_message_id: string | null
          postmark_status: string | null
          reply_to: string | null
          sent_by: string | null
          sent_by_name: string | null
          subject: string | null
          synced_at: string | null
          synced_by: string | null
          template_data: Json | null
          to_email: string | null
          to_emails: string[] | null
          to_name: string | null
          to_names: string[] | null
        }
        Insert: {
          attachments?: Json | null
          bcc_emails?: string[] | null
          body_html?: string | null
          body_text?: string | null
          cc_emails?: string[] | null
          created_at?: string
          delivered_at?: string | null
          direction?: string
          email_template_id?: string | null
          from_email?: string | null
          from_name?: string | null
          gmail_labels?: string[] | null
          gmail_message_id?: string | null
          gmail_thread_id?: string | null
          id?: string
          is_read?: boolean | null
          linked_borrower_id?: string | null
          linked_contact_id?: string | null
          linked_fund_id?: string | null
          linked_investor_id?: string | null
          linked_loan_id?: string | null
          match_status?: string | null
          opened_at?: string | null
          postmark_error?: string | null
          postmark_message_id?: string | null
          postmark_status?: string | null
          reply_to?: string | null
          sent_by?: string | null
          sent_by_name?: string | null
          subject?: string | null
          synced_at?: string | null
          synced_by?: string | null
          template_data?: Json | null
          to_email?: string | null
          to_emails?: string[] | null
          to_name?: string | null
          to_names?: string[] | null
        }
        Update: {
          attachments?: Json | null
          bcc_emails?: string[] | null
          body_html?: string | null
          body_text?: string | null
          cc_emails?: string[] | null
          created_at?: string
          delivered_at?: string | null
          direction?: string
          email_template_id?: string | null
          from_email?: string | null
          from_name?: string | null
          gmail_labels?: string[] | null
          gmail_message_id?: string | null
          gmail_thread_id?: string | null
          id?: string
          is_read?: boolean | null
          linked_borrower_id?: string | null
          linked_contact_id?: string | null
          linked_fund_id?: string | null
          linked_investor_id?: string | null
          linked_loan_id?: string | null
          match_status?: string | null
          opened_at?: string | null
          postmark_error?: string | null
          postmark_message_id?: string | null
          postmark_status?: string | null
          reply_to?: string | null
          sent_by?: string | null
          sent_by_name?: string | null
          subject?: string | null
          synced_at?: string | null
          synced_by?: string | null
          template_data?: Json | null
          to_email?: string | null
          to_emails?: string[] | null
          to_name?: string | null
          to_names?: string[] | null
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
            foreignKeyName: "crm_emails_linked_contact_id_fkey"
            columns: ["linked_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "crm_emails_linked_contact_id_fkey"
            columns: ["linked_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["potential_duplicate_id"]
          },
          {
            foreignKeyName: "crm_emails_linked_fund_id_fkey"
            columns: ["linked_fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
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
            foreignKeyName: "crm_emails_linked_investor_id_fkey"
            columns: ["linked_investor_id"]
            isOneToOne: false
            referencedRelation: "investors_portal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_emails_linked_investor_id_fkey"
            columns: ["linked_investor_id"]
            isOneToOne: false
            referencedRelation: "investors_safe"
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
      crm_event_attendees: {
        Row: {
          contact_id: string | null
          created_at: string
          email: string | null
          event_id: string
          id: string
          profile_id: string | null
          response_status:
            | Database["public"]["Enums"]["crm_event_response"]
            | null
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          email?: string | null
          event_id: string
          id?: string
          profile_id?: string | null
          response_status?:
            | Database["public"]["Enums"]["crm_event_response"]
            | null
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          email?: string | null
          event_id?: string
          id?: string
          profile_id?: string | null
          response_status?:
            | Database["public"]["Enums"]["crm_event_response"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_event_attendees_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_event_attendees_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_event_attendees_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "crm_event_attendees_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["potential_duplicate_id"]
          },
          {
            foreignKeyName: "crm_event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "crm_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_event_attendees_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
          {
            foreignKeyName: "crm_event_attendees_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_events: {
        Row: {
          company_id: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          end_at: string
          event_type: Database["public"]["Enums"]["crm_event_type"]
          google_calendar_id: string | null
          google_event_id: string | null
          google_sync_status:
            | Database["public"]["Enums"]["google_sync_status"]
            | null
          google_synced_at: string | null
          id: string
          is_all_day: boolean | null
          loan_id: string | null
          location: string | null
          start_at: string
          subject: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          end_at: string
          event_type?: Database["public"]["Enums"]["crm_event_type"]
          google_calendar_id?: string | null
          google_event_id?: string | null
          google_sync_status?:
            | Database["public"]["Enums"]["google_sync_status"]
            | null
          google_synced_at?: string | null
          id?: string
          is_all_day?: boolean | null
          loan_id?: string | null
          location?: string | null
          start_at: string
          subject: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          end_at?: string
          event_type?: Database["public"]["Enums"]["crm_event_type"]
          google_calendar_id?: string | null
          google_event_id?: string | null
          google_sync_status?:
            | Database["public"]["Enums"]["google_sync_status"]
            | null
          google_synced_at?: string | null
          id?: string
          is_all_day?: boolean | null
          loan_id?: string | null
          location?: string | null
          start_at?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "crm_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["potential_duplicate_id"]
          },
          {
            foreignKeyName: "crm_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
          {
            foreignKeyName: "crm_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_events_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_events_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_followers: {
        Row: {
          company_id: string | null
          contact_id: string | null
          created_at: string
          id: string
          notify_on_activity: boolean | null
          notify_on_task: boolean | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          id?: string
          notify_on_activity?: boolean | null
          notify_on_task?: boolean | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          id?: string
          notify_on_activity?: boolean | null
          notify_on_task?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_followers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_followers_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_followers_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_followers_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "crm_followers_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["potential_duplicate_id"]
          },
          {
            foreignKeyName: "crm_followers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
          {
            foreignKeyName: "crm_followers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_commercial_debt: {
        Row: {
          amortization_years: number | null
          created_at: string | null
          id: string
          interest_rate: number | null
          io_period_months: number | null
          lender_name: string | null
          loan_amount: number | null
          loan_type: string | null
          origination_fee_pct: number | null
          sort_order: number | null
          term_years: number | null
          tranche_name: string | null
          uw_id: string
        }
        Insert: {
          amortization_years?: number | null
          created_at?: string | null
          id?: string
          interest_rate?: number | null
          io_period_months?: number | null
          lender_name?: string | null
          loan_amount?: number | null
          loan_type?: string | null
          origination_fee_pct?: number | null
          sort_order?: number | null
          term_years?: number | null
          tranche_name?: string | null
          uw_id: string
        }
        Update: {
          amortization_years?: number | null
          created_at?: string | null
          id?: string
          interest_rate?: number | null
          io_period_months?: number | null
          lender_name?: string | null
          loan_amount?: number | null
          loan_type?: string | null
          origination_fee_pct?: number | null
          sort_order?: number | null
          term_years?: number | null
          tranche_name?: string | null
          uw_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_commercial_debt_uw_id_fkey"
            columns: ["uw_id"]
            isOneToOne: false
            referencedRelation: "deal_commercial_uw"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_commercial_expenses: {
        Row: {
          category: string
          created_at: string | null
          growth_rate: number | null
          id: string
          is_percentage: boolean | null
          sort_order: number | null
          t12_amount: number | null
          uw_id: string
          year_1_amount: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          growth_rate?: number | null
          id?: string
          is_percentage?: boolean | null
          sort_order?: number | null
          t12_amount?: number | null
          uw_id: string
          year_1_amount?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          growth_rate?: number | null
          id?: string
          is_percentage?: boolean | null
          sort_order?: number | null
          t12_amount?: number | null
          uw_id?: string
          year_1_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_commercial_expenses_uw_id_fkey"
            columns: ["uw_id"]
            isOneToOne: false
            referencedRelation: "deal_commercial_uw"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_commercial_income: {
        Row: {
          created_at: string | null
          growth_rate: number | null
          id: string
          is_deduction: boolean | null
          line_item: string
          sort_order: number | null
          t12_amount: number | null
          uw_id: string
          year_1_amount: number | null
        }
        Insert: {
          created_at?: string | null
          growth_rate?: number | null
          id?: string
          is_deduction?: boolean | null
          line_item: string
          sort_order?: number | null
          t12_amount?: number | null
          uw_id: string
          year_1_amount?: number | null
        }
        Update: {
          created_at?: string | null
          growth_rate?: number | null
          id?: string
          is_deduction?: boolean | null
          line_item?: string
          sort_order?: number | null
          t12_amount?: number | null
          uw_id?: string
          year_1_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_commercial_income_uw_id_fkey"
            columns: ["uw_id"]
            isOneToOne: false
            referencedRelation: "deal_commercial_uw"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_commercial_rent_roll: {
        Row: {
          bathrooms: number | null
          bedrooms: number | null
          created_at: string | null
          current_rent: number | null
          id: string
          lease_end: string | null
          lease_start: string | null
          market_rent: number | null
          sort_order: number | null
          sq_ft: number | null
          status: string | null
          tenant_name: string | null
          unit_number: string
          uw_id: string
        }
        Insert: {
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string | null
          current_rent?: number | null
          id?: string
          lease_end?: string | null
          lease_start?: string | null
          market_rent?: number | null
          sort_order?: number | null
          sq_ft?: number | null
          status?: string | null
          tenant_name?: string | null
          unit_number: string
          uw_id: string
        }
        Update: {
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string | null
          current_rent?: number | null
          id?: string
          lease_end?: string | null
          lease_start?: string | null
          market_rent?: number | null
          sort_order?: number | null
          sq_ft?: number | null
          status?: string | null
          tenant_name?: string | null
          unit_number?: string
          uw_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_commercial_rent_roll_uw_id_fkey"
            columns: ["uw_id"]
            isOneToOne: false
            referencedRelation: "deal_commercial_uw"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_commercial_scope_of_work: {
        Row: {
          created_at: string | null
          description: string | null
          estimated_cost: number | null
          id: string
          item_name: string
          sort_order: number | null
          uw_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          estimated_cost?: number | null
          id?: string
          item_name: string
          sort_order?: number | null
          uw_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          estimated_cost?: number | null
          id?: string
          item_name?: string
          sort_order?: number | null
          uw_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_commercial_scope_of_work_uw_id_fkey"
            columns: ["uw_id"]
            isOneToOne: false
            referencedRelation: "deal_commercial_uw"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_commercial_sources_uses: {
        Row: {
          amount: number | null
          created_at: string | null
          id: string
          line_item: string
          notes: string | null
          sort_order: number | null
          type: string
          uw_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          id?: string
          line_item: string
          notes?: string | null
          sort_order?: number | null
          type: string
          uw_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          id?: string
          line_item?: string
          notes?: string | null
          sort_order?: number | null
          type?: string
          uw_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_commercial_sources_uses_uw_id_fkey"
            columns: ["uw_id"]
            isOneToOne: false
            referencedRelation: "deal_commercial_uw"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_commercial_uw: {
        Row: {
          amortization_years: number | null
          capex_reserve: number | null
          closing_costs: number | null
          created_at: string | null
          created_by: string | null
          disposition_fee_pct: number | null
          exit_cap_rate: number | null
          hold_period_years: number | null
          id: string
          interest_rate: number | null
          io_period_months: number | null
          lender_name: string | null
          loan_amount: number | null
          loan_term_years: number | null
          loan_type: string | null
          lot_size_acres: number | null
          num_units: number | null
          opportunity_id: string
          origination_fee_pct: number | null
          prepay_schedule: string | null
          prepay_type: string | null
          property_address: string | null
          property_city: string | null
          property_name: string | null
          property_state: string | null
          property_type: string | null
          property_zip: string | null
          purchase_price: number | null
          sale_costs_pct: number | null
          status: string
          total_sf: number | null
          updated_at: string | null
          version: number
          working_capital: number | null
          year_built: number | null
          zoning: string | null
        }
        Insert: {
          amortization_years?: number | null
          capex_reserve?: number | null
          closing_costs?: number | null
          created_at?: string | null
          created_by?: string | null
          disposition_fee_pct?: number | null
          exit_cap_rate?: number | null
          hold_period_years?: number | null
          id?: string
          interest_rate?: number | null
          io_period_months?: number | null
          lender_name?: string | null
          loan_amount?: number | null
          loan_term_years?: number | null
          loan_type?: string | null
          lot_size_acres?: number | null
          num_units?: number | null
          opportunity_id: string
          origination_fee_pct?: number | null
          prepay_schedule?: string | null
          prepay_type?: string | null
          property_address?: string | null
          property_city?: string | null
          property_name?: string | null
          property_state?: string | null
          property_type?: string | null
          property_zip?: string | null
          purchase_price?: number | null
          sale_costs_pct?: number | null
          status?: string
          total_sf?: number | null
          updated_at?: string | null
          version?: number
          working_capital?: number | null
          year_built?: number | null
          zoning?: string | null
        }
        Update: {
          amortization_years?: number | null
          capex_reserve?: number | null
          closing_costs?: number | null
          created_at?: string | null
          created_by?: string | null
          disposition_fee_pct?: number | null
          exit_cap_rate?: number | null
          hold_period_years?: number | null
          id?: string
          interest_rate?: number | null
          io_period_months?: number | null
          lender_name?: string | null
          loan_amount?: number | null
          loan_term_years?: number | null
          loan_type?: string | null
          lot_size_acres?: number | null
          num_units?: number | null
          opportunity_id?: string
          origination_fee_pct?: number | null
          prepay_schedule?: string | null
          prepay_type?: string | null
          property_address?: string | null
          property_city?: string | null
          property_name?: string | null
          property_state?: string | null
          property_type?: string | null
          property_zip?: string | null
          purchase_price?: number | null
          sale_costs_pct?: number | null
          status?: string
          total_sf?: number | null
          updated_at?: string | null
          version?: number
          working_capital?: number | null
          year_built?: number | null
          zoning?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_commercial_uw_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: true
            referencedRelation: "unified_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_commercial_uw_history: {
        Row: {
          change_summary: string | null
          changed_by: string | null
          debt_snapshot: Json | null
          expenses_snapshot: Json | null
          id: string
          income_snapshot: Json | null
          opportunity_id: string
          rent_roll_snapshot: Json | null
          scope_of_work_snapshot: Json | null
          snapshot_at: string | null
          sources_uses_snapshot: Json | null
          uw_id: string
          uw_snapshot: Json
          waterfall_snapshot: Json | null
        }
        Insert: {
          change_summary?: string | null
          changed_by?: string | null
          debt_snapshot?: Json | null
          expenses_snapshot?: Json | null
          id?: string
          income_snapshot?: Json | null
          opportunity_id: string
          rent_roll_snapshot?: Json | null
          scope_of_work_snapshot?: Json | null
          snapshot_at?: string | null
          sources_uses_snapshot?: Json | null
          uw_id: string
          uw_snapshot: Json
          waterfall_snapshot?: Json | null
        }
        Update: {
          change_summary?: string | null
          changed_by?: string | null
          debt_snapshot?: Json | null
          expenses_snapshot?: Json | null
          id?: string
          income_snapshot?: Json | null
          opportunity_id?: string
          rent_roll_snapshot?: Json | null
          scope_of_work_snapshot?: Json | null
          snapshot_at?: string | null
          sources_uses_snapshot?: Json | null
          uw_id?: string
          uw_snapshot?: Json
          waterfall_snapshot?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_commercial_uw_history_uw_id_fkey"
            columns: ["uw_id"]
            isOneToOne: false
            referencedRelation: "deal_commercial_uw"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_commercial_waterfall: {
        Row: {
          created_at: string | null
          description: string | null
          hurdle_rate: number | null
          id: string
          investor_split: number | null
          is_catch_up: boolean | null
          sponsor_split: number | null
          tier_name: string
          tier_order: number
          uw_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          hurdle_rate?: number | null
          id?: string
          investor_split?: number | null
          is_catch_up?: boolean | null
          sponsor_split?: number | null
          tier_name: string
          tier_order: number
          uw_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          hurdle_rate?: number | null
          id?: string
          investor_split?: number | null
          is_catch_up?: boolean | null
          sponsor_split?: number | null
          tier_name?: string
          tier_order?: number
          uw_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_commercial_waterfall_uw_id_fkey"
            columns: ["uw_id"]
            isOneToOne: false
            referencedRelation: "deal_commercial_uw"
            referencedColumns: ["id"]
          },
        ]
      }
      delinquency_records: {
        Row: {
          amount_past_due: number
          days_delinquent: number
          delinquency_status: Database["public"]["Enums"]["delinquency_bucket"]
          id: string
          last_payment_amount: number | null
          last_payment_date: string | null
          late_fee_amount: number
          late_fee_assessed: boolean
          loan_id: string
          notes: string | null
          oldest_unpaid_billing_date: string | null
          updated_at: string
        }
        Insert: {
          amount_past_due?: number
          days_delinquent?: number
          delinquency_status?: Database["public"]["Enums"]["delinquency_bucket"]
          id?: string
          last_payment_amount?: number | null
          last_payment_date?: string | null
          late_fee_amount?: number
          late_fee_assessed?: boolean
          loan_id: string
          notes?: string | null
          oldest_unpaid_billing_date?: string | null
          updated_at?: string
        }
        Update: {
          amount_past_due?: number
          days_delinquent?: number
          delinquency_status?: Database["public"]["Enums"]["delinquency_bucket"]
          id?: string
          last_payment_amount?: number | null
          last_payment_date?: string | null
          late_fee_amount?: number
          late_fee_assessed?: boolean
          loan_id?: string
          notes?: string | null
          oldest_unpaid_billing_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delinquency_records_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "servicing_loans"
            referencedColumns: ["loan_id"]
          },
          {
            foreignKeyName: "delinquency_records_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "servicing_maturity_schedule"
            referencedColumns: ["loan_id"]
          },
        ]
      }
      dialer_call_groups: {
        Row: {
          calls: Json
          connected_contact_id: string | null
          created_at: string | null
          id: string
          list_id: string | null
          resolved: boolean | null
        }
        Insert: {
          calls?: Json
          connected_contact_id?: string | null
          created_at?: string | null
          id: string
          list_id?: string | null
          resolved?: boolean | null
        }
        Update: {
          calls?: Json
          connected_contact_id?: string | null
          created_at?: string | null
          id?: string
          list_id?: string | null
          resolved?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "dialer_call_groups_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "dialer_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      dialer_calls: {
        Row: {
          called_at: string | null
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
          called_at?: string | null
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
          called_at?: string | null
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
            foreignKeyName: "dialer_calls_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "dialer_calls_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["potential_duplicate_id"]
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
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
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
      dialer_list_contacts: {
        Row: {
          attempts: number | null
          contact_id: string
          created_at: string
          current_number_index: number | null
          disposition: string | null
          disposition_notes: string | null
          id: string
          last_attempted_at: string | null
          last_call_id: string | null
          list_id: string
          phone_numbers: Json | null
          position: number
          scheduled_callback: string | null
          status: string
        }
        Insert: {
          attempts?: number | null
          contact_id: string
          created_at?: string
          current_number_index?: number | null
          disposition?: string | null
          disposition_notes?: string | null
          id?: string
          last_attempted_at?: string | null
          last_call_id?: string | null
          list_id: string
          phone_numbers?: Json | null
          position: number
          scheduled_callback?: string | null
          status?: string
        }
        Update: {
          attempts?: number | null
          contact_id?: string
          created_at?: string
          current_number_index?: number | null
          disposition?: string | null
          disposition_notes?: string | null
          id?: string
          last_attempted_at?: string | null
          last_call_id?: string | null
          list_id?: string
          phone_numbers?: Json | null
          position?: number
          scheduled_callback?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "dialer_list_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dialer_list_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dialer_list_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "dialer_list_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["potential_duplicate_id"]
          },
          {
            foreignKeyName: "dialer_list_contacts_last_call_id_fkey"
            columns: ["last_call_id"]
            isOneToOne: false
            referencedRelation: "dialer_calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dialer_list_contacts_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "dialer_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      dialer_lists: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          completed_contacts: number | null
          created_at: string
          created_by: string | null
          current_position: number | null
          description: string | null
          id: string
          name: string
          settings: Json | null
          started_at: string | null
          status: string
          total_contacts: number | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_contacts?: number | null
          created_at?: string
          created_by?: string | null
          current_position?: number | null
          description?: string | null
          id?: string
          name: string
          settings?: Json | null
          started_at?: string | null
          status?: string
          total_contacts?: number | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_contacts?: number | null
          created_at?: string
          created_by?: string | null
          current_position?: number | null
          description?: string | null
          id?: string
          name?: string
          settings?: Json | null
          started_at?: string | null
          status?: string
          total_contacts?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dialer_lists_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
          {
            foreignKeyName: "dialer_lists_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dialer_lists_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
          {
            foreignKeyName: "dialer_lists_created_by_fkey"
            columns: ["created_by"]
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
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
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
          {
            foreignKeyName: "distributions_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors_portal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributions_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      document_review_items: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          confidence: number
          created_at: string
          current_value: string | null
          extraction_source: string | null
          field_label: string
          id: string
          proposed_value: string
          review_id: string
          status: string
          target_column: string
          target_json_path: string | null
          target_record_id: string | null
          target_table: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          confidence?: number
          created_at?: string
          current_value?: string | null
          extraction_source?: string | null
          field_label: string
          id?: string
          proposed_value: string
          review_id: string
          status?: string
          target_column: string
          target_json_path?: string | null
          target_record_id?: string | null
          target_table: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          confidence?: number
          created_at?: string
          current_value?: string | null
          extraction_source?: string | null
          field_label?: string
          id?: string
          proposed_value?: string
          review_id?: string
          status?: string
          target_column?: string
          target_json_path?: string | null
          target_record_id?: string | null
          target_table?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_review_items_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
          {
            foreignKeyName: "document_review_items_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_review_items_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "document_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      document_reviews: {
        Row: {
          created_at: string
          deal_id: string
          document_id: string
          document_type: string
          document_type_confidence: number | null
          error_message: string | null
          flags: string[] | null
          id: string
          model_used: string | null
          notes_draft: string | null
          processing_time_ms: number | null
          raw_extraction: Json | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          summary: string | null
          tokens_used: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deal_id: string
          document_id: string
          document_type?: string
          document_type_confidence?: number | null
          error_message?: string | null
          flags?: string[] | null
          id?: string
          model_used?: string | null
          notes_draft?: string | null
          processing_time_ms?: number | null
          raw_extraction?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          summary?: string | null
          tokens_used?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deal_id?: string
          document_id?: string
          document_type?: string
          document_type_confidence?: number | null
          error_message?: string | null
          flags?: string[] | null
          id?: string
          model_used?: string | null
          notes_draft?: string | null
          processing_time_ms?: number | null
          raw_extraction?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          summary?: string | null
          tokens_used?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_reviews_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "unified_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_reviews_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "unified_deal_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_reviews_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
          {
            foreignKeyName: "document_reviews_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          content: string | null
          created_at: string
          created_by: string
          description: string | null
          gdrive_file_id: string | null
          gdrive_folder_id: string | null
          id: string
          is_active: boolean
          merge_fields: Json
          name: string
          record_type: Database["public"]["Enums"]["record_type_enum"]
          requires_signature: boolean
          signature_roles: Json | null
          template_type: Database["public"]["Enums"]["template_type_enum"]
          updated_at: string
          version: number
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          gdrive_file_id?: string | null
          gdrive_folder_id?: string | null
          id?: string
          is_active?: boolean
          merge_fields?: Json
          name: string
          record_type: Database["public"]["Enums"]["record_type_enum"]
          requires_signature?: boolean
          signature_roles?: Json | null
          template_type: Database["public"]["Enums"]["template_type_enum"]
          updated_at?: string
          version?: number
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          gdrive_file_id?: string | null
          gdrive_folder_id?: string | null
          id?: string
          is_active?: boolean
          merge_fields?: Json
          name?: string
          record_type?: Database["public"]["Enums"]["record_type_enum"]
          requires_signature?: boolean
          signature_roles?: Json | null
          template_type?: Database["public"]["Enums"]["template_type_enum"]
          updated_at?: string
          version?: number
        }
        Relationships: []
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
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
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
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
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
      draw_documents: {
        Row: {
          budget_line_item_id: string | null
          document_type: Database["public"]["Enums"]["draw_document_type"]
          draw_request_id: string
          file_name: string
          file_path: string
          file_size_bytes: number | null
          geolocation_lat: number | null
          geolocation_lng: number | null
          id: string
          is_geotagged: boolean
          loan_id: string
          mime_type: string | null
          notes: string | null
          photo_taken_at: string | null
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          budget_line_item_id?: string | null
          document_type: Database["public"]["Enums"]["draw_document_type"]
          draw_request_id: string
          file_name: string
          file_path: string
          file_size_bytes?: number | null
          geolocation_lat?: number | null
          geolocation_lng?: number | null
          id?: string
          is_geotagged?: boolean
          loan_id: string
          mime_type?: string | null
          notes?: string | null
          photo_taken_at?: string | null
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          budget_line_item_id?: string | null
          document_type?: Database["public"]["Enums"]["draw_document_type"]
          draw_request_id?: string
          file_name?: string
          file_path?: string
          file_size_bytes?: number | null
          geolocation_lat?: number | null
          geolocation_lng?: number | null
          id?: string
          is_geotagged?: boolean
          loan_id?: string
          mime_type?: string | null
          notes?: string | null
          photo_taken_at?: string | null
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "draw_documents_budget_line_item_id_fkey"
            columns: ["budget_line_item_id"]
            isOneToOne: false
            referencedRelation: "budget_line_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draw_documents_draw_request_id_fkey"
            columns: ["draw_request_id"]
            isOneToOne: false
            referencedRelation: "draw_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draw_documents_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draw_documents_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      draw_request_line_items: {
        Row: {
          approval_status: Database["public"]["Enums"]["draw_line_item_approval_status"]
          approved_amount: number | null
          budget_line_item_id: string
          change_order_id: string | null
          draw_request_id: string
          id: string
          inspector_approved_percent: number | null
          line_item_remaining_amount: number | null
          line_item_revised_amount: number | null
          notes: string | null
          requested_amount: number
          requires_change_order: boolean
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["draw_line_item_approval_status"]
          approved_amount?: number | null
          budget_line_item_id: string
          change_order_id?: string | null
          draw_request_id: string
          id?: string
          inspector_approved_percent?: number | null
          line_item_remaining_amount?: number | null
          line_item_revised_amount?: number | null
          notes?: string | null
          requested_amount: number
          requires_change_order?: boolean
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["draw_line_item_approval_status"]
          approved_amount?: number | null
          budget_line_item_id?: string
          change_order_id?: string | null
          draw_request_id?: string
          id?: string
          inspector_approved_percent?: number | null
          line_item_remaining_amount?: number | null
          line_item_revised_amount?: number | null
          notes?: string | null
          requested_amount?: number
          requires_change_order?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "draw_request_line_items_budget_line_item_id_fkey"
            columns: ["budget_line_item_id"]
            isOneToOne: false
            referencedRelation: "budget_line_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draw_request_line_items_draw_request_id_fkey"
            columns: ["draw_request_id"]
            isOneToOne: false
            referencedRelation: "draw_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_draw_line_item_change_order"
            columns: ["change_order_id"]
            isOneToOne: false
            referencedRelation: "budget_change_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      draw_requests: {
        Row: {
          amount_approved: number | null
          amount_requested: number
          borrower_id: string | null
          borrower_notes: string | null
          completion_pct: number | null
          construction_budget_id: string | null
          created_at: string
          description: string | null
          document_urls: string[] | null
          draw_number: number
          funded_at: string | null
          id: string
          inspection_completed_date: string | null
          inspection_date: string | null
          inspection_ordered_date: string | null
          inspection_type:
            | Database["public"]["Enums"]["inspection_method"]
            | null
          inspector_id: string | null
          inspector_name: string | null
          internal_notes: string | null
          loan_event_id: string | null
          loan_id: string
          rejection_reason: string | null
          request_date: string | null
          request_number: string | null
          requested_by: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          reviewer_notes: string | null
          status: Database["public"]["Enums"]["draw_request_status"]
          submitted_at: string | null
          updated_at: string
          wire_amount: number | null
          wire_confirmation_number: string | null
          wire_date: string | null
          wire_initiated_by: string | null
        }
        Insert: {
          amount_approved?: number | null
          amount_requested: number
          borrower_id?: string | null
          borrower_notes?: string | null
          completion_pct?: number | null
          construction_budget_id?: string | null
          created_at?: string
          description?: string | null
          document_urls?: string[] | null
          draw_number: number
          funded_at?: string | null
          id?: string
          inspection_completed_date?: string | null
          inspection_date?: string | null
          inspection_ordered_date?: string | null
          inspection_type?:
            | Database["public"]["Enums"]["inspection_method"]
            | null
          inspector_id?: string | null
          inspector_name?: string | null
          internal_notes?: string | null
          loan_event_id?: string | null
          loan_id: string
          rejection_reason?: string | null
          request_date?: string | null
          request_number?: string | null
          requested_by?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["draw_request_status"]
          submitted_at?: string | null
          updated_at?: string
          wire_amount?: number | null
          wire_confirmation_number?: string | null
          wire_date?: string | null
          wire_initiated_by?: string | null
        }
        Update: {
          amount_approved?: number | null
          amount_requested?: number
          borrower_id?: string | null
          borrower_notes?: string | null
          completion_pct?: number | null
          construction_budget_id?: string | null
          created_at?: string
          description?: string | null
          document_urls?: string[] | null
          draw_number?: number
          funded_at?: string | null
          id?: string
          inspection_completed_date?: string | null
          inspection_date?: string | null
          inspection_ordered_date?: string | null
          inspection_type?:
            | Database["public"]["Enums"]["inspection_method"]
            | null
          inspector_id?: string | null
          inspector_name?: string | null
          internal_notes?: string | null
          loan_event_id?: string | null
          loan_id?: string
          rejection_reason?: string | null
          request_date?: string | null
          request_number?: string | null
          requested_by?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["draw_request_status"]
          submitted_at?: string | null
          updated_at?: string
          wire_amount?: number | null
          wire_confirmation_number?: string | null
          wire_date?: string | null
          wire_initiated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "draw_requests_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
          {
            foreignKeyName: "draw_requests_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draw_requests_construction_budget_id_fkey"
            columns: ["construction_budget_id"]
            isOneToOne: false
            referencedRelation: "construction_budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draw_requests_inspector_id_fkey"
            columns: ["inspector_id"]
            isOneToOne: false
            referencedRelation: "inspectors"
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
      dscr_base_rates: {
        Row: {
          base_price: number
          id: string
          note_rate: number
          product_id: string
        }
        Insert: {
          base_price: number
          id?: string
          note_rate: number
          product_id: string
        }
        Update: {
          base_price?: number
          id?: string
          note_rate?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dscr_base_rates_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "dscr_lender_products"
            referencedColumns: ["id"]
          },
        ]
      }
      dscr_fico_ltv_adjustments: {
        Row: {
          adjustment: number | null
          fico_label: string | null
          fico_max: number | null
          fico_min: number
          id: string
          loan_purpose: string
          ltv_label: string | null
          ltv_max: number
          ltv_min: number
          product_id: string
        }
        Insert: {
          adjustment?: number | null
          fico_label?: string | null
          fico_max?: number | null
          fico_min: number
          id?: string
          loan_purpose: string
          ltv_label?: string | null
          ltv_max: number
          ltv_min: number
          product_id: string
        }
        Update: {
          adjustment?: number | null
          fico_label?: string | null
          fico_max?: number | null
          fico_min?: number
          id?: string
          loan_purpose?: string
          ltv_label?: string | null
          ltv_max?: number
          ltv_min?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dscr_fico_ltv_adjustments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "dscr_lender_products"
            referencedColumns: ["id"]
          },
        ]
      }
      dscr_lender_products: {
        Row: {
          created_at: string | null
          desk_review_fee: number | null
          eligible_borrower_types: Json | null
          eligible_property_types: Json | null
          eligible_vesting: Json | null
          entity_review_fee: number | null
          floor_rate: number | null
          funding_fee: number | null
          id: string
          is_active: boolean | null
          lender_id: string
          lock_period_days: number | null
          max_financed_points: number | null
          max_loan_amount: number | null
          max_ltv_cashout: number | null
          max_ltv_purchase: number | null
          max_ltv_rate_term: number | null
          max_price: number | null
          min_loan_amount: number | null
          min_price: number | null
          min_rate: number | null
          notes: string | null
          other_fees: Json | null
          processing_fee: number | null
          product_name: string
          product_type: string
          rate_sheet_date: string | null
          rate_sheet_effective_at: string | null
          servicing: string | null
          state_license_required: Json | null
          state_restrictions: Json | null
          underwriting_fee: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          desk_review_fee?: number | null
          eligible_borrower_types?: Json | null
          eligible_property_types?: Json | null
          eligible_vesting?: Json | null
          entity_review_fee?: number | null
          floor_rate?: number | null
          funding_fee?: number | null
          id?: string
          is_active?: boolean | null
          lender_id: string
          lock_period_days?: number | null
          max_financed_points?: number | null
          max_loan_amount?: number | null
          max_ltv_cashout?: number | null
          max_ltv_purchase?: number | null
          max_ltv_rate_term?: number | null
          max_price?: number | null
          min_loan_amount?: number | null
          min_price?: number | null
          min_rate?: number | null
          notes?: string | null
          other_fees?: Json | null
          processing_fee?: number | null
          product_name: string
          product_type?: string
          rate_sheet_date?: string | null
          rate_sheet_effective_at?: string | null
          servicing?: string | null
          state_license_required?: Json | null
          state_restrictions?: Json | null
          underwriting_fee?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          desk_review_fee?: number | null
          eligible_borrower_types?: Json | null
          eligible_property_types?: Json | null
          eligible_vesting?: Json | null
          entity_review_fee?: number | null
          floor_rate?: number | null
          funding_fee?: number | null
          id?: string
          is_active?: boolean | null
          lender_id?: string
          lock_period_days?: number | null
          max_financed_points?: number | null
          max_loan_amount?: number | null
          max_ltv_cashout?: number | null
          max_ltv_purchase?: number | null
          max_ltv_rate_term?: number | null
          max_price?: number | null
          min_loan_amount?: number | null
          min_price?: number | null
          min_rate?: number | null
          notes?: string | null
          other_fees?: Json | null
          processing_fee?: number | null
          product_name?: string
          product_type?: string
          rate_sheet_date?: string | null
          rate_sheet_effective_at?: string | null
          servicing?: string | null
          state_license_required?: Json | null
          state_restrictions?: Json | null
          underwriting_fee?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dscr_lender_products_lender_id_fkey"
            columns: ["lender_id"]
            isOneToOne: false
            referencedRelation: "dscr_lenders"
            referencedColumns: ["id"]
          },
        ]
      }
      dscr_lenders: {
        Row: {
          account_executive: string | null
          ae_email: string | null
          ae_phone: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          nmls_id: string | null
          notes: string | null
          short_name: string
          updated_at: string | null
        }
        Insert: {
          account_executive?: string | null
          ae_email?: string | null
          ae_phone?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          nmls_id?: string | null
          notes?: string | null
          short_name: string
          updated_at?: string | null
        }
        Update: {
          account_executive?: string | null
          ae_email?: string | null
          ae_phone?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          nmls_id?: string | null
          notes?: string | null
          short_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      dscr_price_adjustments: {
        Row: {
          adj_ltv_0_50: number | null
          adj_ltv_50_55: number | null
          adj_ltv_55_60: number | null
          adj_ltv_60_65: number | null
          adj_ltv_65_70: number | null
          adj_ltv_70_75: number | null
          adj_ltv_75_80: number | null
          adj_ltv_80_85: number | null
          adj_ltv_85_90: number | null
          category: string
          condition_key: string
          condition_label: string
          id: string
          notes: string | null
          product_id: string
          sort_order: number | null
        }
        Insert: {
          adj_ltv_0_50?: number | null
          adj_ltv_50_55?: number | null
          adj_ltv_55_60?: number | null
          adj_ltv_60_65?: number | null
          adj_ltv_65_70?: number | null
          adj_ltv_70_75?: number | null
          adj_ltv_75_80?: number | null
          adj_ltv_80_85?: number | null
          adj_ltv_85_90?: number | null
          category: string
          condition_key: string
          condition_label: string
          id?: string
          notes?: string | null
          product_id: string
          sort_order?: number | null
        }
        Update: {
          adj_ltv_0_50?: number | null
          adj_ltv_50_55?: number | null
          adj_ltv_55_60?: number | null
          adj_ltv_60_65?: number | null
          adj_ltv_65_70?: number | null
          adj_ltv_70_75?: number | null
          adj_ltv_75_80?: number | null
          adj_ltv_80_85?: number | null
          adj_ltv_85_90?: number | null
          category?: string
          condition_key?: string
          condition_label?: string
          id?: string
          notes?: string | null
          product_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dscr_price_adjustments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "dscr_lender_products"
            referencedColumns: ["id"]
          },
        ]
      }
      dscr_pricing_runs: {
        Row: {
          best_execution_lender: string | null
          best_execution_price: number | null
          best_execution_rate: number | null
          borrower_entity: string | null
          borrower_name: string | null
          borrower_type: string
          broker_points: number | null
          created_at: string | null
          escrow_waiver: boolean | null
          fico_score: number
          id: string
          income_doc_type: string | null
          is_interest_only: boolean | null
          is_short_term_rental: boolean | null
          loan_amount: number
          loan_id: string | null
          loan_purpose: string
          lock_period_days: number | null
          ltv: number | null
          monthly_flood: number | null
          monthly_hoa: number | null
          monthly_insurance: number | null
          monthly_rent: number
          monthly_taxes: number | null
          num_units: number | null
          opportunity_id: string | null
          prepay_preference: string | null
          property_address: string | null
          property_city: string | null
          property_state: string
          property_type: string
          property_value: number
          property_zip: string | null
          quoted_at: string | null
          results: Json
          run_by: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          best_execution_lender?: string | null
          best_execution_price?: number | null
          best_execution_rate?: number | null
          borrower_entity?: string | null
          borrower_name?: string | null
          borrower_type?: string
          broker_points?: number | null
          created_at?: string | null
          escrow_waiver?: boolean | null
          fico_score: number
          id?: string
          income_doc_type?: string | null
          is_interest_only?: boolean | null
          is_short_term_rental?: boolean | null
          loan_amount: number
          loan_id?: string | null
          loan_purpose: string
          lock_period_days?: number | null
          ltv?: number | null
          monthly_flood?: number | null
          monthly_hoa?: number | null
          monthly_insurance?: number | null
          monthly_rent: number
          monthly_taxes?: number | null
          num_units?: number | null
          opportunity_id?: string | null
          prepay_preference?: string | null
          property_address?: string | null
          property_city?: string | null
          property_state: string
          property_type: string
          property_value: number
          property_zip?: string | null
          quoted_at?: string | null
          results?: Json
          run_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          best_execution_lender?: string | null
          best_execution_price?: number | null
          best_execution_rate?: number | null
          borrower_entity?: string | null
          borrower_name?: string | null
          borrower_type?: string
          broker_points?: number | null
          created_at?: string | null
          escrow_waiver?: boolean | null
          fico_score?: number
          id?: string
          income_doc_type?: string | null
          is_interest_only?: boolean | null
          is_short_term_rental?: boolean | null
          loan_amount?: number
          loan_id?: string | null
          loan_purpose?: string
          lock_period_days?: number | null
          ltv?: number | null
          monthly_flood?: number | null
          monthly_hoa?: number | null
          monthly_insurance?: number | null
          monthly_rent?: number
          monthly_taxes?: number | null
          num_units?: number | null
          opportunity_id?: string | null
          prepay_preference?: string | null
          property_address?: string | null
          property_city?: string | null
          property_state?: string
          property_type?: string
          property_value?: number
          property_zip?: string | null
          quoted_at?: string | null
          results?: Json
          run_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dscr_pricing_runs_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dscr_pricing_runs_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunity_pipeline"
            referencedColumns: ["id"]
          },
        ]
      }
      dscr_pricing_versions: {
        Row: {
          change_description: string | null
          change_type: string
          changed_at: string | null
          changed_by: string | null
          id: string
          lender_id: string | null
          lender_name: string | null
          product_id: string | null
          product_name: string | null
          snapshot: Json | null
          version: number
        }
        Insert: {
          change_description?: string | null
          change_type?: string
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          lender_id?: string | null
          lender_name?: string | null
          product_id?: string | null
          product_name?: string | null
          snapshot?: Json | null
          version?: number
        }
        Update: {
          change_description?: string | null
          change_type?: string
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          lender_id?: string | null
          lender_name?: string | null
          product_id?: string | null
          product_name?: string | null
          snapshot?: Json | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "dscr_pricing_versions_lender_id_fkey"
            columns: ["lender_id"]
            isOneToOne: false
            referencedRelation: "dscr_lenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dscr_pricing_versions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "dscr_lender_products"
            referencedColumns: ["id"]
          },
        ]
      }
      dscr_quotes: {
        Row: {
          borrower_email: string | null
          borrower_name: string | null
          broker_points: number | null
          created_at: string | null
          expires_at: string | null
          id: string
          loan_id: string | null
          pricing_run_id: string
          quote_pdf_path: string | null
          selected_lender_product_id: string | null
          selected_price: number | null
          selected_rate: number | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          borrower_email?: string | null
          borrower_name?: string | null
          broker_points?: number | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          loan_id?: string | null
          pricing_run_id: string
          quote_pdf_path?: string | null
          selected_lender_product_id?: string | null
          selected_price?: number | null
          selected_rate?: number | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          borrower_email?: string | null
          borrower_name?: string | null
          broker_points?: number | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          loan_id?: string | null
          pricing_run_id?: string
          quote_pdf_path?: string | null
          selected_lender_product_id?: string | null
          selected_price?: number | null
          selected_rate?: number | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dscr_quotes_pricing_run_id_fkey"
            columns: ["pricing_run_id"]
            isOneToOne: false
            referencedRelation: "dscr_pricing_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dscr_quotes_selected_lender_product_id_fkey"
            columns: ["selected_lender_product_id"]
            isOneToOne: false
            referencedRelation: "dscr_lender_products"
            referencedColumns: ["id"]
          },
        ]
      }
      dscr_rate_sheet_uploads: {
        Row: {
          created_at: string | null
          effective_date: string | null
          file_name: string
          file_path: string
          id: string
          lender_id: string
          parsed_at: string | null
          parsed_by: string | null
          parsing_notes: string | null
          parsing_status: string | null
          product_id: string | null
          raw_parsed_data: Json | null
        }
        Insert: {
          created_at?: string | null
          effective_date?: string | null
          file_name: string
          file_path: string
          id?: string
          lender_id: string
          parsed_at?: string | null
          parsed_by?: string | null
          parsing_notes?: string | null
          parsing_status?: string | null
          product_id?: string | null
          raw_parsed_data?: Json | null
        }
        Update: {
          created_at?: string | null
          effective_date?: string | null
          file_name?: string
          file_path?: string
          id?: string
          lender_id?: string
          parsed_at?: string | null
          parsed_by?: string | null
          parsing_notes?: string | null
          parsing_status?: string | null
          product_id?: string | null
          raw_parsed_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "dscr_rate_sheet_uploads_lender_id_fkey"
            columns: ["lender_id"]
            isOneToOne: false
            referencedRelation: "dscr_lenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dscr_rate_sheet_uploads_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "dscr_lender_products"
            referencedColumns: ["id"]
          },
        ]
      }
      dscr_underwriting: {
        Row: {
          amortization_months: number | null
          assumptions_json: Json | null
          borrower_type: string | null
          broker_comp: number | null
          cash_on_cash: number | null
          created_at: string | null
          created_by: string | null
          debt_yield: number | null
          dscr_ratio: number | null
          fico_score: number | null
          id: string
          income_doc_type: string | null
          interest_rate: number | null
          io_period_months: number | null
          is_active: boolean
          is_interest_only: boolean | null
          is_short_term_rental: boolean | null
          label: string | null
          loan_amount: number | null
          loan_id: string | null
          loan_purpose: string | null
          loan_term_months: number | null
          lock_period_days: number | null
          ltv: number | null
          monthly_flood: number | null
          monthly_hoa: number | null
          monthly_insurance: number | null
          monthly_pi: number | null
          monthly_pitia: number | null
          monthly_rent: number | null
          monthly_taxes: number | null
          notes: string | null
          num_units: number | null
          opportunity_id: string | null
          prepayment_type: string | null
          pricing_run_id: string | null
          property_type: string | null
          property_value: number | null
          scenario_id: string | null
          selected_lender: string | null
          selected_price: number | null
          selected_rate: number | null
          status: string
          updated_at: string | null
          version_number: number
        }
        Insert: {
          amortization_months?: number | null
          assumptions_json?: Json | null
          borrower_type?: string | null
          broker_comp?: number | null
          cash_on_cash?: number | null
          created_at?: string | null
          created_by?: string | null
          debt_yield?: number | null
          dscr_ratio?: number | null
          fico_score?: number | null
          id?: string
          income_doc_type?: string | null
          interest_rate?: number | null
          io_period_months?: number | null
          is_active?: boolean
          is_interest_only?: boolean | null
          is_short_term_rental?: boolean | null
          label?: string | null
          loan_amount?: number | null
          loan_id?: string | null
          loan_purpose?: string | null
          loan_term_months?: number | null
          lock_period_days?: number | null
          ltv?: number | null
          monthly_flood?: number | null
          monthly_hoa?: number | null
          monthly_insurance?: number | null
          monthly_pi?: number | null
          monthly_pitia?: number | null
          monthly_rent?: number | null
          monthly_taxes?: number | null
          notes?: string | null
          num_units?: number | null
          opportunity_id?: string | null
          prepayment_type?: string | null
          pricing_run_id?: string | null
          property_type?: string | null
          property_value?: number | null
          scenario_id?: string | null
          selected_lender?: string | null
          selected_price?: number | null
          selected_rate?: number | null
          status?: string
          updated_at?: string | null
          version_number?: number
        }
        Update: {
          amortization_months?: number | null
          assumptions_json?: Json | null
          borrower_type?: string | null
          broker_comp?: number | null
          cash_on_cash?: number | null
          created_at?: string | null
          created_by?: string | null
          debt_yield?: number | null
          dscr_ratio?: number | null
          fico_score?: number | null
          id?: string
          income_doc_type?: string | null
          interest_rate?: number | null
          io_period_months?: number | null
          is_active?: boolean
          is_interest_only?: boolean | null
          is_short_term_rental?: boolean | null
          label?: string | null
          loan_amount?: number | null
          loan_id?: string | null
          loan_purpose?: string | null
          loan_term_months?: number | null
          lock_period_days?: number | null
          ltv?: number | null
          monthly_flood?: number | null
          monthly_hoa?: number | null
          monthly_insurance?: number | null
          monthly_pi?: number | null
          monthly_pitia?: number | null
          monthly_rent?: number | null
          monthly_taxes?: number | null
          notes?: string | null
          num_units?: number | null
          opportunity_id?: string | null
          prepayment_type?: string | null
          pricing_run_id?: string | null
          property_type?: string | null
          property_value?: number | null
          scenario_id?: string | null
          selected_lender?: string | null
          selected_price?: number | null
          selected_rate?: number | null
          status?: string
          updated_at?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "dscr_underwriting_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
          {
            foreignKeyName: "dscr_underwriting_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dscr_underwriting_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dscr_underwriting_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dscr_underwriting_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dscr_underwriting_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunity_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dscr_underwriting_pricing_run_id_fkey"
            columns: ["pricing_run_id"]
            isOneToOne: false
            referencedRelation: "dscr_pricing_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dscr_underwriting_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "model_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      email_intake_queue: {
        Row: {
          attachments: Json
          body_preview: string | null
          created_at: string | null
          crm_email_id: string | null
          extracted_deal_fields: Json | null
          extracted_uw_fields: Json | null
          extraction_summary: string | null
          from_email: string
          from_name: string | null
          gmail_message_id: string
          id: string
          matched_contact_id: string | null
          received_at: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          resolved_deal_id: string | null
          status: string
          subject: string | null
          suggested_card_type_id: string | null
          updated_at: string | null
        }
        Insert: {
          attachments?: Json
          body_preview?: string | null
          created_at?: string | null
          crm_email_id?: string | null
          extracted_deal_fields?: Json | null
          extracted_uw_fields?: Json | null
          extraction_summary?: string | null
          from_email: string
          from_name?: string | null
          gmail_message_id: string
          id?: string
          matched_contact_id?: string | null
          received_at: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_deal_id?: string | null
          status?: string
          subject?: string | null
          suggested_card_type_id?: string | null
          updated_at?: string | null
        }
        Update: {
          attachments?: Json
          body_preview?: string | null
          created_at?: string | null
          crm_email_id?: string | null
          extracted_deal_fields?: Json | null
          extracted_uw_fields?: Json | null
          extraction_summary?: string | null
          from_email?: string
          from_name?: string | null
          gmail_message_id?: string
          id?: string
          matched_contact_id?: string | null
          received_at?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_deal_id?: string | null
          status?: string
          subject?: string | null
          suggested_card_type_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_intake_queue_crm_email_id_fkey"
            columns: ["crm_email_id"]
            isOneToOne: false
            referencedRelation: "crm_emails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_intake_queue_matched_contact_id_fkey"
            columns: ["matched_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_intake_queue_matched_contact_id_fkey"
            columns: ["matched_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_intake_queue_matched_contact_id_fkey"
            columns: ["matched_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "email_intake_queue_matched_contact_id_fkey"
            columns: ["matched_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["potential_duplicate_id"]
          },
          {
            foreignKeyName: "email_intake_queue_resolved_deal_id_fkey"
            columns: ["resolved_deal_id"]
            isOneToOne: false
            referencedRelation: "unified_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_intake_queue_suggested_card_type_id_fkey"
            columns: ["suggested_card_type_id"]
            isOneToOne: false
            referencedRelation: "unified_card_types"
            referencedColumns: ["id"]
          },
        ]
      }
      email_participants: {
        Row: {
          borrower_id: string | null
          contact_id: string | null
          created_at: string
          display_name: string | null
          email_address: string
          email_id: string
          id: string
          investor_id: string | null
          participant_role: string
          profile_id: string | null
        }
        Insert: {
          borrower_id?: string | null
          contact_id?: string | null
          created_at?: string
          display_name?: string | null
          email_address: string
          email_id: string
          id?: string
          investor_id?: string | null
          participant_role: string
          profile_id?: string | null
        }
        Update: {
          borrower_id?: string | null
          contact_id?: string | null
          created_at?: string
          display_name?: string | null
          email_address?: string
          email_id?: string
          id?: string
          investor_id?: string | null
          participant_role?: string
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_participants_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_participants_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers_portal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_participants_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_participants_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_participants_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_participants_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "email_participants_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["potential_duplicate_id"]
          },
          {
            foreignKeyName: "email_participants_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "crm_emails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_participants_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_participants_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors_portal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_participants_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
          {
            foreignKeyName: "email_participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      entity_contacts: {
        Row: {
          contact_id: string
          display_order: number | null
          entity_id: string
          id: string
          linked_at: string
          linked_by: string | null
          notes: string | null
          ownership_percentage: number | null
          role: string
          updated_at: string
        }
        Insert: {
          contact_id: string
          display_order?: number | null
          entity_id: string
          id?: string
          linked_at?: string
          linked_by?: string | null
          notes?: string | null
          ownership_percentage?: number | null
          role?: string
          updated_at?: string
        }
        Update: {
          contact_id?: string
          display_order?: number | null
          entity_id?: string
          id?: string
          linked_at?: string
          linked_by?: string | null
          notes?: string | null
          ownership_percentage?: number | null
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "entity_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["potential_duplicate_id"]
          },
          {
            foreignKeyName: "entity_contacts_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "borrower_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_contacts_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "borrower_entities_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      equity_deal_stage_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          deal_id: string
          duration_in_previous_stage: string | null
          from_stage: Database["public"]["Enums"]["equity_deal_stage"]
          id: string
          notes: string | null
          to_stage: Database["public"]["Enums"]["equity_deal_stage"]
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          deal_id: string
          duration_in_previous_stage?: string | null
          from_stage: Database["public"]["Enums"]["equity_deal_stage"]
          id?: string
          notes?: string | null
          to_stage: Database["public"]["Enums"]["equity_deal_stage"]
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          deal_id?: string
          duration_in_previous_stage?: string | null
          from_stage?: Database["public"]["Enums"]["equity_deal_stage"]
          id?: string
          notes?: string | null
          to_stage?: Database["public"]["Enums"]["equity_deal_stage"]
        }
        Relationships: [
          {
            foreignKeyName: "equity_deal_stage_history_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "equity_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equity_deal_stage_history_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["id"]
          },
        ]
      }
      equity_deal_tasks: {
        Row: {
          assigned_to: string | null
          category: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          deal_id: string
          description: string | null
          due_date: string | null
          id: string
          is_critical_path: boolean
          notes: string | null
          required_stage:
            | Database["public"]["Enums"]["equity_deal_stage"]
            | null
          responsible_party: string | null
          sort_order: number
          status: Database["public"]["Enums"]["equity_task_status"]
          task_name: string
          template_item_id: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          deal_id: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_critical_path?: boolean
          notes?: string | null
          required_stage?:
            | Database["public"]["Enums"]["equity_deal_stage"]
            | null
          responsible_party?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["equity_task_status"]
          task_name: string
          template_item_id?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          deal_id?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_critical_path?: boolean
          notes?: string | null
          required_stage?:
            | Database["public"]["Enums"]["equity_deal_stage"]
            | null
          responsible_party?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["equity_task_status"]
          task_name?: string
          template_item_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equity_deal_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
          {
            foreignKeyName: "equity_deal_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equity_deal_tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "equity_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equity_deal_tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equity_deal_tasks_template_item_id_fkey"
            columns: ["template_item_id"]
            isOneToOne: false
            referencedRelation: "equity_task_template_items"
            referencedColumns: ["id"]
          },
        ]
      }
      equity_deals: {
        Row: {
          actual_close_date: string | null
          asking_price: number | null
          assigned_to: string | null
          created_at: string
          deal_name: string
          deal_number: string | null
          deleted_at: string | null
          expected_close_date: string | null
          id: string
          internal_notes: string | null
          investment_thesis: string | null
          loss_reason: string | null
          notes: string | null
          offer_price: number | null
          property_id: string | null
          purchase_price: number | null
          source: Database["public"]["Enums"]["equity_deal_source"] | null
          stage: Database["public"]["Enums"]["equity_deal_stage"]
          stage_changed_at: string
          stage_changed_by: string | null
          target_irr: number | null
          updated_at: string
          value_add_strategy: string | null
        }
        Insert: {
          actual_close_date?: string | null
          asking_price?: number | null
          assigned_to?: string | null
          created_at?: string
          deal_name: string
          deal_number?: string | null
          deleted_at?: string | null
          expected_close_date?: string | null
          id?: string
          internal_notes?: string | null
          investment_thesis?: string | null
          loss_reason?: string | null
          notes?: string | null
          offer_price?: number | null
          property_id?: string | null
          purchase_price?: number | null
          source?: Database["public"]["Enums"]["equity_deal_source"] | null
          stage?: Database["public"]["Enums"]["equity_deal_stage"]
          stage_changed_at?: string
          stage_changed_by?: string | null
          target_irr?: number | null
          updated_at?: string
          value_add_strategy?: string | null
        }
        Update: {
          actual_close_date?: string | null
          asking_price?: number | null
          assigned_to?: string | null
          created_at?: string
          deal_name?: string
          deal_number?: string | null
          deleted_at?: string | null
          expected_close_date?: string | null
          id?: string
          internal_notes?: string | null
          investment_thesis?: string | null
          loss_reason?: string | null
          notes?: string | null
          offer_price?: number | null
          property_id?: string | null
          purchase_price?: number | null
          source?: Database["public"]["Enums"]["equity_deal_source"] | null
          stage?: Database["public"]["Enums"]["equity_deal_stage"]
          stage_changed_at?: string
          stage_changed_by?: string | null
          target_irr?: number | null
          updated_at?: string
          value_add_strategy?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equity_deals_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
          {
            foreignKeyName: "equity_deals_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equity_deals_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      equity_task_template_items: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          due_date_offset_days: number | null
          id: string
          is_critical_path: boolean
          required_stage:
            | Database["public"]["Enums"]["equity_deal_stage"]
            | null
          responsible_party: string | null
          sort_order: number
          task_name: string
          template_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          due_date_offset_days?: number | null
          id?: string
          is_critical_path?: boolean
          required_stage?:
            | Database["public"]["Enums"]["equity_deal_stage"]
            | null
          responsible_party?: string | null
          sort_order?: number
          task_name: string
          template_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          due_date_offset_days?: number | null
          id?: string
          is_critical_path?: boolean
          required_stage?:
            | Database["public"]["Enums"]["equity_deal_stage"]
            | null
          responsible_party?: string | null
          sort_order?: number
          task_name?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equity_task_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "equity_task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      equity_task_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_default: boolean
          name: string
          property_type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name: string
          property_type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          property_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      equity_underwriting: {
        Row: {
          capex_budget: number | null
          cash_on_cash: number | null
          created_at: string
          created_by: string | null
          deal_id: string
          debt_amount: number | null
          debt_ltv: number | null
          debt_rate: number | null
          equity_multiple: number | null
          equity_required: number | null
          exit_cap_rate: number | null
          expense_growth_pct: number | null
          going_in_cap_rate: number | null
          hold_period_years: number | null
          id: string
          is_active: boolean
          label: string | null
          levered_irr: number | null
          management_fee_pct: number | null
          noi_stabilized: number | null
          noi_year1: number | null
          notes: string | null
          rent_growth_pct: number | null
          scenario_id: string | null
          stabilized_cap_rate: number | null
          status: string
          total_project_cost: number | null
          unlevered_irr: number | null
          updated_at: string
          vacancy_rate_pct: number | null
          version_number: number
        }
        Insert: {
          capex_budget?: number | null
          cash_on_cash?: number | null
          created_at?: string
          created_by?: string | null
          deal_id: string
          debt_amount?: number | null
          debt_ltv?: number | null
          debt_rate?: number | null
          equity_multiple?: number | null
          equity_required?: number | null
          exit_cap_rate?: number | null
          expense_growth_pct?: number | null
          going_in_cap_rate?: number | null
          hold_period_years?: number | null
          id?: string
          is_active?: boolean
          label?: string | null
          levered_irr?: number | null
          management_fee_pct?: number | null
          noi_stabilized?: number | null
          noi_year1?: number | null
          notes?: string | null
          rent_growth_pct?: number | null
          scenario_id?: string | null
          stabilized_cap_rate?: number | null
          status?: string
          total_project_cost?: number | null
          unlevered_irr?: number | null
          updated_at?: string
          vacancy_rate_pct?: number | null
          version_number?: number
        }
        Update: {
          capex_budget?: number | null
          cash_on_cash?: number | null
          created_at?: string
          created_by?: string | null
          deal_id?: string
          debt_amount?: number | null
          debt_ltv?: number | null
          debt_rate?: number | null
          equity_multiple?: number | null
          equity_required?: number | null
          exit_cap_rate?: number | null
          expense_growth_pct?: number | null
          going_in_cap_rate?: number | null
          hold_period_years?: number | null
          id?: string
          is_active?: boolean
          label?: string | null
          levered_irr?: number | null
          management_fee_pct?: number | null
          noi_stabilized?: number | null
          noi_year1?: number | null
          notes?: string | null
          rent_growth_pct?: number | null
          scenario_id?: string | null
          stabilized_cap_rate?: number | null
          status?: string
          total_project_cost?: number | null
          unlevered_irr?: number | null
          updated_at?: string
          vacancy_rate_pct?: number | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "equity_underwriting_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
          {
            foreignKeyName: "equity_underwriting_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equity_underwriting_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "equity_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equity_underwriting_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equity_underwriting_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "model_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      field_configurations: {
        Row: {
          blocks_stage_progression: boolean
          column_span: string | null
          conditional_rules: Json | null
          created_at: string | null
          created_by: string | null
          default_value: string | null
          display_order: number | null
          dropdown_options: Json | null
          field_key: string
          field_label: string
          field_type: string
          formula_expression: string | null
          formula_source_fields: string[] | null
          help_text: string | null
          id: string
          is_admin_created: boolean
          is_archived: boolean
          is_filterable: boolean
          is_locked: boolean
          is_read_only: boolean
          is_required: boolean
          is_searchable: boolean
          is_sortable: boolean
          is_system: boolean
          is_unique: boolean
          is_visible: boolean
          module: string
          permissions: Json | null
          required_at_stage: string | null
          section_group: string | null
          track_changes: boolean
          type_config: Json | null
          updated_at: string | null
          updated_by: string | null
          validation_message: string | null
          validation_regex: string | null
        }
        Insert: {
          blocks_stage_progression?: boolean
          column_span?: string | null
          conditional_rules?: Json | null
          created_at?: string | null
          created_by?: string | null
          default_value?: string | null
          display_order?: number | null
          dropdown_options?: Json | null
          field_key: string
          field_label: string
          field_type: string
          formula_expression?: string | null
          formula_source_fields?: string[] | null
          help_text?: string | null
          id?: string
          is_admin_created?: boolean
          is_archived?: boolean
          is_filterable?: boolean
          is_locked?: boolean
          is_read_only?: boolean
          is_required?: boolean
          is_searchable?: boolean
          is_sortable?: boolean
          is_system?: boolean
          is_unique?: boolean
          is_visible?: boolean
          module: string
          permissions?: Json | null
          required_at_stage?: string | null
          section_group?: string | null
          track_changes?: boolean
          type_config?: Json | null
          updated_at?: string | null
          updated_by?: string | null
          validation_message?: string | null
          validation_regex?: string | null
        }
        Update: {
          blocks_stage_progression?: boolean
          column_span?: string | null
          conditional_rules?: Json | null
          created_at?: string | null
          created_by?: string | null
          default_value?: string | null
          display_order?: number | null
          dropdown_options?: Json | null
          field_key?: string
          field_label?: string
          field_type?: string
          formula_expression?: string | null
          formula_source_fields?: string[] | null
          help_text?: string | null
          id?: string
          is_admin_created?: boolean
          is_archived?: boolean
          is_filterable?: boolean
          is_locked?: boolean
          is_read_only?: boolean
          is_required?: boolean
          is_searchable?: boolean
          is_sortable?: boolean
          is_system?: boolean
          is_unique?: boolean
          is_visible?: boolean
          module?: string
          permissions?: Json | null
          required_at_stage?: string | null
          section_group?: string | null
          track_changes?: boolean
          type_config?: Json | null
          updated_at?: string | null
          updated_by?: string | null
          validation_message?: string | null
          validation_regex?: string | null
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
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
          {
            foreignKeyName: "funds_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_documents: {
        Row: {
          expires_at: string | null
          file_format: Database["public"]["Enums"]["doc_format_enum"]
          file_name: string
          gdrive_file_id: string | null
          generated_at: string
          generated_by: string
          id: string
          merge_data_snapshot: Json
          record_id: string
          record_type: Database["public"]["Enums"]["record_type_enum"]
          signature_details: Json | null
          signature_request_id: string | null
          signed_at: string | null
          signed_file_gdrive_id: string | null
          status: Database["public"]["Enums"]["doc_status_enum"]
          template_id: string
          template_version: number
        }
        Insert: {
          expires_at?: string | null
          file_format: Database["public"]["Enums"]["doc_format_enum"]
          file_name: string
          gdrive_file_id?: string | null
          generated_at?: string
          generated_by: string
          id?: string
          merge_data_snapshot?: Json
          record_id: string
          record_type: Database["public"]["Enums"]["record_type_enum"]
          signature_details?: Json | null
          signature_request_id?: string | null
          signed_at?: string | null
          signed_file_gdrive_id?: string | null
          status?: Database["public"]["Enums"]["doc_status_enum"]
          template_id: string
          template_version: number
        }
        Update: {
          expires_at?: string | null
          file_format?: Database["public"]["Enums"]["doc_format_enum"]
          file_name?: string
          gdrive_file_id?: string | null
          generated_at?: string
          generated_by?: string
          id?: string
          merge_data_snapshot?: Json
          record_id?: string
          record_type?: Database["public"]["Enums"]["record_type_enum"]
          signature_details?: Json | null
          signature_request_id?: string | null
          signed_at?: string | null
          signed_file_gdrive_id?: string | null
          status?: Database["public"]["Enums"]["doc_status_enum"]
          template_id?: string
          template_version?: number
        }
        Relationships: [
          {
            foreignKeyName: "generated_documents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "document_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      gmail_sync_state: {
        Row: {
          created_at: string
          error_message: string | null
          gmail_email: string
          history_id: number | null
          id: string
          last_full_sync_at: string | null
          last_sync_at: string | null
          messages_synced: number
          sync_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          gmail_email: string
          history_id?: number | null
          id?: string
          last_full_sync_at?: string | null
          last_sync_at?: string | null
          messages_synced?: number
          sync_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          gmail_email?: string
          history_id?: number | null
          id?: string
          last_full_sync_at?: string | null
          last_sync_at?: string | null
          messages_synced?: number
          sync_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gmail_tokens: {
        Row: {
          access_token: string
          connected_at: string | null
          email: string
          id: string
          is_active: boolean | null
          refresh_token: string
          scopes: string[] | null
          token_expires_at: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          connected_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          refresh_token: string
          scopes?: string[] | null
          token_expires_at: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          connected_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          refresh_token?: string
          scopes?: string[] | null
          token_expires_at?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      guc_underwriting: {
        Row: {
          assumptions_json: Json | null
          construction_io: boolean | null
          construction_loan_amount: number | null
          construction_ltc: number | null
          construction_rate: number | null
          construction_term_months: number | null
          construction_timeline_months: number | null
          contingency_pct: number | null
          created_at: string | null
          created_by: string | null
          draw_schedule_json: Json | null
          dscr_at_stabilization: number | null
          equity_multiple: number | null
          exit_cap_rate: number | null
          exit_loan_amount: number | null
          exit_rate: number | null
          exit_strategy: string | null
          exit_term_months: number | null
          hard_costs: number | null
          id: string
          is_active: boolean
          label: string | null
          land_acquisition_date: string | null
          land_cost: number | null
          loan_id: string | null
          lot_size_acres: number | null
          notes: string | null
          opportunity_id: string | null
          origination_fee_pct: number | null
          profit_on_cost: number | null
          projected_irr: number | null
          scenario_id: string | null
          soft_costs: number | null
          stabilized_noi: number | null
          stabilized_value: number | null
          status: string
          total_equity_required: number | null
          total_project_cost: number | null
          updated_at: string | null
          version_number: number
          yield_on_cost: number | null
          zoning: string | null
        }
        Insert: {
          assumptions_json?: Json | null
          construction_io?: boolean | null
          construction_loan_amount?: number | null
          construction_ltc?: number | null
          construction_rate?: number | null
          construction_term_months?: number | null
          construction_timeline_months?: number | null
          contingency_pct?: number | null
          created_at?: string | null
          created_by?: string | null
          draw_schedule_json?: Json | null
          dscr_at_stabilization?: number | null
          equity_multiple?: number | null
          exit_cap_rate?: number | null
          exit_loan_amount?: number | null
          exit_rate?: number | null
          exit_strategy?: string | null
          exit_term_months?: number | null
          hard_costs?: number | null
          id?: string
          is_active?: boolean
          label?: string | null
          land_acquisition_date?: string | null
          land_cost?: number | null
          loan_id?: string | null
          lot_size_acres?: number | null
          notes?: string | null
          opportunity_id?: string | null
          origination_fee_pct?: number | null
          profit_on_cost?: number | null
          projected_irr?: number | null
          scenario_id?: string | null
          soft_costs?: number | null
          stabilized_noi?: number | null
          stabilized_value?: number | null
          status?: string
          total_equity_required?: number | null
          total_project_cost?: number | null
          updated_at?: string | null
          version_number?: number
          yield_on_cost?: number | null
          zoning?: string | null
        }
        Update: {
          assumptions_json?: Json | null
          construction_io?: boolean | null
          construction_loan_amount?: number | null
          construction_ltc?: number | null
          construction_rate?: number | null
          construction_term_months?: number | null
          construction_timeline_months?: number | null
          contingency_pct?: number | null
          created_at?: string | null
          created_by?: string | null
          draw_schedule_json?: Json | null
          dscr_at_stabilization?: number | null
          equity_multiple?: number | null
          exit_cap_rate?: number | null
          exit_loan_amount?: number | null
          exit_rate?: number | null
          exit_strategy?: string | null
          exit_term_months?: number | null
          hard_costs?: number | null
          id?: string
          is_active?: boolean
          label?: string | null
          land_acquisition_date?: string | null
          land_cost?: number | null
          loan_id?: string | null
          lot_size_acres?: number | null
          notes?: string | null
          opportunity_id?: string | null
          origination_fee_pct?: number | null
          profit_on_cost?: number | null
          projected_irr?: number | null
          scenario_id?: string | null
          soft_costs?: number | null
          stabilized_noi?: number | null
          stabilized_value?: number | null
          status?: string
          total_equity_required?: number | null
          total_project_cost?: number | null
          updated_at?: string | null
          version_number?: number
          yield_on_cost?: number | null
          zoning?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guc_underwriting_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
          {
            foreignKeyName: "guc_underwriting_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guc_underwriting_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guc_underwriting_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guc_underwriting_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guc_underwriting_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunity_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guc_underwriting_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "model_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_line_item_assessments: {
        Row: {
          budget_line_item_id: string
          id: string
          inspection_report_id: string
          notes: string | null
          percent_complete: number
        }
        Insert: {
          budget_line_item_id: string
          id?: string
          inspection_report_id: string
          notes?: string | null
          percent_complete: number
        }
        Update: {
          budget_line_item_id?: string
          id?: string
          inspection_report_id?: string
          notes?: string | null
          percent_complete?: number
        }
        Relationships: [
          {
            foreignKeyName: "inspection_line_item_assessments_budget_line_item_id_fkey"
            columns: ["budget_line_item_id"]
            isOneToOne: false
            referencedRelation: "budget_line_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_line_item_assessments_inspection_report_id_fkey"
            columns: ["inspection_report_id"]
            isOneToOne: false
            referencedRelation: "inspection_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_reports: {
        Row: {
          created_at: string
          draw_request_id: string
          id: string
          inspection_date: string
          inspection_type: Database["public"]["Enums"]["inspection_report_type"]
          inspector_id: string | null
          loan_id: string
          notes: string | null
          overall_percent_complete: number
          report_pdf_path: string | null
          submitted_at: string
          submitted_by: string
        }
        Insert: {
          created_at?: string
          draw_request_id: string
          id?: string
          inspection_date: string
          inspection_type: Database["public"]["Enums"]["inspection_report_type"]
          inspector_id?: string | null
          loan_id: string
          notes?: string | null
          overall_percent_complete: number
          report_pdf_path?: string | null
          submitted_at?: string
          submitted_by: string
        }
        Update: {
          created_at?: string
          draw_request_id?: string
          id?: string
          inspection_date?: string
          inspection_type?: Database["public"]["Enums"]["inspection_report_type"]
          inspector_id?: string | null
          loan_id?: string
          notes?: string | null
          overall_percent_complete?: number
          report_pdf_path?: string | null
          submitted_at?: string
          submitted_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_reports_draw_request_id_fkey"
            columns: ["draw_request_id"]
            isOneToOne: false
            referencedRelation: "draw_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_reports_inspector_id_fkey"
            columns: ["inspector_id"]
            isOneToOne: false
            referencedRelation: "inspectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_reports_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_reports_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      inspectors: {
        Row: {
          active: boolean
          company: string | null
          created_at: string
          email: string | null
          has_portal_access: boolean
          id: string
          inspector_type: Database["public"]["Enums"]["inspector_type_enum"]
          name: string
          notes: string | null
          phone: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean
          company?: string | null
          created_at?: string
          email?: string | null
          has_portal_access?: boolean
          id?: string
          inspector_type?: Database["public"]["Enums"]["inspector_type_enum"]
          name: string
          notes?: string | null
          phone?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean
          company?: string | null
          created_at?: string
          email?: string | null
          has_portal_access?: boolean
          id?: string
          inspector_type?: Database["public"]["Enums"]["inspector_type_enum"]
          name?: string
          notes?: string | null
          phone?: string | null
          user_id?: string | null
        }
        Relationships: []
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
          {
            foreignKeyName: "investing_entities_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors_portal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investing_entities_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors_safe"
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
            foreignKeyName: "investor_commitments_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "investing_entities_safe"
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
          {
            foreignKeyName: "investor_commitments_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors_portal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_commitments_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      investors: {
        Row: {
          accreditation_status: string
          accreditation_verified_at: string | null
          created_at: string
          crm_contact_id: string | null
          id: string
          notes: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          accreditation_status?: string
          accreditation_verified_at?: string | null
          created_at?: string
          crm_contact_id?: string | null
          id?: string
          notes?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          accreditation_status?: string
          accreditation_verified_at?: string | null
          created_at?: string
          crm_contact_id?: string | null
          id?: string
          notes?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investors_crm_contact_id_fkey"
            columns: ["crm_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investors_crm_contact_id_fkey"
            columns: ["crm_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investors_crm_contact_id_fkey"
            columns: ["crm_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "investors_crm_contact_id_fkey"
            columns: ["crm_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["potential_duplicate_id"]
          },
        ]
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
          requires_approval: boolean | null
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
          requires_approval?: boolean | null
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
          requires_approval?: boolean | null
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
      loan_events: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          event_date: string
          event_type: Database["public"]["Enums"]["loan_event_type"]
          id: string
          loan_id: string
          note: string | null
          reference_id: string | null
          running_balance: number
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          event_date: string
          event_type: Database["public"]["Enums"]["loan_event_type"]
          id?: string
          loan_id: string
          note?: string | null
          reference_id?: string | null
          running_balance: number
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          event_date?: string
          event_type?: Database["public"]["Enums"]["loan_event_type"]
          id?: string
          loan_id?: string
          note?: string | null
          reference_id?: string | null
          running_balance?: number
        }
        Relationships: [
          {
            foreignKeyName: "loan_events_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "servicing_loans"
            referencedColumns: ["loan_id"]
          },
          {
            foreignKeyName: "loan_events_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "servicing_maturity_schedule"
            referencedColumns: ["loan_id"]
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
      loan_stage_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          duration_in_previous_stage: string | null
          from_stage: string
          id: string
          loan_id: string
          notes: string | null
          to_stage: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          duration_in_previous_stage?: string | null
          from_stage: string
          id?: string
          loan_id: string
          notes?: string | null
          to_stage: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          duration_in_previous_stage?: string | null
          from_stage?: string
          id?: string
          loan_id?: string
          notes?: string | null
          to_stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_stage_history_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_stage_history_loan_id_fkey"
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
          computation_status: string | null
          created_at: string
          created_by: string
          id: string
          input_completeness: Json | null
          is_active: boolean
          is_sandbox: boolean
          label: string | null
          loan_id: string | null
          model_type: string
          notes: string | null
          opportunity_id: string | null
          scenario_id: string | null
          status: string
          version_number: number
        }
        Insert: {
          calculator_inputs?: Json
          calculator_outputs?: Json
          computation_status?: string | null
          created_at?: string
          created_by: string
          id?: string
          input_completeness?: Json | null
          is_active?: boolean
          is_sandbox?: boolean
          label?: string | null
          loan_id?: string | null
          model_type?: string
          notes?: string | null
          opportunity_id?: string | null
          scenario_id?: string | null
          status?: string
          version_number?: number
        }
        Update: {
          calculator_inputs?: Json
          calculator_outputs?: Json
          computation_status?: string | null
          created_at?: string
          created_by?: string
          id?: string
          input_completeness?: Json | null
          is_active?: boolean
          is_sandbox?: boolean
          label?: string | null
          loan_id?: string | null
          model_type?: string
          notes?: string | null
          opportunity_id?: string | null
          scenario_id?: string | null
          status?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "loan_underwriting_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
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
          {
            foreignKeyName: "loan_underwriting_versions_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_underwriting_versions_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunity_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_underwriting_versions_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "model_scenarios"
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
          approval_decided_at: string | null
          approval_decided_by: string | null
          approval_notes: string | null
          approval_requested_at: string | null
          approval_requested_by: string | null
          approval_status: string | null
          approval_type: string | null
          arv: number | null
          as_is_value: number | null
          borrower_entity_id: string | null
          borrower_id: string | null
          broker_contact_id: string | null
          broker_fee_amount: number | null
          broker_fee_pct: number | null
          broker_sourced: boolean | null
          capital_partner: string | null
          cash_to_close: number | null
          clear_to_close_date: string | null
          closer_id: string | null
          closing_attorney_name: string | null
          closing_date: string | null
          co_borrower_name: string | null
          combined_liquidity: number | null
          combined_net_worth: number | null
          construction_budget_id: string | null
          created_at: string
          deal_programs: string[] | null
          debt_tranche: string | null
          default_rate: number | null
          deleted_at: string | null
          draw_count: number
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
          funding_channel: string | null
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
          investment_strategy: string | null
          is_in_flood_zone: boolean | null
          is_short_term_rental: boolean | null
          lease_type: string | null
          legal_fee: number | null
          loan_amount: number | null
          loan_number: string | null
          loan_term_months: number | null
          loan_type_interest: string[] | null
          loss_reason: string | null
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
          occupancy_pct: number | null
          opportunity_id: string | null
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
          prepayment_penalty_pct: number | null
          prepayment_penalty_type: string | null
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
          property_id: string | null
          property_state: string | null
          property_type: Database["public"]["Enums"]["property_type"] | null
          property_zip: string | null
          purchase_price: number | null
          purpose: Database["public"]["Enums"]["loan_purpose"]
          rehab_budget: number | null
          rehab_holdback: number | null
          rental_status: string | null
          salesforce_opportunity_id: string | null
          secondary_liens: boolean | null
          servicing_platform: string | null
          source_of_funds: string | null
          stage: Database["public"]["Enums"]["loan_status"]
          stage_history: Json | null
          stage_updated_at: string | null
          status: Database["public"]["Enums"]["loan_status"]
          title_company_contact: string | null
          title_company_email: string | null
          title_company_name: string | null
          title_company_phone: string | null
          total_draws_funded: number
          total_loan_amount: number | null
          type: Database["public"]["Enums"]["loan_type"]
          underwriter: string | null
          underwriter_id: string | null
          updated_at: string
          value_method: string | null
        }
        Insert: {
          ach_autopull_active?: boolean | null
          actual_close_date?: string | null
          after_repair_value?: number | null
          application_date?: string | null
          appraised_value?: number | null
          approval_date?: string | null
          approval_decided_at?: string | null
          approval_decided_by?: string | null
          approval_notes?: string | null
          approval_requested_at?: string | null
          approval_requested_by?: string | null
          approval_status?: string | null
          approval_type?: string | null
          arv?: number | null
          as_is_value?: number | null
          borrower_entity_id?: string | null
          borrower_id?: string | null
          broker_contact_id?: string | null
          broker_fee_amount?: number | null
          broker_fee_pct?: number | null
          broker_sourced?: boolean | null
          capital_partner?: string | null
          cash_to_close?: number | null
          clear_to_close_date?: string | null
          closer_id?: string | null
          closing_attorney_name?: string | null
          closing_date?: string | null
          co_borrower_name?: string | null
          combined_liquidity?: number | null
          combined_net_worth?: number | null
          construction_budget_id?: string | null
          created_at?: string
          deal_programs?: string[] | null
          debt_tranche?: string | null
          default_rate?: number | null
          deleted_at?: string | null
          draw_count?: number
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
          funding_channel?: string | null
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
          investment_strategy?: string | null
          is_in_flood_zone?: boolean | null
          is_short_term_rental?: boolean | null
          lease_type?: string | null
          legal_fee?: number | null
          loan_amount?: number | null
          loan_number?: string | null
          loan_term_months?: number | null
          loan_type_interest?: string[] | null
          loss_reason?: string | null
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
          occupancy_pct?: number | null
          opportunity_id?: string | null
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
          prepayment_penalty_pct?: number | null
          prepayment_penalty_type?: string | null
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
          property_id?: string | null
          property_state?: string | null
          property_type?: Database["public"]["Enums"]["property_type"] | null
          property_zip?: string | null
          purchase_price?: number | null
          purpose?: Database["public"]["Enums"]["loan_purpose"]
          rehab_budget?: number | null
          rehab_holdback?: number | null
          rental_status?: string | null
          salesforce_opportunity_id?: string | null
          secondary_liens?: boolean | null
          servicing_platform?: string | null
          source_of_funds?: string | null
          stage?: Database["public"]["Enums"]["loan_status"]
          stage_history?: Json | null
          stage_updated_at?: string | null
          status?: Database["public"]["Enums"]["loan_status"]
          title_company_contact?: string | null
          title_company_email?: string | null
          title_company_name?: string | null
          title_company_phone?: string | null
          total_draws_funded?: number
          total_loan_amount?: number | null
          type?: Database["public"]["Enums"]["loan_type"]
          underwriter?: string | null
          underwriter_id?: string | null
          updated_at?: string
          value_method?: string | null
        }
        Update: {
          ach_autopull_active?: boolean | null
          actual_close_date?: string | null
          after_repair_value?: number | null
          application_date?: string | null
          appraised_value?: number | null
          approval_date?: string | null
          approval_decided_at?: string | null
          approval_decided_by?: string | null
          approval_notes?: string | null
          approval_requested_at?: string | null
          approval_requested_by?: string | null
          approval_status?: string | null
          approval_type?: string | null
          arv?: number | null
          as_is_value?: number | null
          borrower_entity_id?: string | null
          borrower_id?: string | null
          broker_contact_id?: string | null
          broker_fee_amount?: number | null
          broker_fee_pct?: number | null
          broker_sourced?: boolean | null
          capital_partner?: string | null
          cash_to_close?: number | null
          clear_to_close_date?: string | null
          closer_id?: string | null
          closing_attorney_name?: string | null
          closing_date?: string | null
          co_borrower_name?: string | null
          combined_liquidity?: number | null
          combined_net_worth?: number | null
          construction_budget_id?: string | null
          created_at?: string
          deal_programs?: string[] | null
          debt_tranche?: string | null
          default_rate?: number | null
          deleted_at?: string | null
          draw_count?: number
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
          funding_channel?: string | null
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
          investment_strategy?: string | null
          is_in_flood_zone?: boolean | null
          is_short_term_rental?: boolean | null
          lease_type?: string | null
          legal_fee?: number | null
          loan_amount?: number | null
          loan_number?: string | null
          loan_term_months?: number | null
          loan_type_interest?: string[] | null
          loss_reason?: string | null
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
          occupancy_pct?: number | null
          opportunity_id?: string | null
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
          prepayment_penalty_pct?: number | null
          prepayment_penalty_type?: string | null
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
          property_id?: string | null
          property_state?: string | null
          property_type?: Database["public"]["Enums"]["property_type"] | null
          property_zip?: string | null
          purchase_price?: number | null
          purpose?: Database["public"]["Enums"]["loan_purpose"]
          rehab_budget?: number | null
          rehab_holdback?: number | null
          rental_status?: string | null
          salesforce_opportunity_id?: string | null
          secondary_liens?: boolean | null
          servicing_platform?: string | null
          source_of_funds?: string | null
          stage?: Database["public"]["Enums"]["loan_status"]
          stage_history?: Json | null
          stage_updated_at?: string | null
          status?: Database["public"]["Enums"]["loan_status"]
          title_company_contact?: string | null
          title_company_email?: string | null
          title_company_name?: string | null
          title_company_phone?: string | null
          total_draws_funded?: number
          total_loan_amount?: number | null
          type?: Database["public"]["Enums"]["loan_type"]
          underwriter?: string | null
          underwriter_id?: string | null
          updated_at?: string
          value_method?: string | null
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
            foreignKeyName: "loans_borrower_entity_id_fkey"
            columns: ["borrower_entity_id"]
            isOneToOne: false
            referencedRelation: "borrower_entities_safe"
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
            foreignKeyName: "loans_broker_contact_id_fkey"
            columns: ["broker_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "loans_broker_contact_id_fkey"
            columns: ["broker_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["potential_duplicate_id"]
          },
          {
            foreignKeyName: "loans_closer_id_fkey"
            columns: ["closer_id"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
          {
            foreignKeyName: "loans_closer_id_fkey"
            columns: ["closer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_construction_budget_id_fkey"
            columns: ["construction_budget_id"]
            isOneToOne: false
            referencedRelation: "construction_budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunity_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_originator_id_fkey"
            columns: ["originator_id"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
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
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
          {
            foreignKeyName: "loans_processor_id_fkey"
            columns: ["processor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_underwriter_id_fkey"
            columns: ["underwriter_id"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
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
      model_scenarios: {
        Row: {
          active_version_id: string | null
          created_at: string
          created_by: string
          deleted_at: string | null
          description: string | null
          equity_deal_id: string | null
          id: string
          loan_id: string | null
          model_type: string
          name: string
          opportunity_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          active_version_id?: string | null
          created_at?: string
          created_by: string
          deleted_at?: string | null
          description?: string | null
          equity_deal_id?: string | null
          id?: string
          loan_id?: string | null
          model_type: string
          name: string
          opportunity_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          active_version_id?: string | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          description?: string | null
          equity_deal_id?: string | null
          id?: string
          loan_id?: string | null
          model_type?: string
          name?: string
          opportunity_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_active_version"
            columns: ["active_version_id"]
            isOneToOne: false
            referencedRelation: "loan_underwriting_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_scenarios_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
          {
            foreignKeyName: "model_scenarios_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_scenarios_equity_deal_id_fkey"
            columns: ["equity_deal_id"]
            isOneToOne: false
            referencedRelation: "equity_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_scenarios_equity_deal_id_fkey"
            columns: ["equity_deal_id"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_scenarios_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_scenarios_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_scenarios_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_scenarios_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunity_pipeline"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          label: string
          name: string
          route_prefix: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          name: string
          route_prefix: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          name?: string
          route_prefix?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      note_likes: {
        Row: {
          created_at: string
          id: string
          note_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_likes_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_likes_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
          {
            foreignKeyName: "note_likes_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      note_mentions: {
        Row: {
          created_at: string
          id: string
          mentioned_user_id: string
          note_id: string
          notification_sent: boolean | null
        }
        Insert: {
          created_at?: string
          id?: string
          mentioned_user_id: string
          note_id: string
          notification_sent?: boolean | null
        }
        Update: {
          created_at?: string
          id?: string
          mentioned_user_id?: string
          note_id?: string
          notification_sent?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "note_mentions_mentioned_user_id_fkey"
            columns: ["mentioned_user_id"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
          {
            foreignKeyName: "note_mentions_mentioned_user_id_fkey"
            columns: ["mentioned_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_mentions_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          approval_id: string | null
          author_id: string
          author_name: string | null
          body: string
          company_id: string | null
          condition_id: string | null
          contact_id: string | null
          created_at: string
          deal_id: string | null
          deleted_at: string | null
          edited_at: string | null
          id: string
          is_edited: boolean | null
          is_internal: boolean
          is_pinned: boolean | null
          loan_id: string | null
          mentions: string[] | null
          opportunity_id: string | null
          parent_note_id: string | null
          pinned_at: string | null
          pinned_by: string | null
          project_id: string | null
          task_id: string | null
          unified_condition_id: string | null
          updated_at: string
        }
        Insert: {
          approval_id?: string | null
          author_id: string
          author_name?: string | null
          body: string
          company_id?: string | null
          condition_id?: string | null
          contact_id?: string | null
          created_at?: string
          deal_id?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          is_internal?: boolean
          is_pinned?: boolean | null
          loan_id?: string | null
          mentions?: string[] | null
          opportunity_id?: string | null
          parent_note_id?: string | null
          pinned_at?: string | null
          pinned_by?: string | null
          project_id?: string | null
          task_id?: string | null
          unified_condition_id?: string | null
          updated_at?: string
        }
        Update: {
          approval_id?: string | null
          author_id?: string
          author_name?: string | null
          body?: string
          company_id?: string | null
          condition_id?: string | null
          contact_id?: string | null
          created_at?: string
          deal_id?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          is_internal?: boolean
          is_pinned?: boolean | null
          loan_id?: string | null
          mentions?: string[] | null
          opportunity_id?: string | null
          parent_note_id?: string | null
          pinned_at?: string | null
          pinned_by?: string | null
          project_id?: string | null
          task_id?: string | null
          unified_condition_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_approval_id_fkey"
            columns: ["approval_id"]
            isOneToOne: false
            referencedRelation: "approval_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
          {
            foreignKeyName: "notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_condition_id_fkey"
            columns: ["condition_id"]
            isOneToOne: false
            referencedRelation: "loan_conditions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["potential_duplicate_id"]
          },
          {
            foreignKeyName: "notes_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "unified_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunity_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_parent_note_id_fkey"
            columns: ["parent_note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_pinned_by_fkey"
            columns: ["pinned_by"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
          {
            foreignKeyName: "notes_pinned_by_fkey"
            columns: ["pinned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ops_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "ops_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_unified_condition_id_fkey"
            columns: ["unified_condition_id"]
            isOneToOne: false
            referencedRelation: "unified_deal_conditions"
            referencedColumns: ["id"]
          },
        ]
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
          notification_slug: string
          notification_type_id: string | null
          priority: string
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
          notification_slug: string
          notification_type_id?: string | null
          priority?: string
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
          notification_slug?: string
          notification_type_id?: string | null
          priority?: string
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
      object_definitions: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string
          id: string
          is_system: boolean
          label: string
          object_key: string
          sort_order: number | null
          table_name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_system?: boolean
          label: string
          object_key: string
          sort_order?: number | null
          table_name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_system?: boolean
          label?: string
          object_key?: string
          sort_order?: number | null
          table_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      object_relationships: {
        Row: {
          allow_quick_create: boolean
          cardinality: string
          cascade_delete: boolean
          child_object_key: string
          created_at: string
          fk_column: string | null
          id: string
          inherited_fields: Json | null
          junction_table: string | null
          parent_object_key: string
          sort_order: number | null
          sync_direction: string
          updated_at: string
        }
        Insert: {
          allow_quick_create?: boolean
          cardinality?: string
          cascade_delete?: boolean
          child_object_key: string
          created_at?: string
          fk_column?: string | null
          id?: string
          inherited_fields?: Json | null
          junction_table?: string | null
          parent_object_key: string
          sort_order?: number | null
          sync_direction?: string
          updated_at?: string
        }
        Update: {
          allow_quick_create?: boolean
          cardinality?: string
          cascade_delete?: boolean
          child_object_key?: string
          created_at?: string
          fk_column?: string | null
          id?: string
          inherited_fields?: Json | null
          junction_table?: string | null
          parent_object_key?: string
          sort_order?: number | null
          sync_direction?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "object_relationships_child_object_key_fkey"
            columns: ["child_object_key"]
            isOneToOne: false
            referencedRelation: "object_definitions"
            referencedColumns: ["object_key"]
          },
          {
            foreignKeyName: "object_relationships_parent_object_key_fkey"
            columns: ["parent_object_key"]
            isOneToOne: false
            referencedRelation: "object_definitions"
            referencedColumns: ["object_key"]
          },
        ]
      }
      opportunities: {
        Row: {
          approval_decided_at: string | null
          approval_decided_by: string | null
          approval_notes: string | null
          approval_requested_at: string | null
          approval_requested_by: string | null
          approval_status: string | null
          approval_type: string | null
          assigned_underwriter: string | null
          borrower_entity_id: string | null
          capital_partner: string | null
          cash_to_close: number | null
          combined_liquidity: number | null
          combined_net_worth: number | null
          created_at: string
          created_by: string | null
          deal_name: string | null
          deal_programs: string[] | null
          debt_tranche: string | null
          funding_channel: string | null
          funding_source: string | null
          id: string
          internal_notes: string | null
          investment_strategy: string | null
          lease_type: string | null
          loan_id: string | null
          loan_purpose: string | null
          loan_type: string | null
          loan_type_interest: string[] | null
          loss_reason: string | null
          model_type: string | null
          occupancy_pct: number | null
          originator: string | null
          prepayment_penalty_months: number | null
          prepayment_penalty_pct: number | null
          prepayment_penalty_type: string | null
          prepayment_terms: string | null
          primary_residential_model: string | null
          processor: string | null
          property_id: string | null
          proposed_interest_rate: number | null
          proposed_loan_amount: number | null
          proposed_loan_term_months: number | null
          proposed_ltarv: number | null
          proposed_ltv: number | null
          rental_status: string | null
          secondary_liens: boolean | null
          source_of_funds: string | null
          stage: string
          stage_changed_at: string | null
          stage_changed_by: string | null
          updated_at: string
          value_method: string | null
        }
        Insert: {
          approval_decided_at?: string | null
          approval_decided_by?: string | null
          approval_notes?: string | null
          approval_requested_at?: string | null
          approval_requested_by?: string | null
          approval_status?: string | null
          approval_type?: string | null
          assigned_underwriter?: string | null
          borrower_entity_id?: string | null
          capital_partner?: string | null
          cash_to_close?: number | null
          combined_liquidity?: number | null
          combined_net_worth?: number | null
          created_at?: string
          created_by?: string | null
          deal_name?: string | null
          deal_programs?: string[] | null
          debt_tranche?: string | null
          funding_channel?: string | null
          funding_source?: string | null
          id?: string
          internal_notes?: string | null
          investment_strategy?: string | null
          lease_type?: string | null
          loan_id?: string | null
          loan_purpose?: string | null
          loan_type?: string | null
          loan_type_interest?: string[] | null
          loss_reason?: string | null
          model_type?: string | null
          occupancy_pct?: number | null
          originator?: string | null
          prepayment_penalty_months?: number | null
          prepayment_penalty_pct?: number | null
          prepayment_penalty_type?: string | null
          prepayment_terms?: string | null
          primary_residential_model?: string | null
          processor?: string | null
          property_id?: string | null
          proposed_interest_rate?: number | null
          proposed_loan_amount?: number | null
          proposed_loan_term_months?: number | null
          proposed_ltarv?: number | null
          proposed_ltv?: number | null
          rental_status?: string | null
          secondary_liens?: boolean | null
          source_of_funds?: string | null
          stage?: string
          stage_changed_at?: string | null
          stage_changed_by?: string | null
          updated_at?: string
          value_method?: string | null
        }
        Update: {
          approval_decided_at?: string | null
          approval_decided_by?: string | null
          approval_notes?: string | null
          approval_requested_at?: string | null
          approval_requested_by?: string | null
          approval_status?: string | null
          approval_type?: string | null
          assigned_underwriter?: string | null
          borrower_entity_id?: string | null
          capital_partner?: string | null
          cash_to_close?: number | null
          combined_liquidity?: number | null
          combined_net_worth?: number | null
          created_at?: string
          created_by?: string | null
          deal_name?: string | null
          deal_programs?: string[] | null
          debt_tranche?: string | null
          funding_channel?: string | null
          funding_source?: string | null
          id?: string
          internal_notes?: string | null
          investment_strategy?: string | null
          lease_type?: string | null
          loan_id?: string | null
          loan_purpose?: string | null
          loan_type?: string | null
          loan_type_interest?: string[] | null
          loss_reason?: string | null
          model_type?: string | null
          occupancy_pct?: number | null
          originator?: string | null
          prepayment_penalty_months?: number | null
          prepayment_penalty_pct?: number | null
          prepayment_penalty_type?: string | null
          prepayment_terms?: string | null
          primary_residential_model?: string | null
          processor?: string | null
          property_id?: string | null
          proposed_interest_rate?: number | null
          proposed_loan_amount?: number | null
          proposed_loan_term_months?: number | null
          proposed_ltarv?: number | null
          proposed_ltv?: number | null
          rental_status?: string | null
          secondary_liens?: boolean | null
          source_of_funds?: string | null
          stage?: string
          stage_changed_at?: string | null
          stage_changed_by?: string | null
          updated_at?: string
          value_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_borrower_entity_id_fkey"
            columns: ["borrower_entity_id"]
            isOneToOne: false
            referencedRelation: "borrower_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_borrower_entity_id_fkey"
            columns: ["borrower_entity_id"]
            isOneToOne: false
            referencedRelation: "borrower_entities_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_borrowers: {
        Row: {
          borrower_id: string
          created_at: string
          credit_report_date_at_intake: string | null
          credit_score_at_intake: number | null
          id: string
          notes: string | null
          opportunity_id: string
          role: string | null
          sort_order: number | null
          stated_liquidity_at_intake: number | null
          stated_net_worth_at_intake: number | null
          verified_liquidity_at_intake: number | null
          verified_net_worth_at_intake: number | null
        }
        Insert: {
          borrower_id: string
          created_at?: string
          credit_report_date_at_intake?: string | null
          credit_score_at_intake?: number | null
          id?: string
          notes?: string | null
          opportunity_id: string
          role?: string | null
          sort_order?: number | null
          stated_liquidity_at_intake?: number | null
          stated_net_worth_at_intake?: number | null
          verified_liquidity_at_intake?: number | null
          verified_net_worth_at_intake?: number | null
        }
        Update: {
          borrower_id?: string
          created_at?: string
          credit_report_date_at_intake?: string | null
          credit_score_at_intake?: number | null
          id?: string
          notes?: string | null
          opportunity_id?: string
          role?: string | null
          sort_order?: number | null
          stated_liquidity_at_intake?: number | null
          stated_net_worth_at_intake?: number | null
          verified_liquidity_at_intake?: number | null
          verified_net_worth_at_intake?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_borrowers_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_borrowers_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers_portal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_borrowers_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_borrowers_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_borrowers_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunity_pipeline"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_contacts: {
        Row: {
          contact_id: string
          display_order: number | null
          id: string
          is_primary: boolean
          linked_at: string
          linked_by: string | null
          notes: string | null
          opportunity_id: string
          role: string
          updated_at: string
        }
        Insert: {
          contact_id: string
          display_order?: number | null
          id?: string
          is_primary?: boolean
          linked_at?: string
          linked_by?: string | null
          notes?: string | null
          opportunity_id: string
          role?: string
          updated_at?: string
        }
        Update: {
          contact_id?: string
          display_order?: number | null
          id?: string
          is_primary?: boolean
          linked_at?: string
          linked_by?: string | null
          notes?: string | null
          opportunity_id?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "opportunity_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["potential_duplicate_id"]
          },
          {
            foreignKeyName: "opportunity_contacts_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_contacts_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunity_pipeline"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_properties: {
        Row: {
          display_order: number | null
          id: string
          is_primary: boolean
          linked_at: string
          linked_by: string | null
          notes: string | null
          opportunity_id: string
          property_id: string
          role: string
          updated_at: string
        }
        Insert: {
          display_order?: number | null
          id?: string
          is_primary?: boolean
          linked_at?: string
          linked_by?: string | null
          notes?: string | null
          opportunity_id: string
          property_id: string
          role?: string
          updated_at?: string
        }
        Update: {
          display_order?: number | null
          id?: string
          is_primary?: boolean
          linked_at?: string
          linked_by?: string | null
          notes?: string | null
          opportunity_id?: string
          property_id?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_properties_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_properties_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunity_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_stage_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          duration_in_previous_stage: string | null
          from_stage: string
          id: string
          notes: string | null
          opportunity_id: string
          to_stage: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          duration_in_previous_stage?: string | null
          from_stage: string
          id?: string
          notes?: string | null
          opportunity_id: string
          to_stage: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          duration_in_previous_stage?: string | null
          from_stage?: string
          id?: string
          notes?: string | null
          opportunity_id?: string
          to_stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_stage_history_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_stage_history_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunity_pipeline"
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
          sort_order: number
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
          sort_order?: number
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
          sort_order?: number
          started_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ops_projects_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
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
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
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
      ops_task_attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_size_bytes: number | null
          file_type: string | null
          id: string
          storage_path: string
          task_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size_bytes?: number | null
          file_type?: string | null
          id?: string
          storage_path: string
          task_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size_bytes?: number | null
          file_type?: string | null
          id?: string
          storage_path?: string
          task_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ops_task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "ops_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ops_task_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
          {
            foreignKeyName: "ops_task_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_tasks: {
        Row: {
          active_party: string | null
          amount: number | null
          approval_status: string | null
          approved_at: string | null
          assigned_to: string | null
          assigned_to_name: string | null
          category: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          decision_note: string | null
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
          previous_incomplete: boolean | null
          priority: string
          project_id: string | null
          recurrence_day_of_month: number | null
          recurrence_day_of_week: number | null
          recurrence_days_of_week: number[] | null
          recurrence_end_date: string | null
          recurrence_monthly_when: string | null
          recurrence_pattern: string | null
          recurrence_period: string | null
          recurrence_repeat_interval: number | null
          recurrence_start_date: string | null
          recurring_series_id: string | null
          recurring_template_id: string | null
          rejected_at: string | null
          requestor_name: string | null
          requestor_user_id: string | null
          resubmitted_at: string | null
          revision_count: number | null
          sort_order: number
          source_task_id: string | null
          status: string
          title: string
          type: string
          updated_at: string | null
          workflow_instance_id: string | null
          workflow_rule_id: string | null
        }
        Insert: {
          active_party?: string | null
          amount?: number | null
          approval_status?: string | null
          approved_at?: string | null
          assigned_to?: string | null
          assigned_to_name?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          decision_note?: string | null
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
          previous_incomplete?: boolean | null
          priority?: string
          project_id?: string | null
          recurrence_day_of_month?: number | null
          recurrence_day_of_week?: number | null
          recurrence_days_of_week?: number[] | null
          recurrence_end_date?: string | null
          recurrence_monthly_when?: string | null
          recurrence_pattern?: string | null
          recurrence_period?: string | null
          recurrence_repeat_interval?: number | null
          recurrence_start_date?: string | null
          recurring_series_id?: string | null
          recurring_template_id?: string | null
          rejected_at?: string | null
          requestor_name?: string | null
          requestor_user_id?: string | null
          resubmitted_at?: string | null
          revision_count?: number | null
          sort_order?: number
          source_task_id?: string | null
          status?: string
          title: string
          type?: string
          updated_at?: string | null
          workflow_instance_id?: string | null
          workflow_rule_id?: string | null
        }
        Update: {
          active_party?: string | null
          amount?: number | null
          approval_status?: string | null
          approved_at?: string | null
          assigned_to?: string | null
          assigned_to_name?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          decision_note?: string | null
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
          previous_incomplete?: boolean | null
          priority?: string
          project_id?: string | null
          recurrence_day_of_month?: number | null
          recurrence_day_of_week?: number | null
          recurrence_days_of_week?: number[] | null
          recurrence_end_date?: string | null
          recurrence_monthly_when?: string | null
          recurrence_pattern?: string | null
          recurrence_period?: string | null
          recurrence_repeat_interval?: number | null
          recurrence_start_date?: string | null
          recurring_series_id?: string | null
          recurring_template_id?: string | null
          rejected_at?: string | null
          requestor_name?: string | null
          requestor_user_id?: string | null
          resubmitted_at?: string | null
          revision_count?: number | null
          sort_order?: number
          source_task_id?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string | null
          workflow_instance_id?: string | null
          workflow_rule_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ops_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
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
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
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
            foreignKeyName: "ops_tasks_recurring_template_id_fkey"
            columns: ["recurring_template_id"]
            isOneToOne: false
            referencedRelation: "recurring_task_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ops_tasks_source_task_id_fkey"
            columns: ["source_task_id"]
            isOneToOne: false
            referencedRelation: "ops_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ops_tasks_workflow_instance_id_fkey"
            columns: ["workflow_instance_id"]
            isOneToOne: false
            referencedRelation: "workflow_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ops_tasks_workflow_rule_id_fkey"
            columns: ["workflow_rule_id"]
            isOneToOne: false
            referencedRelation: "workflow_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      page_layout_fields: {
        Row: {
          column_position: string
          column_span: string | null
          created_at: string
          display_order: number
          field_config_id: string | null
          field_key: string
          id: string
          is_visible: boolean
          section_id: string
          source: string
          source_object_key: string | null
        }
        Insert: {
          column_position?: string
          column_span?: string | null
          created_at?: string
          display_order?: number
          field_config_id?: string | null
          field_key: string
          id?: string
          is_visible?: boolean
          section_id: string
          source?: string
          source_object_key?: string | null
        }
        Update: {
          column_position?: string
          column_span?: string | null
          created_at?: string
          display_order?: number
          field_config_id?: string | null
          field_key?: string
          id?: string
          is_visible?: boolean
          section_id?: string
          source?: string
          source_object_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_layout_fields_field_config_id_fkey"
            columns: ["field_config_id"]
            isOneToOne: false
            referencedRelation: "field_configurations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_layout_fields_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "page_layout_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      page_layout_sections: {
        Row: {
          card_type_id: string | null
          created_at: string
          default_collapsed: boolean | null
          display_order: number
          id: string
          is_locked: boolean
          is_visible: boolean
          page_type: string
          relationship_id: string | null
          section_icon: string
          section_key: string
          section_label: string
          section_type: string
          sidebar: boolean
          tab_icon: string | null
          tab_key: string | null
          tab_label: string | null
          tab_locked: boolean | null
          tab_order: number | null
          updated_at: string
          visibility_rule: string | null
        }
        Insert: {
          card_type_id?: string | null
          created_at?: string
          default_collapsed?: boolean | null
          display_order?: number
          id?: string
          is_locked?: boolean
          is_visible?: boolean
          page_type: string
          relationship_id?: string | null
          section_icon?: string
          section_key: string
          section_label: string
          section_type?: string
          sidebar?: boolean
          tab_icon?: string | null
          tab_key?: string | null
          tab_label?: string | null
          tab_locked?: boolean | null
          tab_order?: number | null
          updated_at?: string
          visibility_rule?: string | null
        }
        Update: {
          card_type_id?: string | null
          created_at?: string
          default_collapsed?: boolean | null
          display_order?: number
          id?: string
          is_locked?: boolean
          is_visible?: boolean
          page_type?: string
          relationship_id?: string | null
          section_icon?: string
          section_key?: string
          section_label?: string
          section_type?: string
          sidebar?: boolean
          tab_icon?: string | null
          tab_key?: string | null
          tab_label?: string | null
          tab_locked?: boolean | null
          tab_order?: number | null
          updated_at?: string
          visibility_rule?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_layout_sections_card_type_id_fkey"
            columns: ["card_type_id"]
            isOneToOne: false
            referencedRelation: "unified_card_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_layout_sections_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "object_relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      payoff_fee_defaults: {
        Row: {
          created_at: string
          default_amount: number
          fee_label: string
          fee_name: string
          id: string
          is_active: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_amount?: number
          fee_label: string
          fee_name: string
          id?: string
          is_active?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_amount?: number
          fee_label?: string
          fee_name?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      payoff_statements: {
        Row: {
          accrued_interest: number
          borrower_name: string | null
          entity_name: string | null
          exit_fee: number
          fee_overrides: Json | null
          file_url: string | null
          generated_at: string
          generated_by: string | null
          good_through_date: string
          id: string
          interest_rate: number
          loan_id: string
          notes: string | null
          other_fees: number
          outstanding_late_fees: number
          per_diem: number
          prepayment_penalty: number
          property_address: string | null
          release_fee: number
          sent_at: string | null
          sent_to: string | null
          servicing_loan_id: string | null
          status: string
          storage_path: string | null
          total_payoff: number
          unpaid_principal: number
          wire_fee: number
        }
        Insert: {
          accrued_interest?: number
          borrower_name?: string | null
          entity_name?: string | null
          exit_fee?: number
          fee_overrides?: Json | null
          file_url?: string | null
          generated_at?: string
          generated_by?: string | null
          good_through_date: string
          id?: string
          interest_rate: number
          loan_id: string
          notes?: string | null
          other_fees?: number
          outstanding_late_fees?: number
          per_diem: number
          prepayment_penalty?: number
          property_address?: string | null
          release_fee?: number
          sent_at?: string | null
          sent_to?: string | null
          servicing_loan_id?: string | null
          status?: string
          storage_path?: string | null
          total_payoff: number
          unpaid_principal: number
          wire_fee?: number
        }
        Update: {
          accrued_interest?: number
          borrower_name?: string | null
          entity_name?: string | null
          exit_fee?: number
          fee_overrides?: Json | null
          file_url?: string | null
          generated_at?: string
          generated_by?: string | null
          good_through_date?: string
          id?: string
          interest_rate?: number
          loan_id?: string
          notes?: string | null
          other_fees?: number
          outstanding_late_fees?: number
          per_diem?: number
          prepayment_penalty?: number
          property_address?: string | null
          release_fee?: number
          sent_at?: string | null
          sent_to?: string | null
          servicing_loan_id?: string | null
          status?: string
          storage_path?: string | null
          total_payoff?: number
          unpaid_principal?: number
          wire_fee?: number
        }
        Relationships: [
          {
            foreignKeyName: "payoff_statements_servicing_loan_id_fkey"
            columns: ["servicing_loan_id"]
            isOneToOne: false
            referencedRelation: "servicing_loans"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_stage_config: {
        Row: {
          color: string | null
          created_at: string
          id: string
          is_terminal: boolean
          label: string
          pipeline_type: string
          sla_days: number | null
          sort_order: number
          stage_key: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          is_terminal?: boolean
          label: string
          pipeline_type: string
          sla_days?: number | null
          sort_order?: number
          stage_key: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          is_terminal?: boolean
          label?: string
          pipeline_type?: string
          sla_days?: number | null
          sort_order?: number
          stage_key?: string
        }
        Relationships: []
      }
      pipeline_stage_rules: {
        Row: {
          created_at: string | null
          error_message: string | null
          field_key: string
          id: string
          stage_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          field_key: string
          id?: string
          stage_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          field_key?: string
          id?: string
          stage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stage_rules_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_stages: {
        Row: {
          alert_days: number
          color: string
          created_at: string | null
          id: string
          name: string
          stage_key: string
          stage_order: number
          updated_at: string | null
          warn_days: number
        }
        Insert: {
          alert_days?: number
          color?: string
          created_at?: string | null
          id?: string
          name: string
          stage_key: string
          stage_order: number
          updated_at?: string | null
          warn_days?: number
        }
        Update: {
          alert_days?: number
          color?: string
          created_at?: string | null
          id?: string
          name?: string
          stage_key?: string
          stage_order?: number
          updated_at?: string | null
          warn_days?: number
        }
        Relationships: []
      }
      portal_activity_log: {
        Row: {
          action_type: string
          component: string | null
          created_at: string
          department: string | null
          duration_ms: number | null
          id: string
          metadata: Json | null
          page_path: string | null
          profile_id: string | null
          role: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          component?: string | null
          created_at?: string
          department?: string | null
          duration_ms?: number | null
          id?: string
          metadata?: Json | null
          page_path?: string | null
          profile_id?: string | null
          role?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          component?: string | null
          created_at?: string
          department?: string | null
          duration_ms?: number | null
          id?: string
          metadata?: Json | null
          page_path?: string | null
          profile_id?: string | null
          role?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_activity_log_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
          {
            foreignKeyName: "portal_activity_log_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_documents: {
        Row: {
          borrower_entity_id: string | null
          borrower_id: string | null
          category: string
          company_id: string | null
          created_at: string
          crm_contact_id: string | null
          deleted_at: string | null
          display_name: string | null
          document_type: string
          file_name: string
          file_path: string
          file_size: number | null
          fund_id: string | null
          id: string
          investing_entity_id: string | null
          investor_id: string | null
          loan_id: string | null
          mime_type: string | null
          notes: string | null
          tags: string[] | null
          updated_at: string
          uploaded_by: string | null
          visibility: string
        }
        Insert: {
          borrower_entity_id?: string | null
          borrower_id?: string | null
          category?: string
          company_id?: string | null
          created_at?: string
          crm_contact_id?: string | null
          deleted_at?: string | null
          display_name?: string | null
          document_type?: string
          file_name: string
          file_path: string
          file_size?: number | null
          fund_id?: string | null
          id?: string
          investing_entity_id?: string | null
          investor_id?: string | null
          loan_id?: string | null
          mime_type?: string | null
          notes?: string | null
          tags?: string[] | null
          updated_at?: string
          uploaded_by?: string | null
          visibility?: string
        }
        Update: {
          borrower_entity_id?: string | null
          borrower_id?: string | null
          category?: string
          company_id?: string | null
          created_at?: string
          crm_contact_id?: string | null
          deleted_at?: string | null
          display_name?: string | null
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          fund_id?: string | null
          id?: string
          investing_entity_id?: string | null
          investor_id?: string | null
          loan_id?: string | null
          mime_type?: string | null
          notes?: string | null
          tags?: string[] | null
          updated_at?: string
          uploaded_by?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_documents_borrower_entity_id_fkey"
            columns: ["borrower_entity_id"]
            isOneToOne: false
            referencedRelation: "borrower_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_documents_borrower_entity_id_fkey"
            columns: ["borrower_entity_id"]
            isOneToOne: false
            referencedRelation: "borrower_entities_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_documents_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_documents_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers_portal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_documents_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_documents_crm_contact_id_fkey"
            columns: ["crm_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_documents_crm_contact_id_fkey"
            columns: ["crm_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_documents_crm_contact_id_fkey"
            columns: ["crm_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "portal_documents_crm_contact_id_fkey"
            columns: ["crm_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["potential_duplicate_id"]
          },
          {
            foreignKeyName: "portal_documents_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_documents_investing_entity_id_fkey"
            columns: ["investing_entity_id"]
            isOneToOne: false
            referencedRelation: "investing_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_documents_investing_entity_id_fkey"
            columns: ["investing_entity_id"]
            isOneToOne: false
            referencedRelation: "investing_entities_portal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_documents_investing_entity_id_fkey"
            columns: ["investing_entity_id"]
            isOneToOne: false
            referencedRelation: "investing_entities_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_documents_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_documents_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors_portal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_documents_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_documents_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_documents_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_documents_uploaded_by_profiles_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
          {
            foreignKeyName: "portal_documents_uploaded_by_profiles_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          updated_at: string | null
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
          updated_at?: string | null
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
          updated_at?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          asset_sub_type: string | null
          asset_type: string | null
          building_class: string | null
          building_status: string | null
          city: string | null
          condo_status: string | null
          county: string | null
          created_at: string
          deleted_at: string | null
          flood_zone: string | null
          gross_building_area_sqft: number | null
          id: string
          internal_notes: string | null
          listing_status: string | null
          lot_size_acres: number | null
          net_rentable_area_sqft: number | null
          notes: string | null
          number_of_buildings: number | null
          number_of_stories: number | null
          number_of_units: number | null
          parcel_id: string | null
          permitting_status: string | null
          property_type: string | null
          rural_check_consumer_finance: boolean | null
          rural_check_usda: boolean | null
          sewer_system: string | null
          state: string | null
          survey_required: boolean | null
          tiered_llc_check: boolean | null
          updated_at: string
          water_system: string | null
          year_built: number | null
          zip: string | null
          zoning: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          asset_sub_type?: string | null
          asset_type?: string | null
          building_class?: string | null
          building_status?: string | null
          city?: string | null
          condo_status?: string | null
          county?: string | null
          created_at?: string
          deleted_at?: string | null
          flood_zone?: string | null
          gross_building_area_sqft?: number | null
          id?: string
          internal_notes?: string | null
          listing_status?: string | null
          lot_size_acres?: number | null
          net_rentable_area_sqft?: number | null
          notes?: string | null
          number_of_buildings?: number | null
          number_of_stories?: number | null
          number_of_units?: number | null
          parcel_id?: string | null
          permitting_status?: string | null
          property_type?: string | null
          rural_check_consumer_finance?: boolean | null
          rural_check_usda?: boolean | null
          sewer_system?: string | null
          state?: string | null
          survey_required?: boolean | null
          tiered_llc_check?: boolean | null
          updated_at?: string
          water_system?: string | null
          year_built?: number | null
          zip?: string | null
          zoning?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          asset_sub_type?: string | null
          asset_type?: string | null
          building_class?: string | null
          building_status?: string | null
          city?: string | null
          condo_status?: string | null
          county?: string | null
          created_at?: string
          deleted_at?: string | null
          flood_zone?: string | null
          gross_building_area_sqft?: number | null
          id?: string
          internal_notes?: string | null
          listing_status?: string | null
          lot_size_acres?: number | null
          net_rentable_area_sqft?: number | null
          notes?: string | null
          number_of_buildings?: number | null
          number_of_stories?: number | null
          number_of_units?: number | null
          parcel_id?: string | null
          permitting_status?: string | null
          property_type?: string | null
          rural_check_consumer_finance?: boolean | null
          rural_check_usda?: boolean | null
          sewer_system?: string | null
          state?: string | null
          survey_required?: boolean | null
          tiered_llc_check?: boolean | null
          updated_at?: string
          water_system?: string | null
          year_built?: number | null
          zip?: string | null
          zoning?: string | null
        }
        Relationships: []
      }
      property_financial_snapshots: {
        Row: {
          annual_debt_service: number | null
          avg_rent_per_sqft: number | null
          avg_rent_per_unit: number | null
          capex: number | null
          created_at: string
          created_by: string | null
          dscr: number | null
          economic_occupancy_pct: number | null
          effective_date: string
          effective_gross_income: number | null
          gross_potential_rent: number | null
          gross_scheduled_rent: number | null
          id: string
          insurance: number | null
          management_fee: number | null
          net_operating_income: number | null
          noi_after_capex: number | null
          notes: string | null
          number_of_occupied_units: number | null
          number_of_vacant_units: number | null
          occupancy_pct: number | null
          opportunity_id: string | null
          other_expenses: number | null
          other_income: number | null
          property_id: string
          rent_roll_document_url: string | null
          repairs_maintenance: number | null
          snapshot_type: string
          source: string | null
          supporting_document_url: string | null
          t12_document_url: string | null
          taxes: number | null
          total_operating_expenses: number | null
          updated_at: string
          utilities: number | null
          vacancy_loss: number | null
          vacancy_rate_pct: number | null
        }
        Insert: {
          annual_debt_service?: number | null
          avg_rent_per_sqft?: number | null
          avg_rent_per_unit?: number | null
          capex?: number | null
          created_at?: string
          created_by?: string | null
          dscr?: number | null
          economic_occupancy_pct?: number | null
          effective_date: string
          effective_gross_income?: number | null
          gross_potential_rent?: number | null
          gross_scheduled_rent?: number | null
          id?: string
          insurance?: number | null
          management_fee?: number | null
          net_operating_income?: number | null
          noi_after_capex?: number | null
          notes?: string | null
          number_of_occupied_units?: number | null
          number_of_vacant_units?: number | null
          occupancy_pct?: number | null
          opportunity_id?: string | null
          other_expenses?: number | null
          other_income?: number | null
          property_id: string
          rent_roll_document_url?: string | null
          repairs_maintenance?: number | null
          snapshot_type: string
          source?: string | null
          supporting_document_url?: string | null
          t12_document_url?: string | null
          taxes?: number | null
          total_operating_expenses?: number | null
          updated_at?: string
          utilities?: number | null
          vacancy_loss?: number | null
          vacancy_rate_pct?: number | null
        }
        Update: {
          annual_debt_service?: number | null
          avg_rent_per_sqft?: number | null
          avg_rent_per_unit?: number | null
          capex?: number | null
          created_at?: string
          created_by?: string | null
          dscr?: number | null
          economic_occupancy_pct?: number | null
          effective_date?: string
          effective_gross_income?: number | null
          gross_potential_rent?: number | null
          gross_scheduled_rent?: number | null
          id?: string
          insurance?: number | null
          management_fee?: number | null
          net_operating_income?: number | null
          noi_after_capex?: number | null
          notes?: string | null
          number_of_occupied_units?: number | null
          number_of_vacant_units?: number | null
          occupancy_pct?: number | null
          opportunity_id?: string | null
          other_expenses?: number | null
          other_income?: number | null
          property_id?: string
          rent_roll_document_url?: string | null
          repairs_maintenance?: number | null
          snapshot_type?: string
          source?: string | null
          supporting_document_url?: string | null
          t12_document_url?: string | null
          taxes?: number | null
          total_operating_expenses?: number | null
          updated_at?: string
          utilities?: number | null
          vacancy_loss?: number | null
          vacancy_rate_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "property_financial_snapshots_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_financial_snapshots_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunity_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_financial_snapshots_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_rent_roll_units: {
        Row: {
          baths: number | null
          beds_type: string | null
          cam_nnn: number | null
          created_at: string
          current_monthly_rent: number | null
          id: string
          is_vacant: boolean | null
          lease_end: string | null
          lease_start: string | null
          lease_type: string | null
          market_rent: number | null
          other_income: number | null
          rent_roll_id: string
          sf: number | null
          sort_order: number | null
          tenant_name: string | null
          unit_number: string
        }
        Insert: {
          baths?: number | null
          beds_type?: string | null
          cam_nnn?: number | null
          created_at?: string
          current_monthly_rent?: number | null
          id?: string
          is_vacant?: boolean | null
          lease_end?: string | null
          lease_start?: string | null
          lease_type?: string | null
          market_rent?: number | null
          other_income?: number | null
          rent_roll_id: string
          sf?: number | null
          sort_order?: number | null
          tenant_name?: string | null
          unit_number: string
        }
        Update: {
          baths?: number | null
          beds_type?: string | null
          cam_nnn?: number | null
          created_at?: string
          current_monthly_rent?: number | null
          id?: string
          is_vacant?: boolean | null
          lease_end?: string | null
          lease_start?: string | null
          lease_type?: string | null
          market_rent?: number | null
          other_income?: number | null
          rent_roll_id?: string
          sf?: number | null
          sort_order?: number | null
          tenant_name?: string | null
          unit_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_rent_roll_units_rent_roll_id_fkey"
            columns: ["rent_roll_id"]
            isOneToOne: false
            referencedRelation: "property_rent_rolls"
            referencedColumns: ["id"]
          },
        ]
      }
      property_rent_rolls: {
        Row: {
          as_of_date: string
          column_mapping: Json | null
          created_at: string
          file_name: string | null
          id: string
          is_current: boolean
          notes: string | null
          property_id: string
          source_label: string | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          as_of_date: string
          column_mapping?: Json | null
          created_at?: string
          file_name?: string | null
          id?: string
          is_current?: boolean
          notes?: string | null
          property_id: string
          source_label?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          as_of_date?: string
          column_mapping?: Json | null
          created_at?: string
          file_name?: string | null
          id?: string
          is_current?: boolean
          notes?: string | null
          property_id?: string
          source_label?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_rent_rolls_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_t12_line_items: {
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
          created_at: string
          exclusion_reason: string | null
          id: string
          is_excluded: boolean | null
          is_income: boolean | null
          mapped_category: string | null
          original_row_label: string
          sort_order: number | null
          t12_id: string
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
          created_at?: string
          exclusion_reason?: string | null
          id?: string
          is_excluded?: boolean | null
          is_income?: boolean | null
          mapped_category?: string | null
          original_row_label: string
          sort_order?: number | null
          t12_id: string
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
          created_at?: string
          exclusion_reason?: string | null
          id?: string
          is_excluded?: boolean | null
          is_income?: boolean | null
          mapped_category?: string | null
          original_row_label?: string
          sort_order?: number | null
          t12_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_t12_line_items_t12_id_fkey"
            columns: ["t12_id"]
            isOneToOne: false
            referencedRelation: "property_t12s"
            referencedColumns: ["id"]
          },
        ]
      }
      property_t12s: {
        Row: {
          created_at: string
          file_name: string | null
          id: string
          is_current: boolean
          month_labels: Json | null
          notes: string | null
          period_end: string
          period_start: string
          property_id: string
          source_label: string | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          id?: string
          is_current?: boolean
          month_labels?: Json | null
          notes?: string | null
          period_end: string
          period_start: string
          property_id: string
          source_label?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string | null
          id?: string
          is_current?: boolean
          month_labels?: Json | null
          notes?: string | null
          period_end?: string
          period_start?: string
          property_id?: string
          source_label?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_t12s_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_task_templates: {
        Row: {
          anchor_day: number | null
          anchor_month: number | null
          assigned_to: string | null
          category: string
          created_at: string
          created_by: string
          description: string | null
          every_x_months: number | null
          id: string
          is_active: boolean
          lead_days: number
          monthly_mode: string | null
          next_due_date: string
          next_generation_date: string
          nth_occurrence: number | null
          nth_weekday: number | null
          priority: string
          recurrence_type: string
          title: string
          updated_at: string
        }
        Insert: {
          anchor_day?: number | null
          anchor_month?: number | null
          assigned_to?: string | null
          category: string
          created_at?: string
          created_by: string
          description?: string | null
          every_x_months?: number | null
          id?: string
          is_active?: boolean
          lead_days?: number
          monthly_mode?: string | null
          next_due_date: string
          next_generation_date: string
          nth_occurrence?: number | null
          nth_weekday?: number | null
          priority: string
          recurrence_type: string
          title: string
          updated_at?: string
        }
        Update: {
          anchor_day?: number | null
          anchor_month?: number | null
          assigned_to?: string | null
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          every_x_months?: number | null
          id?: string
          is_active?: boolean
          lead_days?: number
          monthly_mode?: string | null
          next_due_date?: string
          next_generation_date?: string
          nth_occurrence?: number | null
          nth_weekday?: number | null
          priority?: string
          recurrence_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_task_templates_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
          {
            foreignKeyName: "recurring_task_templates_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_task_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
          {
            foreignKeyName: "recurring_task_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      relationship_roles: {
        Row: {
          color: string | null
          created_at: string
          id: string
          is_required: boolean
          label: string
          max_count: number | null
          relationship_id: string
          required_before_stage: string | null
          role_key: string
          sort_order: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          is_required?: boolean
          label: string
          max_count?: number | null
          relationship_id: string
          required_before_stage?: string | null
          role_key: string
          sort_order?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          is_required?: boolean
          label?: string
          max_count?: number | null
          relationship_id?: string
          required_before_stage?: string | null
          role_key?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "relationship_roles_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "object_relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      servicing_audit_log: {
        Row: {
          action: string
          entry_type: string | null
          field_changed: string | null
          id: string
          loan_id: string | null
          new_value: string | null
          notes: string | null
          old_value: string | null
          reference: string | null
          tab_source: string | null
          timestamp: string
          user_email: string | null
        }
        Insert: {
          action: string
          entry_type?: string | null
          field_changed?: string | null
          id?: string
          loan_id?: string | null
          new_value?: string | null
          notes?: string | null
          old_value?: string | null
          reference?: string | null
          tab_source?: string | null
          timestamp?: string
          user_email?: string | null
        }
        Update: {
          action?: string
          entry_type?: string | null
          field_changed?: string | null
          id?: string
          loan_id?: string | null
          new_value?: string | null
          notes?: string | null
          old_value?: string | null
          reference?: string | null
          tab_source?: string | null
          timestamp?: string
          user_email?: string | null
        }
        Relationships: []
      }
      servicing_construction_budgets: {
        Row: {
          amount_drawn: number | null
          budget_amount: number | null
          created_at: string
          id: string
          inspection_link: string | null
          inspector_notes: string | null
          last_updated: string | null
          line_item: string
          loan_id: string
          pct_complete: number | null
          remaining: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          amount_drawn?: number | null
          budget_amount?: number | null
          created_at?: string
          id?: string
          inspection_link?: string | null
          inspector_notes?: string | null
          last_updated?: string | null
          line_item: string
          loan_id: string
          pct_complete?: number | null
          remaining?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          amount_drawn?: number | null
          budget_amount?: number | null
          created_at?: string
          id?: string
          inspection_link?: string | null
          inspector_notes?: string | null
          last_updated?: string | null
          line_item?: string
          loan_id?: string
          pct_complete?: number | null
          remaining?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "servicing_construction_budgets_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "servicing_loans"
            referencedColumns: ["loan_id"]
          },
          {
            foreignKeyName: "servicing_construction_budgets_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "servicing_maturity_schedule"
            referencedColumns: ["loan_id"]
          },
        ]
      }
      servicing_draws: {
        Row: {
          amount: number
          approved_by: string | null
          created_at: string
          draw_number: number
          entity_name: string | null
          funded_date: string | null
          id: string
          inspection_complete: string | null
          line_item: string | null
          loan_id: string
          notes: string | null
          reference_link: string | null
          request_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          approved_by?: string | null
          created_at?: string
          draw_number: number
          entity_name?: string | null
          funded_date?: string | null
          id?: string
          inspection_complete?: string | null
          line_item?: string | null
          loan_id: string
          notes?: string | null
          reference_link?: string | null
          request_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_by?: string | null
          created_at?: string
          draw_number?: number
          entity_name?: string | null
          funded_date?: string | null
          id?: string
          inspection_complete?: string | null
          line_item?: string | null
          loan_id?: string
          notes?: string | null
          reference_link?: string | null
          request_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "servicing_draws_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "servicing_loans"
            referencedColumns: ["loan_id"]
          },
          {
            foreignKeyName: "servicing_draws_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "servicing_maturity_schedule"
            referencedColumns: ["loan_id"]
          },
        ]
      }
      servicing_loans: {
        Row: {
          account_holder: string | null
          account_number: string | null
          account_type: string | null
          ach_status: string | null
          additional_collateral_value: number | null
          asset_class: string | null
          borrower_credit_score: number | null
          borrower_name: string | null
          city_state_zip: string | null
          construction_holdback: number | null
          created_at: string
          current_balance: number | null
          days_past_due: number | null
          default_date: string | null
          default_rate: number | null
          default_status: string | null
          draw_funds_available: number | null
          dutch_interest: boolean
          effective_rate: number | null
          entity_name: string | null
          exit_fee: number | null
          first_payment_date: string | null
          folder_link: string | null
          fund_name: string | null
          fund_ownership_pct: number | null
          funds_released: number | null
          grace_period_days: number | null
          id: string
          interest_method:
            | Database["public"]["Enums"]["interest_method_type"]
            | null
          interest_rate: number | null
          late_fee_amount: number | null
          late_fee_type: Database["public"]["Enums"]["late_fee_type"] | null
          loan_id: string
          loan_purpose: string | null
          loan_status: string
          loan_type: string | null
          ltc: number | null
          ltv_origination: number | null
          maturity_date: string | null
          monthly_payment: number | null
          next_payment_due: string | null
          notes: string | null
          origination_date: string | null
          origination_fee: number | null
          origination_value: number | null
          originator: string | null
          payment_structure:
            | Database["public"]["Enums"]["payment_structure_type"]
            | null
          payment_type: string | null
          program: string | null
          property_address: string | null
          purchase_price: number | null
          routing_number: string | null
          servicer_loan_number: string | null
          servicing_status:
            | Database["public"]["Enums"]["servicing_loan_status"]
            | null
          stabilized_value: number | null
          term_months: number | null
          total_loan_amount: number
          updated_at: string
        }
        Insert: {
          account_holder?: string | null
          account_number?: string | null
          account_type?: string | null
          ach_status?: string | null
          additional_collateral_value?: number | null
          asset_class?: string | null
          borrower_credit_score?: number | null
          borrower_name?: string | null
          city_state_zip?: string | null
          construction_holdback?: number | null
          created_at?: string
          current_balance?: number | null
          days_past_due?: number | null
          default_date?: string | null
          default_rate?: number | null
          default_status?: string | null
          draw_funds_available?: number | null
          dutch_interest?: boolean
          effective_rate?: number | null
          entity_name?: string | null
          exit_fee?: number | null
          first_payment_date?: string | null
          folder_link?: string | null
          fund_name?: string | null
          fund_ownership_pct?: number | null
          funds_released?: number | null
          grace_period_days?: number | null
          id?: string
          interest_method?:
            | Database["public"]["Enums"]["interest_method_type"]
            | null
          interest_rate?: number | null
          late_fee_amount?: number | null
          late_fee_type?: Database["public"]["Enums"]["late_fee_type"] | null
          loan_id: string
          loan_purpose?: string | null
          loan_status?: string
          loan_type?: string | null
          ltc?: number | null
          ltv_origination?: number | null
          maturity_date?: string | null
          monthly_payment?: number | null
          next_payment_due?: string | null
          notes?: string | null
          origination_date?: string | null
          origination_fee?: number | null
          origination_value?: number | null
          originator?: string | null
          payment_structure?:
            | Database["public"]["Enums"]["payment_structure_type"]
            | null
          payment_type?: string | null
          program?: string | null
          property_address?: string | null
          purchase_price?: number | null
          routing_number?: string | null
          servicer_loan_number?: string | null
          servicing_status?:
            | Database["public"]["Enums"]["servicing_loan_status"]
            | null
          stabilized_value?: number | null
          term_months?: number | null
          total_loan_amount?: number
          updated_at?: string
        }
        Update: {
          account_holder?: string | null
          account_number?: string | null
          account_type?: string | null
          ach_status?: string | null
          additional_collateral_value?: number | null
          asset_class?: string | null
          borrower_credit_score?: number | null
          borrower_name?: string | null
          city_state_zip?: string | null
          construction_holdback?: number | null
          created_at?: string
          current_balance?: number | null
          days_past_due?: number | null
          default_date?: string | null
          default_rate?: number | null
          default_status?: string | null
          draw_funds_available?: number | null
          dutch_interest?: boolean
          effective_rate?: number | null
          entity_name?: string | null
          exit_fee?: number | null
          first_payment_date?: string | null
          folder_link?: string | null
          fund_name?: string | null
          fund_ownership_pct?: number | null
          funds_released?: number | null
          grace_period_days?: number | null
          id?: string
          interest_method?:
            | Database["public"]["Enums"]["interest_method_type"]
            | null
          interest_rate?: number | null
          late_fee_amount?: number | null
          late_fee_type?: Database["public"]["Enums"]["late_fee_type"] | null
          loan_id?: string
          loan_purpose?: string | null
          loan_status?: string
          loan_type?: string | null
          ltc?: number | null
          ltv_origination?: number | null
          maturity_date?: string | null
          monthly_payment?: number | null
          next_payment_due?: string | null
          notes?: string | null
          origination_date?: string | null
          origination_fee?: number | null
          origination_value?: number | null
          originator?: string | null
          payment_structure?:
            | Database["public"]["Enums"]["payment_structure_type"]
            | null
          payment_type?: string | null
          program?: string | null
          property_address?: string | null
          purchase_price?: number | null
          routing_number?: string | null
          servicer_loan_number?: string | null
          servicing_status?:
            | Database["public"]["Enums"]["servicing_loan_status"]
            | null
          stabilized_value?: number | null
          term_months?: number | null
          total_loan_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      servicing_payments: {
        Row: {
          amount_due: number | null
          amount_paid: number | null
          balance_after: number | null
          billing_line_item_id: string | null
          borrower: string | null
          created_at: string
          date: string
          entered_by: string | null
          entry_timestamp: string
          entry_type: string
          id: string
          interest: number | null
          late_fee: number | null
          loan_id: string
          locked: boolean
          payment_classification:
            | Database["public"]["Enums"]["servicing_payment_type"]
            | null
          payment_method: string | null
          principal: number | null
          reference_trace: string | null
          return_reason: string | null
          reversal_of: string | null
          running_balance_check: number | null
          type: string
        }
        Insert: {
          amount_due?: number | null
          amount_paid?: number | null
          balance_after?: number | null
          billing_line_item_id?: string | null
          borrower?: string | null
          created_at?: string
          date: string
          entered_by?: string | null
          entry_timestamp?: string
          entry_type?: string
          id?: string
          interest?: number | null
          late_fee?: number | null
          loan_id: string
          locked?: boolean
          payment_classification?:
            | Database["public"]["Enums"]["servicing_payment_type"]
            | null
          payment_method?: string | null
          principal?: number | null
          reference_trace?: string | null
          return_reason?: string | null
          reversal_of?: string | null
          running_balance_check?: number | null
          type: string
        }
        Update: {
          amount_due?: number | null
          amount_paid?: number | null
          balance_after?: number | null
          billing_line_item_id?: string | null
          borrower?: string | null
          created_at?: string
          date?: string
          entered_by?: string | null
          entry_timestamp?: string
          entry_type?: string
          id?: string
          interest?: number | null
          late_fee?: number | null
          loan_id?: string
          locked?: boolean
          payment_classification?:
            | Database["public"]["Enums"]["servicing_payment_type"]
            | null
          payment_method?: string | null
          principal?: number | null
          reference_trace?: string | null
          return_reason?: string | null
          reversal_of?: string | null
          running_balance_check?: number | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "servicing_payments_billing_line_item_id_fkey"
            columns: ["billing_line_item_id"]
            isOneToOne: false
            referencedRelation: "billing_line_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicing_payments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "servicing_loans"
            referencedColumns: ["loan_id"]
          },
          {
            foreignKeyName: "servicing_payments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "servicing_maturity_schedule"
            referencedColumns: ["loan_id"]
          },
          {
            foreignKeyName: "servicing_payments_reversal_of_fkey"
            columns: ["reversal_of"]
            isOneToOne: false
            referencedRelation: "servicing_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      servicing_pending_actions: {
        Row: {
          action_status: string | null
          amount: number | null
          created_at: string
          entity_name: string | null
          id: string
          jotform_submitted: boolean | null
          loan_id: string
          notes: string | null
          property: string | null
          request_date: string | null
          request_type: string | null
          updated_at: string
          wire_confirmation: string | null
          wire_date: string | null
        }
        Insert: {
          action_status?: string | null
          amount?: number | null
          created_at?: string
          entity_name?: string | null
          id?: string
          jotform_submitted?: boolean | null
          loan_id: string
          notes?: string | null
          property?: string | null
          request_date?: string | null
          request_type?: string | null
          updated_at?: string
          wire_confirmation?: string | null
          wire_date?: string | null
        }
        Update: {
          action_status?: string | null
          amount?: number | null
          created_at?: string
          entity_name?: string | null
          id?: string
          jotform_submitted?: boolean | null
          loan_id?: string
          notes?: string | null
          property?: string | null
          request_date?: string | null
          request_type?: string | null
          updated_at?: string
          wire_confirmation?: string | null
          wire_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "servicing_pending_actions_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "servicing_loans"
            referencedColumns: ["loan_id"]
          },
          {
            foreignKeyName: "servicing_pending_actions_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "servicing_maturity_schedule"
            referencedColumns: ["loan_id"]
          },
        ]
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
      sop_categories: {
        Row: {
          created_at: string
          department: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          slug: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          department?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          department?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sop_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "sop_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      sop_embeddings: {
        Row: {
          chunk_index: number
          chunk_text: string
          created_at: string
          embedding: string | null
          id: string
          sop_id: string
        }
        Insert: {
          chunk_index: number
          chunk_text: string
          created_at?: string
          embedding?: string | null
          id?: string
          sop_id: string
        }
        Update: {
          chunk_index?: number
          chunk_text?: string
          created_at?: string
          embedding?: string | null
          id?: string
          sop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sop_embeddings_sop_id_fkey"
            columns: ["sop_id"]
            isOneToOne: false
            referencedRelation: "sops"
            referencedColumns: ["id"]
          },
        ]
      }
      sop_questions_log: {
        Row: {
          answer: string | null
          confidence_score: number | null
          created_at: string
          feedback: string | null
          id: string
          matched_sop_ids: string[] | null
          page_context: string | null
          profile_id: string | null
          question: string
          session_id: string | null
          user_id: string | null
          was_helpful: boolean | null
        }
        Insert: {
          answer?: string | null
          confidence_score?: number | null
          created_at?: string
          feedback?: string | null
          id?: string
          matched_sop_ids?: string[] | null
          page_context?: string | null
          profile_id?: string | null
          question: string
          session_id?: string | null
          user_id?: string | null
          was_helpful?: boolean | null
        }
        Update: {
          answer?: string | null
          confidence_score?: number | null
          created_at?: string
          feedback?: string | null
          id?: string
          matched_sop_ids?: string[] | null
          page_context?: string | null
          profile_id?: string | null
          question?: string
          session_id?: string | null
          user_id?: string | null
          was_helpful?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "sop_questions_log_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
          {
            foreignKeyName: "sop_questions_log_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sop_staleness_flags: {
        Row: {
          created_at: string
          description: string | null
          detected_pattern: Json | null
          flag_type: string
          id: string
          resolved_at: string | null
          resolved_by: string | null
          sop_id: string
          status: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          detected_pattern?: Json | null
          flag_type?: string
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          sop_id: string
          status?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          detected_pattern?: Json | null
          flag_type?: string
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          sop_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sop_staleness_flags_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
          {
            foreignKeyName: "sop_staleness_flags_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sop_staleness_flags_sop_id_fkey"
            columns: ["sop_id"]
            isOneToOne: false
            referencedRelation: "sops"
            referencedColumns: ["id"]
          },
        ]
      }
      sop_versions: {
        Row: {
          change_notes: string | null
          changed_by: string | null
          content: string
          created_at: string
          diff_summary: string | null
          id: string
          sop_id: string
          summary: string | null
          version_number: number
        }
        Insert: {
          change_notes?: string | null
          changed_by?: string | null
          content: string
          created_at?: string
          diff_summary?: string | null
          id?: string
          sop_id: string
          summary?: string | null
          version_number: number
        }
        Update: {
          change_notes?: string | null
          changed_by?: string | null
          content?: string
          created_at?: string
          diff_summary?: string | null
          id?: string
          sop_id?: string
          summary?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "sop_versions_sop_id_fkey"
            columns: ["sop_id"]
            isOneToOne: false
            referencedRelation: "sops"
            referencedColumns: ["id"]
          },
        ]
      }
      sops: {
        Row: {
          ai_confidence: number | null
          approved_at: string | null
          approved_by: string | null
          category: string | null
          category_id: string | null
          content: string
          created_at: string
          created_by: string | null
          department: string | null
          generated_from: Json | null
          id: string
          last_reviewed_at: string | null
          review_required_by: string | null
          search_vector: unknown
          slug: string | null
          source_type: string | null
          status: string
          summary: string | null
          tags: string[] | null
          title: string
          updated_at: string
          version: number
          visibility: string
          visible_to_departments: string[] | null
          visible_to_roles: string[] | null
        }
        Insert: {
          ai_confidence?: number | null
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          category_id?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          department?: string | null
          generated_from?: Json | null
          id?: string
          last_reviewed_at?: string | null
          review_required_by?: string | null
          search_vector?: unknown
          slug?: string | null
          source_type?: string | null
          status?: string
          summary?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          version?: number
          visibility?: string
          visible_to_departments?: string[] | null
          visible_to_roles?: string[] | null
        }
        Update: {
          ai_confidence?: number | null
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          category_id?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          department?: string | null
          generated_from?: Json | null
          id?: string
          last_reviewed_at?: string | null
          review_required_by?: string | null
          search_vector?: unknown
          slug?: string | null
          source_type?: string | null
          status?: string
          summary?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          version?: number
          visibility?: string
          visible_to_departments?: string[] | null
          visible_to_roles?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "sops_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "sop_categories"
            referencedColumns: ["id"]
          },
        ]
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
      unified_card_types: {
        Row: {
          applicable_asset_classes: string[] | null
          capital_side: string
          card_icon: string | null
          card_metrics: Json
          category: string
          contact_field_groups: Json
          contact_fields: Json
          contact_roles: string[]
          created_at: string
          description: string | null
          detail_field_groups: Json
          detail_tabs: Json
          id: string
          label: string
          property_field_groups: Json
          property_fields: Json
          slug: string
          sort_order: number | null
          status: string
          updated_at: string
          uw_fields: Json
          uw_grid: Json | null
          uw_model_key: string
          uw_outputs: Json
        }
        Insert: {
          applicable_asset_classes?: string[] | null
          capital_side: string
          card_icon?: string | null
          card_metrics?: Json
          category: string
          contact_field_groups?: Json
          contact_fields?: Json
          contact_roles?: string[]
          created_at?: string
          description?: string | null
          detail_field_groups?: Json
          detail_tabs?: Json
          id?: string
          label: string
          property_field_groups?: Json
          property_fields?: Json
          slug: string
          sort_order?: number | null
          status?: string
          updated_at?: string
          uw_fields?: Json
          uw_grid?: Json | null
          uw_model_key: string
          uw_outputs?: Json
        }
        Update: {
          applicable_asset_classes?: string[] | null
          capital_side?: string
          card_icon?: string | null
          card_metrics?: Json
          category?: string
          contact_field_groups?: Json
          contact_fields?: Json
          contact_roles?: string[]
          created_at?: string
          description?: string | null
          detail_field_groups?: Json
          detail_tabs?: Json
          id?: string
          label?: string
          property_field_groups?: Json
          property_fields?: Json
          slug?: string
          sort_order?: number | null
          status?: string
          updated_at?: string
          uw_fields?: Json
          uw_grid?: Json | null
          uw_model_key?: string
          uw_outputs?: Json
        }
        Relationships: []
      }
      unified_checklist_templates: {
        Row: {
          card_type_id: string
          created_at: string
          id: string
          is_active: boolean | null
          is_required: boolean | null
          item_label: string
          sort_order: number | null
          stage: string
        }
        Insert: {
          card_type_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          item_label: string
          sort_order?: number | null
          stage: string
        }
        Update: {
          card_type_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          item_label?: string
          sort_order?: number | null
          stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "unified_checklist_templates_card_type_id_fkey"
            columns: ["card_type_id"]
            isOneToOne: false
            referencedRelation: "unified_card_types"
            referencedColumns: ["id"]
          },
        ]
      }
      unified_deal_activity: {
        Row: {
          activity_type: string
          created_at: string
          created_by: string | null
          deal_id: string
          description: string | null
          id: string
          metadata: Json | null
          title: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          created_by?: string | null
          deal_id: string
          description?: string | null
          id?: string
          metadata?: Json | null
          title: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          created_by?: string | null
          deal_id?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "unified_deal_activity_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "unified_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      unified_deal_checklist: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          deal_id: string
          id: string
          is_required: boolean | null
          item_label: string
          sort_order: number | null
          template_id: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          deal_id: string
          id?: string
          is_required?: boolean | null
          item_label: string
          sort_order?: number | null
          template_id?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          deal_id?: string
          id?: string
          is_required?: boolean | null
          item_label?: string
          sort_order?: number | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unified_deal_checklist_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "unified_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unified_deal_checklist_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "unified_checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      unified_deal_conditions: {
        Row: {
          assigned_to: string | null
          borrower_description: string | null
          category: string
          condition_name: string
          created_at: string | null
          critical_path_item: boolean | null
          deal_id: string
          document_urls: string[] | null
          due_date: string | null
          id: string
          internal_description: string | null
          is_required: boolean | null
          notes: string | null
          required_stage: string
          requires_approval: boolean | null
          responsible_party: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sort_order: number | null
          status: string
          submitted_at: string | null
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          borrower_description?: string | null
          category?: string
          condition_name: string
          created_at?: string | null
          critical_path_item?: boolean | null
          deal_id: string
          document_urls?: string[] | null
          due_date?: string | null
          id?: string
          internal_description?: string | null
          is_required?: boolean | null
          notes?: string | null
          required_stage?: string
          requires_approval?: boolean | null
          responsible_party?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sort_order?: number | null
          status?: string
          submitted_at?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          borrower_description?: string | null
          category?: string
          condition_name?: string
          created_at?: string | null
          critical_path_item?: boolean | null
          deal_id?: string
          document_urls?: string[] | null
          due_date?: string | null
          id?: string
          internal_description?: string | null
          is_required?: boolean | null
          notes?: string | null
          required_stage?: string
          requires_approval?: boolean | null
          responsible_party?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sort_order?: number | null
          status?: string
          submitted_at?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unified_deal_conditions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "unified_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unified_deal_conditions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "loan_condition_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      unified_deal_documents: {
        Row: {
          category: string | null
          condition_id: string | null
          created_at: string
          deal_id: string
          document_name: string
          file_size_bytes: number | null
          file_url: string
          id: string
          mime_type: string | null
          review_status: string | null
          storage_path: string | null
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          condition_id?: string | null
          created_at?: string
          deal_id: string
          document_name: string
          file_size_bytes?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          review_status?: string | null
          storage_path?: string | null
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          condition_id?: string | null
          created_at?: string
          deal_id?: string
          document_name?: string
          file_size_bytes?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          review_status?: string | null
          storage_path?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unified_deal_documents_condition_id_fkey"
            columns: ["condition_id"]
            isOneToOne: false
            referencedRelation: "unified_deal_conditions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unified_deal_documents_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "unified_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unified_deal_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
          {
            foreignKeyName: "unified_deal_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      unified_deal_relationships: {
        Row: {
          created_at: string
          deal_a_id: string
          deal_b_id: string
          id: string
          notes: string | null
          relationship_type: string
        }
        Insert: {
          created_at?: string
          deal_a_id: string
          deal_b_id: string
          id?: string
          notes?: string | null
          relationship_type: string
        }
        Update: {
          created_at?: string
          deal_a_id?: string
          deal_b_id?: string
          id?: string
          notes?: string | null
          relationship_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "unified_deal_relationships_deal_a_id_fkey"
            columns: ["deal_a_id"]
            isOneToOne: false
            referencedRelation: "unified_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unified_deal_relationships_deal_b_id_fkey"
            columns: ["deal_b_id"]
            isOneToOne: false
            referencedRelation: "unified_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      unified_deal_stage_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          deal_id: string
          duration_seconds: number | null
          from_stage: string | null
          id: string
          notes: string | null
          to_stage: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          deal_id: string
          duration_seconds?: number | null
          from_stage?: string | null
          id?: string
          notes?: string | null
          to_stage: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          deal_id?: string
          duration_seconds?: number | null
          from_stage?: string | null
          id?: string
          notes?: string | null
          to_stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "unified_deal_stage_history_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "unified_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      unified_deal_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          deal_id: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          deal_id: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "unified_deal_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
          {
            foreignKeyName: "unified_deal_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unified_deal_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
          {
            foreignKeyName: "unified_deal_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unified_deal_tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "unified_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      unified_deals: {
        Row: {
          actual_close_date: string | null
          amount: number | null
          asset_class: string | null
          assigned_to: string | null
          capital_side: string
          card_type_id: string
          company_id: string | null
          created_at: string
          created_by: string | null
          deal_number: string | null
          expected_close_date: string | null
          id: string
          loss_reason: string | null
          name: string
          notes: string | null
          primary_contact_id: string | null
          probability: number | null
          property_data: Json | null
          property_id: string | null
          source: string | null
          source_detail: string | null
          stage: string
          stage_entered_at: string
          status: string
          tags: string[] | null
          updated_at: string
          uw_data: Json | null
          uw_grid_overrides: Json | null
        }
        Insert: {
          actual_close_date?: string | null
          amount?: number | null
          asset_class?: string | null
          assigned_to?: string | null
          capital_side: string
          card_type_id: string
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_number?: string | null
          expected_close_date?: string | null
          id?: string
          loss_reason?: string | null
          name: string
          notes?: string | null
          primary_contact_id?: string | null
          probability?: number | null
          property_data?: Json | null
          property_id?: string | null
          source?: string | null
          source_detail?: string | null
          stage?: string
          stage_entered_at?: string
          status?: string
          tags?: string[] | null
          updated_at?: string
          uw_data?: Json | null
          uw_grid_overrides?: Json | null
        }
        Update: {
          actual_close_date?: string | null
          amount?: number | null
          asset_class?: string | null
          assigned_to?: string | null
          capital_side?: string
          card_type_id?: string
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_number?: string | null
          expected_close_date?: string | null
          id?: string
          loss_reason?: string | null
          name?: string
          notes?: string | null
          primary_contact_id?: string | null
          probability?: number | null
          property_data?: Json | null
          property_id?: string | null
          source?: string | null
          source_detail?: string | null
          stage?: string
          stage_entered_at?: string
          status?: string
          tags?: string[] | null
          updated_at?: string
          uw_data?: Json | null
          uw_grid_overrides?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "unified_deals_card_type_id_fkey"
            columns: ["card_type_id"]
            isOneToOne: false
            referencedRelation: "unified_card_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unified_deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unified_deals_primary_contact_id_fkey"
            columns: ["primary_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unified_deals_primary_contact_id_fkey"
            columns: ["primary_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unified_deals_primary_contact_id_fkey"
            columns: ["primary_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "unified_deals_primary_contact_id_fkey"
            columns: ["primary_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["potential_duplicate_id"]
          },
        ]
      }
      unified_stage_configs: {
        Row: {
          alert_days: number | null
          description: string | null
          id: string
          sort_order: number
          stage: string
          warn_days: number | null
        }
        Insert: {
          alert_days?: number | null
          description?: string | null
          id?: string
          sort_order: number
          stage: string
          warn_days?: number | null
        }
        Update: {
          alert_days?: number | null
          description?: string | null
          id?: string
          sort_order?: number
          stage?: string
          warn_days?: number | null
        }
        Relationships: []
      }
      unified_stage_rules: {
        Row: {
          created_at: string | null
          error_message: string | null
          field_key: string
          id: string
          stage_config_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          field_key: string
          id?: string
          stage_config_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          field_key?: string
          id?: string
          stage_config_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unified_stage_rules_stage_config_id_fkey"
            columns: ["stage_config_id"]
            isOneToOne: false
            referencedRelation: "unified_stage_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_email_sends: {
        Row: {
          created_at: string
          crm_email_id: string | null
          id: string
          linked_contact_id: string | null
          linked_loan_id: string | null
          merge_data_snapshot: Json | null
          sent_by: string | null
          template_id: string | null
          template_version: number | null
        }
        Insert: {
          created_at?: string
          crm_email_id?: string | null
          id?: string
          linked_contact_id?: string | null
          linked_loan_id?: string | null
          merge_data_snapshot?: Json | null
          sent_by?: string | null
          template_id?: string | null
          template_version?: number | null
        }
        Update: {
          created_at?: string
          crm_email_id?: string | null
          id?: string
          linked_contact_id?: string | null
          linked_loan_id?: string | null
          merge_data_snapshot?: Json | null
          sent_by?: string | null
          template_id?: string | null
          template_version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_email_sends_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "user_email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_email_template_versions: {
        Row: {
          available_variables: Json
          body_template: string
          change_notes: string | null
          changed_by: string | null
          created_at: string
          id: string
          subject_template: string
          template_id: string
          version: number
        }
        Insert: {
          available_variables?: Json
          body_template: string
          change_notes?: string | null
          changed_by?: string | null
          created_at?: string
          id?: string
          subject_template: string
          template_id: string
          version: number
        }
        Update: {
          available_variables?: Json
          body_template?: string
          change_notes?: string | null
          changed_by?: string | null
          created_at?: string
          id?: string
          subject_template?: string
          template_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_email_template_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "user_email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_email_templates: {
        Row: {
          available_variables: Json
          body_template: string
          category: string
          context: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          slug: string
          sort_order: number
          subject_template: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          available_variables?: Json
          body_template?: string
          category?: string
          context?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          slug: string
          sort_order?: number
          subject_template?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          available_variables?: Json
          body_template?: string
          category?: string
          context?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          slug?: string
          sort_order?: number
          subject_template?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: []
      }
      user_module_access: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          module_id: string
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          module_id: string
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          module_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_module_access_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "user_roles_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors_portal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      user_streaks: {
        Row: {
          best_streak: number | null
          current_streak: number | null
          last_completed_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          best_streak?: number | null
          current_streak?: number | null
          last_completed_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          best_streak?: number | null
          current_streak?: number | null
          last_completed_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      workflow_definitions: {
        Row: {
          created_at: string | null
          description: string | null
          entity_type: string
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          entity_type: string
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          entity_type?: string
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      workflow_instances: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_stage_id: string | null
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          previous_stage_id: string | null
          started_at: string | null
          status: string | null
          updated_at: string | null
          workflow_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_stage_id?: string | null
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          previous_stage_id?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          workflow_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_stage_id?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          previous_stage_id?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_instances_current_stage_id_fkey"
            columns: ["current_stage_id"]
            isOneToOne: false
            referencedRelation: "workflow_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_instances_previous_stage_id_fkey"
            columns: ["previous_stage_id"]
            isOneToOne: false
            referencedRelation: "workflow_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_instances_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflow_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_rules: {
        Row: {
          action_type: string
          assign_to_role: string | null
          assign_to_user_id: string | null
          created_at: string | null
          due_anchor: string | null
          due_days_offset: number | null
          execution_order: number | null
          id: string
          is_active: boolean | null
          is_blocking: boolean | null
          name: string
          notification_body: string | null
          notification_title: string | null
          notification_type: string | null
          notify_roles: string[] | null
          notify_user_ids: string[] | null
          requestor_role: string | null
          task_category: string | null
          task_description: string | null
          task_is_approval: boolean | null
          task_priority: string | null
          task_title_template: string | null
          trigger_days: number | null
          trigger_stage_id: string | null
          trigger_type: string
          updated_at: string | null
          workflow_id: string | null
        }
        Insert: {
          action_type: string
          assign_to_role?: string | null
          assign_to_user_id?: string | null
          created_at?: string | null
          due_anchor?: string | null
          due_days_offset?: number | null
          execution_order?: number | null
          id?: string
          is_active?: boolean | null
          is_blocking?: boolean | null
          name: string
          notification_body?: string | null
          notification_title?: string | null
          notification_type?: string | null
          notify_roles?: string[] | null
          notify_user_ids?: string[] | null
          requestor_role?: string | null
          task_category?: string | null
          task_description?: string | null
          task_is_approval?: boolean | null
          task_priority?: string | null
          task_title_template?: string | null
          trigger_days?: number | null
          trigger_stage_id?: string | null
          trigger_type: string
          updated_at?: string | null
          workflow_id?: string | null
        }
        Update: {
          action_type?: string
          assign_to_role?: string | null
          assign_to_user_id?: string | null
          created_at?: string | null
          due_anchor?: string | null
          due_days_offset?: number | null
          execution_order?: number | null
          id?: string
          is_active?: boolean | null
          is_blocking?: boolean | null
          name?: string
          notification_body?: string | null
          notification_title?: string | null
          notification_type?: string | null
          notify_roles?: string[] | null
          notify_user_ids?: string[] | null
          requestor_role?: string | null
          task_category?: string | null
          task_description?: string | null
          task_is_approval?: boolean | null
          task_priority?: string | null
          task_title_template?: string | null
          trigger_days?: number | null
          trigger_stage_id?: string | null
          trigger_type?: string
          updated_at?: string | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_rules_trigger_stage_id_fkey"
            columns: ["trigger_stage_id"]
            isOneToOne: false
            referencedRelation: "workflow_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_rules_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflow_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_stage_history: {
        Row: {
          created_at: string | null
          from_stage_id: string | null
          id: string
          instance_id: string | null
          note: string | null
          to_stage_id: string | null
          transitioned_by: string | null
        }
        Insert: {
          created_at?: string | null
          from_stage_id?: string | null
          id?: string
          instance_id?: string | null
          note?: string | null
          to_stage_id?: string | null
          transitioned_by?: string | null
        }
        Update: {
          created_at?: string | null
          from_stage_id?: string | null
          id?: string
          instance_id?: string | null
          note?: string | null
          to_stage_id?: string | null
          transitioned_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_stage_history_from_stage_id_fkey"
            columns: ["from_stage_id"]
            isOneToOne: false
            referencedRelation: "workflow_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_stage_history_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "workflow_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_stage_history_to_stage_id_fkey"
            columns: ["to_stage_id"]
            isOneToOne: false
            referencedRelation: "workflow_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_stages: {
        Row: {
          alert_after_days: number | null
          borrower_label: string | null
          created_at: string | null
          id: string
          is_terminal: boolean | null
          name: string
          position: number
          slug: string
          warn_after_days: number | null
          workflow_id: string | null
        }
        Insert: {
          alert_after_days?: number | null
          borrower_label?: string | null
          created_at?: string | null
          id?: string
          is_terminal?: boolean | null
          name: string
          position: number
          slug: string
          warn_after_days?: number | null
          workflow_id?: string | null
        }
        Update: {
          alert_after_days?: number | null
          borrower_label?: string | null
          created_at?: string | null
          id?: string
          is_terminal?: boolean | null
          name?: string
          position?: number
          slug?: string
          warn_after_days?: number | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_stages_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflow_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      borrower_entities_safe: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          borrower_id: string | null
          city: string | null
          country: string | null
          created_at: string | null
          ein: string | null
          entity_name: string | null
          entity_type: string | null
          foreign_filed_states: string[] | null
          formation_date: string | null
          id: string | null
          is_foreign_filed: boolean | null
          notes: string | null
          state: string | null
          state_of_formation: string | null
          updated_at: string | null
          zip: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          borrower_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          ein?: never
          entity_name?: string | null
          entity_type?: string | null
          foreign_filed_states?: string[] | null
          formation_date?: string | null
          id?: string | null
          is_foreign_filed?: boolean | null
          notes?: string | null
          state?: string | null
          state_of_formation?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          borrower_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          ein?: never
          entity_name?: string | null
          entity_type?: string | null
          foreign_filed_states?: string[] | null
          formation_date?: string | null
          id?: string | null
          is_foreign_filed?: boolean | null
          notes?: string | null
          state?: string | null
          state_of_formation?: string | null
          updated_at?: string | null
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
      borrower_requests_view: {
        Row: {
          borrower_name: string | null
          created_at: string | null
          days_since_sent: number | null
          description: string | null
          follow_up_count: number | null
          id: string | null
          last_follow_up_at: string | null
          loan_id: string | null
          loan_name: string | null
          loan_number: string | null
          requested_by: string | null
          resolved_at: string | null
          sent_at: string | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "borrower_requests_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "borrower_requests_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      borrowers_portal: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          country: string | null
          created_at: string | null
          credit_report_date: string | null
          credit_score: number | null
          crm_contact_id: string | null
          date_of_birth: string | null
          email: string | null
          experience_count: number | null
          first_name: string | null
          id: string | null
          is_us_citizen: boolean | null
          last_name: string | null
          marital_status: string | null
          notes: string | null
          phone: string | null
          ssn_last_four: string | null
          state: string | null
          updated_at: string | null
          user_id: string | null
          zip: string | null
        }
        Relationships: [
          {
            foreignKeyName: "borrowers_crm_contact_id_fkey"
            columns: ["crm_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "borrowers_crm_contact_id_fkey"
            columns: ["crm_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "borrowers_crm_contact_id_fkey"
            columns: ["crm_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "borrowers_crm_contact_id_fkey"
            columns: ["crm_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["potential_duplicate_id"]
          },
        ]
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
          crm_contact_id: string | null
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
        Relationships: [
          {
            foreignKeyName: "borrowers_crm_contact_id_fkey"
            columns: ["crm_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "borrowers_crm_contact_id_fkey"
            columns: ["crm_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "borrowers_crm_contact_id_fkey"
            columns: ["crm_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "borrowers_crm_contact_id_fkey"
            columns: ["crm_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["potential_duplicate_id"]
          },
        ]
      }
      crm_contact_timeline: {
        Row: {
          actor_id: string | null
          actor_name: string | null
          body: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string | null
          direction: string | null
          id: string | null
          is_completed: boolean | null
          item_type: string | null
          metadata: Json | null
          occurred_at: string | null
          priority: string | null
          sub_type: string | null
          task_status: string | null
          title: string | null
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
          contact_types: string[] | null
          created_at: string | null
          deleted_at: string | null
          dnc: boolean | null
          dnc_reason: string | null
          email: string | null
          first_name: string | null
          id: string | null
          last_contacted_at: string | null
          last_name: string | null
          lifecycle_stage:
            | Database["public"]["Enums"]["lifecycle_stage_enum"]
            | null
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
          user_id: string | null
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
          contact_types?: string[] | null
          created_at?: string | null
          deleted_at?: string | null
          dnc?: boolean | null
          dnc_reason?: string | null
          email?: string | null
          first_name?: string | null
          id?: string | null
          last_contacted_at?: string | null
          last_name?: string | null
          lifecycle_stage?:
            | Database["public"]["Enums"]["lifecycle_stage_enum"]
            | null
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
          user_id?: string | null
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
          contact_types?: string[] | null
          created_at?: string | null
          deleted_at?: string | null
          dnc?: boolean | null
          dnc_reason?: string | null
          email?: string | null
          first_name?: string | null
          id?: string | null
          last_contacted_at?: string | null
          last_name?: string | null
          lifecycle_stage?:
            | Database["public"]["Enums"]["lifecycle_stage_enum"]
            | null
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
          user_id?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
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
            foreignKeyName: "crm_contacts_linked_investor_id_fkey"
            columns: ["linked_investor_id"]
            isOneToOne: false
            referencedRelation: "investors_portal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_linked_investor_id_fkey"
            columns: ["linked_investor_id"]
            isOneToOne: false
            referencedRelation: "investors_safe"
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
          {
            foreignKeyName: "crm_contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
          {
            foreignKeyName: "crm_contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_duplicate_candidates: {
        Row: {
          confidence: number | null
          contact_id: string | null
          contact_name: string | null
          dup_email: string | null
          dup_phone: string | null
          email: string | null
          match_type: string | null
          phone: string | null
          potential_duplicate_id: string | null
          potential_duplicate_name: string | null
        }
        Relationships: []
      }
      crm_upcoming_items: {
        Row: {
          assigned_to: string | null
          assigned_to_name: string | null
          company_id: string | null
          company_name: string | null
          contact_id: string | null
          contact_name: string | null
          due_at: string | null
          id: string | null
          item_type: string | null
          priority: string | null
          sub_type: string | null
          task_status: string | null
          title: string | null
          urgency: string | null
        }
        Relationships: []
      }
      equity_pipeline: {
        Row: {
          actual_close_date: string | null
          asking_price: number | null
          asset_type: string | null
          assigned_to: string | null
          assigned_to_profile_id: string | null
          completed_tasks: number | null
          created_at: string | null
          days_in_stage: number | null
          deal_name: string | null
          deal_number: string | null
          equity_multiple: number | null
          expected_close_date: string | null
          going_in_cap_rate: number | null
          id: string | null
          investment_thesis: string | null
          levered_irr: number | null
          loss_reason: string | null
          lot_size_acres: number | null
          number_of_units: number | null
          offer_price: number | null
          property_address: string | null
          property_city: string | null
          property_state: string | null
          property_type: string | null
          property_zip: string | null
          purchase_price: number | null
          source: Database["public"]["Enums"]["equity_deal_source"] | null
          stabilized_cap_rate: number | null
          stage: Database["public"]["Enums"]["equity_deal_stage"] | null
          stage_changed_at: string | null
          target_irr: number | null
          total_tasks: number | null
          underwriting_status: string | null
          updated_at: string | null
          value_add_strategy: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equity_deals_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
          {
            foreignKeyName: "equity_deals_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          {
            foreignKeyName: "investing_entities_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors_portal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investing_entities_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      investing_entities_safe: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          country: string | null
          created_at: string | null
          ein: string | null
          entity_name: string | null
          entity_type: string | null
          id: string | null
          investor_id: string | null
          notes: string | null
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
          id?: string | null
          investor_id?: string | null
          notes?: string | null
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
          id?: string | null
          investor_id?: string | null
          notes?: string | null
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
          {
            foreignKeyName: "investing_entities_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors_portal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investing_entities_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      investors_portal: {
        Row: {
          accreditation_status: string | null
          accreditation_verified_at: string | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          country: string | null
          created_at: string | null
          crm_contact_id: string | null
          email: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          notes: string | null
          phone: string | null
          state: string | null
          updated_at: string | null
          user_id: string | null
          zip: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investors_crm_contact_id_fkey"
            columns: ["crm_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investors_crm_contact_id_fkey"
            columns: ["crm_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investors_crm_contact_id_fkey"
            columns: ["crm_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "investors_crm_contact_id_fkey"
            columns: ["crm_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["potential_duplicate_id"]
          },
        ]
      }
      investors_safe: {
        Row: {
          accreditation_status: string | null
          accreditation_verified_at: string | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          country: string | null
          created_at: string | null
          crm_contact_id: string | null
          email: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          notes: string | null
          phone: string | null
          state: string | null
          updated_at: string | null
          zip: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investors_crm_contact_id_fkey"
            columns: ["crm_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investors_crm_contact_id_fkey"
            columns: ["crm_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investors_crm_contact_id_fkey"
            columns: ["crm_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "investors_crm_contact_id_fkey"
            columns: ["crm_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_duplicate_candidates"
            referencedColumns: ["potential_duplicate_id"]
          },
        ]
      }
      loan_pipeline: {
        Row: {
          approval_status: string | null
          approved_conditions: number | null
          borrower_name: string | null
          closing_date: string | null
          created_at: string | null
          entity_name: string | null
          funding_channel: string | null
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
      opportunity_pipeline: {
        Row: {
          approval_status: string | null
          asset_type: string | null
          assigned_underwriter: string | null
          borrower_count: number | null
          borrower_name: string | null
          capital_partner: string | null
          combined_liquidity: number | null
          combined_net_worth: number | null
          created_at: string | null
          deal_name: string | null
          entity_name: string | null
          funding_channel: string | null
          id: string | null
          internal_notes: string | null
          loan_id: string | null
          loan_purpose: string | null
          loan_type: string | null
          number_of_units: number | null
          originator: string | null
          processor: string | null
          property_address: string | null
          property_city: string | null
          property_state: string | null
          property_type: string | null
          property_zip: string | null
          proposed_interest_rate: number | null
          proposed_loan_amount: number | null
          proposed_ltarv: number | null
          proposed_ltv: number | null
          stage: string | null
          stage_changed_at: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
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
      servicing_maturity_schedule: {
        Row: {
          borrower_name: string | null
          current_balance: number | null
          days_until_maturity: number | null
          loan_id: string | null
          maturity_date: string | null
          maturity_status: string | null
          property_address: string | null
        }
        Insert: {
          borrower_name?: string | null
          current_balance?: number | null
          days_until_maturity?: never
          loan_id?: string | null
          maturity_date?: string | null
          maturity_status?: never
          property_address?: string | null
        }
        Update: {
          borrower_name?: string | null
          current_balance?: number | null
          days_until_maturity?: never
          loan_id?: string | null
          maturity_date?: string | null
          maturity_status?: never
          property_address?: string | null
        }
        Relationships: []
      }
      servicing_portfolio_summary: {
        Row: {
          average_loan_size: number | null
          commercial_active_count: number | null
          commercial_outstanding_balance: number | null
          rtl_active_count: number | null
          rtl_outstanding_balance: number | null
          total_active_loans: number | null
          total_outstanding_balance: number | null
        }
        Relationships: []
      }
      weekly_dashboard_summary: {
        Row: {
          period: string | null
          tasks_completed: number | null
          tasks_created: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ops_tasks_assigned_to_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "equity_pipeline"
            referencedColumns: ["assigned_to_profile_id"]
          },
          {
            foreignKeyName: "ops_tasks_assigned_to_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      advance_stage: {
        Args: {
          p_instance_id: string
          p_note?: string
          p_to_stage_id: string
          p_user_id: string
        }
        Returns: Json
      }
      apply_document_review: {
        Args: {
          p_approved_items?: string[]
          p_note_text?: string
          p_rejected_items?: string[]
          p_review_id: string
        }
        Returns: Json
      }
      apply_payment: {
        Args: {
          p_amount_received: number
          p_applied_by: string
          p_loan_id: string
          p_payment_date: string
          p_reference_number: string
        }
        Returns: Json
      }
      approve_budget_change_request: {
        Args: { p_approved_by: string; p_request_id: string }
        Returns: Json
      }
      approve_draw_request: {
        Args: {
          p_draw_request_id: string
          p_line_item_approvals: Json
          p_review_notes?: string
          p_reviewer_id: string
        }
        Returns: Json
      }
      archive_all_notifications: { Args: never; Returns: undefined }
      archive_notification: {
        Args: { p_notification_id: string }
        Returns: undefined
      }
      assign_role: {
        Args: {
          target_borrower_id?: string
          target_investor_id?: string
          target_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: string
      }
      calculate_funded_balance: {
        Args: { p_as_of_date: string; p_loan_id: string }
        Returns: number
      }
      calculate_interest_for_period: {
        Args: { p_billing_month: string; p_loan_id: string }
        Returns: Json
      }
      calculate_next_due_date: {
        Args: {
          p_anchor_day: number
          p_anchor_month: number
          p_current_due: string
          p_every_x_months: number
          p_monthly_mode: string
          p_nth_occurrence: number
          p_nth_weekday: number
          p_recurrence_type: string
        }
        Returns: string
      }
      calculate_per_diem: {
        Args: { p_annual_rate: number; p_balance: number }
        Returns: number
      }
      column_exists: {
        Args: { p_column: string; p_table: string }
        Returns: boolean
      }
      complete_recurring_task: { Args: { p_task_id: string }; Returns: Json }
      create_construction_budget: {
        Args: { p_created_by: string; p_line_items: Json; p_loan_id: string }
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
      evaluate_auto_approval: { Args: { p_loan_id: string }; Returns: string }
      exec_ddl: { Args: { sql: string }; Returns: undefined }
      execute_workflow_trigger: {
        Args: {
          p_context?: Json
          p_instance_id: string
          p_stage_id: string
          p_trigger_type: string
          p_triggered_by: string
        }
        Returns: undefined
      }
      find_potential_duplicates: {
        Args: { target_contact_id: string }
        Returns: {
          confidence: number
          duplicate_contact_id: string
          duplicate_email: string
          duplicate_name: string
          duplicate_phone: string
          match_type: string
        }[]
      }
      fund_draw_request: {
        Args: {
          p_draw_request_id: string
          p_funded_by: string
          p_wire_amount: number
          p_wire_confirmation_number: string
          p_wire_date: string
        }
        Returns: Json
      }
      generate_billing_cycle: {
        Args: { p_billing_month: string; p_created_by: string }
        Returns: string
      }
      generate_deal_conditions: { Args: { p_deal_id: string }; Returns: number }
      generate_loan_conditions: { Args: { p_loan_id: string }; Returns: number }
      generate_nacha_file: {
        Args: { p_billing_cycle_id: string }
        Returns: string
      }
      generate_next_recurring_task: { Args: { task_id: string }; Returns: Json }
      generate_payoff_quote: {
        Args: { p_loan_id: string; p_payoff_date: string }
        Returns: Json
      }
      generate_recurring_tasks: { Args: never; Returns: undefined }
      get_active_notification_count: { Args: never; Returns: number }
      get_borrower_deals_last_2_years: {
        Args: { p_borrower_id: string }
        Returns: number
      }
      get_draw_summary: { Args: { p_loan_id: string }; Returns: Json }
      get_my_roles: {
        Args: never
        Returns: {
          borrower_id: string
          display_name: string
          id: string
          investor_id: string
          is_active: boolean
          role: string
        }[]
      }
      get_portal_context: { Args: never; Returns: Json }
      get_portfolio_draw_dashboard: { Args: never; Returns: Json }
      grant_all_modules: {
        Args: { granter_id: string; target_user_id: string }
        Returns: undefined
      }
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
      link_contact_to_user: {
        Args: { contact_email: string }
        Returns: {
          already_linked: boolean
          contact_id: string
          contact_name: string
          profile_email: string
          profile_id: string
        }[]
      }
      match_email_to_entities: {
        Args: { lookup_email: string }
        Returns: {
          borrower_id: string
          contact_id: string
          investor_id: string
          linked_loan_id: string
          profile_id: string
          source_id: string
          source_type: string
        }[]
      }
      match_or_create_property: { Args: { p_loan_id: string }; Returns: string }
      my_borrower_ids: { Args: never; Returns: string[] }
      my_investor_ids: { Args: never; Returns: string[] }
      recalc_combined_borrower_financials: {
        Args: { p_loan_id: string }
        Returns: undefined
      }
      refresh_delinquency_records: { Args: never; Returns: Json }
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
      run_reconciliation_checks: {
        Args: { p_billing_cycle_id: string }
        Returns: Json
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
      search_sop_embeddings: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          chunk_text: string
          similarity: number
          sop_id: string
          sop_title: string
        }[]
      }
      search_sops: {
        Args: { cat?: string; dept?: string; search_query: string }
        Returns: {
          category: string
          department: string
          id: string
          rank: number
          slug: string
          status: string
          summary: string
          title: string
        }[]
      }
      set_active_underwriting_version: {
        Args: { p_version_id: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      soundex: { Args: { "": string }; Returns: string }
      submit_approval_decision: {
        Args: {
          p_decision: string
          p_note?: string
          p_task_id: string
          p_user_id: string
        }
        Returns: Json
      }
      submit_draw_request: {
        Args: {
          p_borrower_notes: string
          p_line_item_draws: Json
          p_loan_id: string
          p_requested_by: string
        }
        Returns: Json
      }
      test_servicing_infrastructure: { Args: never; Returns: Json }
      text_soundex: { Args: { "": string }; Returns: string }
      unaccent: { Args: { "": string }; Returns: string }
      unarchive_notification: {
        Args: { p_notification_id: string }
        Returns: undefined
      }
      unified_advance_stage: {
        Args: { p_deal_id: string; p_new_stage: string; p_notes?: string }
        Returns: undefined
      }
      unified_checklist_progress: {
        Args: { p_deal_id: string }
        Returns: {
          completed: number
          total: number
        }[]
      }
      update_user_streak: { Args: { p_user_id: string }; Returns: undefined }
      validate_budget_integrity: {
        Args: { p_budget_id: string }
        Returns: boolean
      }
      validate_change_request_balance: {
        Args: { p_request_id: string }
        Returns: boolean
      }
    }
    Enums: {
      ach_account_type: "checking" | "savings"
      activity_direction_enum: "inbound" | "outbound"
      app_role: "super_admin" | "admin" | "investor" | "borrower"
      audit_action_enum: "insert" | "update" | "delete"
      billing_cycle_status: "draft" | "reconciled" | "submitted" | "complete"
      billing_line_item_status:
        | "pending"
        | "paid"
        | "partial"
        | "delinquent"
        | "waived"
      budget_change_action: "add" | "increase" | "decrease" | "remove"
      budget_change_request_status:
        | "pending"
        | "approved"
        | "rejected"
        | "withdrawn"
      budget_line_item_change_type:
        | "created"
        | "amount_revised"
        | "description_updated"
        | "deactivated"
        | "reactivated"
      budget_status: "draft" | "active" | "completed" | "closed"
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
      chat_channel_type:
        | "deal_room"
        | "team"
        | "direct"
        | "group"
        | "investor_room"
        | "borrower_room"
        | "project_room"
      chat_entity_type:
        | "loan"
        | "property"
        | "fund"
        | "investor"
        | "borrower"
        | "borrower_entity"
        | "ops_project"
        | "crm_contact"
        | "opportunity"
      chat_member_role: "owner" | "admin" | "member" | "guest" | "observer"
      chat_message_type:
        | "text"
        | "system"
        | "file"
        | "ai_response"
        | "action_item"
        | "status_update"
        | "mention_link"
      company_subtype_enum:
        | "bank"
        | "agency_lender"
        | "private_lender"
        | "correspondent"
        | "credit_union"
      company_type_enum:
        | "brokerage"
        | "lender"
        | "title_company"
        | "law_firm"
        | "insurance"
        | "appraisal"
        | "other"
        | "equity_investor"
        | "software"
        | "accounting_firm"
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
      contact_rating_enum: "hot" | "warm" | "cold"
      crm_activity_type_enum:
        | "call"
        | "email"
        | "text_message"
        | "note"
        | "meeting"
        | "document"
        | "site_visit"
        | "status_change"
        | "system"
        | "other"
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
        | "inbound_call"
        | "data_migration"
        | "cix"
        | "lendersa"
        | "bl2425apn"
        | "capitalize"
        | "linkedin"
        | "facebook"
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
      crm_event_response: "pending" | "accepted" | "declined" | "tentative"
      crm_event_type:
        | "meeting"
        | "call"
        | "site_visit"
        | "closing"
        | "appraisal"
        | "webinar"
        | "conference"
        | "lunch"
        | "other"
      delinquency_bucket: "current" | "1-30" | "31-60" | "61-90" | "90+"
      doc_format_enum: "docx" | "pdf"
      doc_status_enum:
        | "draft"
        | "sent_for_signature"
        | "viewed"
        | "signed"
        | "declined"
        | "expired"
        | "voided"
      draw_document_type:
        | "photo"
        | "invoice"
        | "inspector_report"
        | "lien_waiver"
        | "sitewire_report"
        | "other"
      draw_line_item_approval_status:
        | "pending"
        | "approved"
        | "rejected"
        | "blocked_change_order_required"
      draw_request_status:
        | "draft"
        | "submitted"
        | "inspection_ordered"
        | "inspection_complete"
        | "under_review"
        | "approved"
        | "funded"
        | "rejected"
        | "denied"
        | "withdrawn"
        | "partially_approved"
      equity_deal_source:
        | "broker"
        | "off_market"
        | "auction"
        | "direct_to_seller"
        | "referral"
        | "internal_portfolio"
        | "mls"
        | "other"
      equity_deal_stage:
        | "new_deals"
        | "underwritten_needs_review"
        | "offer_placed"
        | "under_contract"
        | "closed_won"
        | "closed_lost"
      equity_task_status:
        | "not_started"
        | "in_progress"
        | "completed"
        | "blocked"
        | "waived"
      google_sync_status: "pending" | "synced" | "failed" | "not_synced"
      inspection_method:
        | "physical_inspector"
        | "sitewire"
        | "internal_review"
        | "waived"
      inspection_report_type: "physical" | "sitewire" | "desk_review"
      inspector_type_enum: "independent" | "sitewire" | "internal"
      interest_method_type: "dutch" | "non_dutch"
      language_preference_enum: "english" | "spanish"
      late_fee_type: "flat" | "percentage"
      lender_direction_enum:
        | "broker_to"
        | "note_buyer"
        | "capital_partner"
        | "co_lender"
        | "referral_from"
      lifecycle_stage_enum:
        | "uncontacted"
        | "lead"
        | "prospect"
        | "active"
        | "past"
      linked_entity_type_enum: "loan" | "borrower" | "investor" | "fund"
      loan_event_type:
        | "origination"
        | "draw_funded"
        | "payment_received"
        | "payment_applied_interest"
        | "payment_applied_principal"
        | "payment_applied_fee"
        | "late_fee_assessed"
        | "rate_change"
        | "maturity_extension"
        | "payoff_received"
        | "adjustment"
        | "charge_off"
      loan_purpose:
        | "purchase"
        | "refinance"
        | "cash_out_refinance"
        | "guc"
        | "transactional"
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
        | "awaiting_info"
        | "uw"
        | "quoting"
        | "offer_placed"
        | "closed"
        | "onboarding"
        | "closed_lost"
      loan_type: "commercial" | "dscr" | "guc" | "rtl" | "transactional"
      payment_structure_type: "interest_only" | "principal_and_interest"
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
        | "rv_campground"
        | "self_storage"
        | "hotel_hospitality"
        | "healthcare"
      record_type_enum: "loan" | "contact" | "deal" | "company"
      relationship_type_enum:
        | "borrower"
        | "investor"
        | "broker"
        | "lender"
        | "vendor"
        | "referral_partner"
      send_status_enum: "pending" | "sent" | "delivered" | "bounced" | "failed"
      servicing_loan_status:
        | "pending"
        | "active"
        | "delinquent"
        | "in_default"
        | "paid_off"
        | "charged_off"
      servicing_payment_type: "regular" | "payoff" | "partial" | "returned"
      template_type_enum:
        | "nda"
        | "broker_agreement"
        | "term_sheet"
        | "loan_agreement"
        | "investor_agreement"
        | "other"
      vendor_type_enum:
        | "title_company"
        | "law_firm"
        | "insurance"
        | "appraisal"
        | "engineer"
        | "inspector"
        | "other"
        | "software"
        | "accounting_firm"
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
      ach_account_type: ["checking", "savings"],
      activity_direction_enum: ["inbound", "outbound"],
      app_role: ["super_admin", "admin", "investor", "borrower"],
      audit_action_enum: ["insert", "update", "delete"],
      billing_cycle_status: ["draft", "reconciled", "submitted", "complete"],
      billing_line_item_status: [
        "pending",
        "paid",
        "partial",
        "delinquent",
        "waived",
      ],
      budget_change_action: ["add", "increase", "decrease", "remove"],
      budget_change_request_status: [
        "pending",
        "approved",
        "rejected",
        "withdrawn",
      ],
      budget_line_item_change_type: [
        "created",
        "amount_revised",
        "description_updated",
        "deactivated",
        "reactivated",
      ],
      budget_status: ["draft", "active", "completed", "closed"],
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
      chat_channel_type: [
        "deal_room",
        "team",
        "direct",
        "group",
        "investor_room",
        "borrower_room",
        "project_room",
      ],
      chat_entity_type: [
        "loan",
        "property",
        "fund",
        "investor",
        "borrower",
        "borrower_entity",
        "ops_project",
        "crm_contact",
        "opportunity",
      ],
      chat_member_role: ["owner", "admin", "member", "guest", "observer"],
      chat_message_type: [
        "text",
        "system",
        "file",
        "ai_response",
        "action_item",
        "status_update",
        "mention_link",
      ],
      company_subtype_enum: [
        "bank",
        "agency_lender",
        "private_lender",
        "correspondent",
        "credit_union",
      ],
      company_type_enum: [
        "brokerage",
        "lender",
        "title_company",
        "law_firm",
        "insurance",
        "appraisal",
        "other",
        "equity_investor",
        "software",
        "accounting_firm",
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
      contact_rating_enum: ["hot", "warm", "cold"],
      crm_activity_type_enum: [
        "call",
        "email",
        "text_message",
        "note",
        "meeting",
        "document",
        "site_visit",
        "status_change",
        "system",
        "other",
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
        "inbound_call",
        "data_migration",
        "cix",
        "lendersa",
        "bl2425apn",
        "capitalize",
        "linkedin",
        "facebook",
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
      crm_event_response: ["pending", "accepted", "declined", "tentative"],
      crm_event_type: [
        "meeting",
        "call",
        "site_visit",
        "closing",
        "appraisal",
        "webinar",
        "conference",
        "lunch",
        "other",
      ],
      delinquency_bucket: ["current", "1-30", "31-60", "61-90", "90+"],
      doc_format_enum: ["docx", "pdf"],
      doc_status_enum: [
        "draft",
        "sent_for_signature",
        "viewed",
        "signed",
        "declined",
        "expired",
        "voided",
      ],
      draw_document_type: [
        "photo",
        "invoice",
        "inspector_report",
        "lien_waiver",
        "sitewire_report",
        "other",
      ],
      draw_line_item_approval_status: [
        "pending",
        "approved",
        "rejected",
        "blocked_change_order_required",
      ],
      draw_request_status: [
        "draft",
        "submitted",
        "inspection_ordered",
        "inspection_complete",
        "under_review",
        "approved",
        "funded",
        "rejected",
        "denied",
        "withdrawn",
        "partially_approved",
      ],
      equity_deal_source: [
        "broker",
        "off_market",
        "auction",
        "direct_to_seller",
        "referral",
        "internal_portfolio",
        "mls",
        "other",
      ],
      equity_deal_stage: [
        "new_deals",
        "underwritten_needs_review",
        "offer_placed",
        "under_contract",
        "closed_won",
        "closed_lost",
      ],
      equity_task_status: [
        "not_started",
        "in_progress",
        "completed",
        "blocked",
        "waived",
      ],
      google_sync_status: ["pending", "synced", "failed", "not_synced"],
      inspection_method: [
        "physical_inspector",
        "sitewire",
        "internal_review",
        "waived",
      ],
      inspection_report_type: ["physical", "sitewire", "desk_review"],
      inspector_type_enum: ["independent", "sitewire", "internal"],
      interest_method_type: ["dutch", "non_dutch"],
      language_preference_enum: ["english", "spanish"],
      late_fee_type: ["flat", "percentage"],
      lender_direction_enum: [
        "broker_to",
        "note_buyer",
        "capital_partner",
        "co_lender",
        "referral_from",
      ],
      lifecycle_stage_enum: [
        "uncontacted",
        "lead",
        "prospect",
        "active",
        "past",
      ],
      linked_entity_type_enum: ["loan", "borrower", "investor", "fund"],
      loan_event_type: [
        "origination",
        "draw_funded",
        "payment_received",
        "payment_applied_interest",
        "payment_applied_principal",
        "payment_applied_fee",
        "late_fee_assessed",
        "rate_change",
        "maturity_extension",
        "payoff_received",
        "adjustment",
        "charge_off",
      ],
      loan_purpose: [
        "purchase",
        "refinance",
        "cash_out_refinance",
        "guc",
        "transactional",
      ],
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
        "awaiting_info",
        "uw",
        "quoting",
        "offer_placed",
        "closed",
        "onboarding",
        "closed_lost",
      ],
      loan_type: ["commercial", "dscr", "guc", "rtl", "transactional"],
      payment_structure_type: ["interest_only", "principal_and_interest"],
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
        "rv_campground",
        "self_storage",
        "hotel_hospitality",
        "healthcare",
      ],
      record_type_enum: ["loan", "contact", "deal", "company"],
      relationship_type_enum: [
        "borrower",
        "investor",
        "broker",
        "lender",
        "vendor",
        "referral_partner",
      ],
      send_status_enum: ["pending", "sent", "delivered", "bounced", "failed"],
      servicing_loan_status: [
        "pending",
        "active",
        "delinquent",
        "in_default",
        "paid_off",
        "charged_off",
      ],
      servicing_payment_type: ["regular", "payoff", "partial", "returned"],
      template_type_enum: [
        "nda",
        "broker_agreement",
        "term_sheet",
        "loan_agreement",
        "investor_agreement",
        "other",
      ],
      vendor_type_enum: [
        "title_company",
        "law_firm",
        "insurance",
        "appraisal",
        "engineer",
        "inspector",
        "other",
        "software",
        "accounting_firm",
      ],
    },
  },
} as const

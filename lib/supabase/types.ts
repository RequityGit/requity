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
      crm_activities: {
        Row: {
          activity_type: string
          contact_id: string
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          performed_by: string | null
          performed_by_name: string | null
          subject: string | null
        }
        Insert: {
          activity_type: string
          contact_id: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          performed_by?: string | null
          performed_by_name?: string | null
          subject?: string | null
        }
        Update: {
          activity_type?: string
          contact_id?: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          performed_by?: string | null
          performed_by_name?: string | null
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
          company_name: string | null
          contact_type: Database["public"]["Enums"]["crm_contact_type"]
          created_at: string
          deleted_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_contacted_at: string | null
          last_name: string | null
          linked_investor_id: string | null
          linked_loan_id: string | null
          name: string | null
          next_follow_up_date: string | null
          notes: string | null
          phone: string | null
          source: Database["public"]["Enums"]["crm_contact_source"] | null
          state: string | null
          status: Database["public"]["Enums"]["crm_contact_status"]
          updated_at: string
          zip: string | null
        }
        Insert: {
          address_line1?: string | null
          assigned_to?: string | null
          borrower_id?: string | null
          city?: string | null
          company_name?: string | null
          contact_type?: Database["public"]["Enums"]["crm_contact_type"]
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_contacted_at?: string | null
          last_name?: string | null
          linked_investor_id?: string | null
          linked_loan_id?: string | null
          name?: string | null
          next_follow_up_date?: string | null
          notes?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["crm_contact_source"] | null
          state?: string | null
          status?: Database["public"]["Enums"]["crm_contact_status"]
          updated_at?: string
          zip?: string | null
        }
        Update: {
          address_line1?: string | null
          assigned_to?: string | null
          borrower_id?: string | null
          city?: string | null
          company_name?: string | null
          contact_type?: Database["public"]["Enums"]["crm_contact_type"]
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_contacted_at?: string | null
          last_name?: string | null
          linked_investor_id?: string | null
          linked_loan_id?: string | null
          name?: string | null
          next_follow_up_date?: string | null
          notes?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["crm_contact_source"] | null
          state?: string | null
          status?: Database["public"]["Enums"]["crm_contact_status"]
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
          broker_fee_amount: number | null
          broker_fee_pct: number | null
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
          broker_fee_amount?: number | null
          broker_fee_pct?: number | null
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
          broker_fee_amount?: number | null
          broker_fee_pct?: number | null
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
      ops_project_comments: {
        Row: {
          author_id: string | null
          author_name: string | null
          comment: string
          created_at: string | null
          id: string
          project_id: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          comment: string
          created_at?: string | null
          id?: string
          project_id: string
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          comment?: string
          created_at?: string | null
          id?: string
          project_id?: string
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
          created_at: string | null
          id: string
          task_id: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          comment: string
          created_at?: string | null
          id?: string
          task_id: string
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          comment?: string
          created_at?: string | null
          id?: string
          task_id?: string
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
          company_name: string | null
          contact_type: Database["public"]["Enums"]["crm_contact_type"] | null
          created_at: string | null
          deleted_at: string | null
          email: string | null
          first_name: string | null
          id: string | null
          last_contacted_at: string | null
          last_name: string | null
          linked_investor_id: string | null
          linked_loan_id: string | null
          name: string | null
          next_follow_up_date: string | null
          notes: string | null
          phone: string | null
          source: Database["public"]["Enums"]["crm_contact_source"] | null
          state: string | null
          status: Database["public"]["Enums"]["crm_contact_status"] | null
          updated_at: string | null
          zip: string | null
        }
        Insert: {
          address_line1?: string | null
          assigned_to?: string | null
          borrower_id?: string | null
          city?: string | null
          company_name?: string | null
          contact_type?: Database["public"]["Enums"]["crm_contact_type"] | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string | null
          last_contacted_at?: string | null
          last_name?: string | null
          linked_investor_id?: string | null
          linked_loan_id?: string | null
          name?: string | null
          next_follow_up_date?: string | null
          notes?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["crm_contact_source"] | null
          state?: string | null
          status?: Database["public"]["Enums"]["crm_contact_status"] | null
          updated_at?: string | null
          zip?: string | null
        }
        Update: {
          address_line1?: string | null
          assigned_to?: string | null
          borrower_id?: string | null
          city?: string | null
          company_name?: string | null
          contact_type?: Database["public"]["Enums"]["crm_contact_type"] | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string | null
          last_contacted_at?: string | null
          last_name?: string | null
          linked_investor_id?: string | null
          linked_loan_id?: string | null
          name?: string | null
          next_follow_up_date?: string | null
          notes?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["crm_contact_source"] | null
          state?: string | null
          status?: Database["public"]["Enums"]["crm_contact_status"] | null
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
      my_borrower_ids: { Args: never; Returns: string[] }
      my_investor_ids: { Args: never; Returns: string[] }
      revoke_role: {
        Args: {
          _borrower_id?: string
          _investor_id?: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "investor" | "borrower"
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
      app_role: ["super_admin", "admin", "investor", "borrower"],
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
    },
  },
} as const


// ---------------------------------------------------------------------------
// Convenience type aliases
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
export type OpsProject = Database["public"]["Tables"]["ops_projects"]["Row"];
export type OpsTask = Database["public"]["Tables"]["ops_tasks"]["Row"];

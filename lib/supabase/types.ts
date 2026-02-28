export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          company_name: string | null;
          phone: string | null;
          role: "admin" | "borrower" | "investor";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          company_name?: string | null;
          phone?: string | null;
          role: "admin" | "borrower" | "investor";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          company_name?: string | null;
          phone?: string | null;
          role?: "admin" | "borrower" | "investor";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      funds: {
        Row: {
          id: string;
          name: string;
          fund_type: string | null;
          target_size: number | null;
          current_aum: number;
          vintage_year: number | null;
          irr_target: number | null;
          preferred_return: number | null;
          management_fee: number | null;
          description: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          fund_type?: string | null;
          target_size?: number | null;
          current_aum?: number;
          vintage_year?: number | null;
          irr_target?: number | null;
          preferred_return?: number | null;
          management_fee?: number | null;
          description?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          fund_type?: string | null;
          target_size?: number | null;
          current_aum?: number;
          vintage_year?: number | null;
          irr_target?: number | null;
          preferred_return?: number | null;
          management_fee?: number | null;
          description?: string | null;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      investor_commitments: {
        Row: {
          id: string;
          investor_id: string;
          fund_id: string;
          commitment_amount: number;
          funded_amount: number;
          unfunded_amount: number;
          commitment_date: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          investor_id: string;
          fund_id: string;
          commitment_amount: number;
          funded_amount?: number;
          commitment_date?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          investor_id?: string;
          fund_id?: string;
          commitment_amount?: number;
          funded_amount?: number;
          commitment_date?: string | null;
          status?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "investor_commitments_investor_id_fkey";
            columns: ["investor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "investor_commitments_fund_id_fkey";
            columns: ["fund_id"];
            isOneToOne: false;
            referencedRelation: "funds";
            referencedColumns: ["id"];
          },
        ];
      };
      capital_calls: {
        Row: {
          id: string;
          fund_id: string;
          investor_id: string;
          commitment_id: string | null;
          call_amount: number;
          due_date: string;
          status: string;
          paid_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          fund_id: string;
          investor_id: string;
          commitment_id?: string | null;
          call_amount: number;
          due_date: string;
          status?: string;
          paid_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          fund_id?: string;
          investor_id?: string;
          commitment_id?: string | null;
          call_amount?: number;
          due_date?: string;
          status?: string;
          paid_date?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "capital_calls_fund_id_fkey";
            columns: ["fund_id"];
            isOneToOne: false;
            referencedRelation: "funds";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "capital_calls_investor_id_fkey";
            columns: ["investor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "capital_calls_commitment_id_fkey";
            columns: ["commitment_id"];
            isOneToOne: false;
            referencedRelation: "investor_commitments";
            referencedColumns: ["id"];
          },
        ];
      };
      distributions: {
        Row: {
          id: string;
          fund_id: string;
          investor_id: string;
          commitment_id: string | null;
          distribution_type: string | null;
          amount: number;
          distribution_date: string;
          description: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          fund_id: string;
          investor_id: string;
          commitment_id?: string | null;
          distribution_type?: string | null;
          amount: number;
          distribution_date: string;
          description?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          fund_id?: string;
          investor_id?: string;
          commitment_id?: string | null;
          distribution_type?: string | null;
          amount?: number;
          distribution_date?: string;
          description?: string | null;
          status?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "distributions_fund_id_fkey";
            columns: ["fund_id"];
            isOneToOne: false;
            referencedRelation: "funds";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "distributions_investor_id_fkey";
            columns: ["investor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "distributions_commitment_id_fkey";
            columns: ["commitment_id"];
            isOneToOne: false;
            referencedRelation: "investor_commitments";
            referencedColumns: ["id"];
          },
        ];
      };
      loans: {
        Row: {
          id: string;
          borrower_id: string;
          loan_number: string | null;
          loan_type: string | null;
          property_address: string | null;
          property_city: string | null;
          property_state: string | null;
          property_zip: string | null;
          loan_amount: number;
          appraised_value: number | null;
          ltv: number | null;
          interest_rate: number | null;
          term_months: number | null;
          origination_date: string | null;
          maturity_date: string | null;
          stage: string;
          stage_updated_at: string;
          originator: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          borrower_id: string;
          loan_number?: string | null;
          loan_type?: string | null;
          property_address?: string | null;
          property_city?: string | null;
          property_state?: string | null;
          property_zip?: string | null;
          loan_amount: number;
          appraised_value?: number | null;
          interest_rate?: number | null;
          term_months?: number | null;
          origination_date?: string | null;
          maturity_date?: string | null;
          stage?: string;
          stage_updated_at?: string;
          originator?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          borrower_id?: string;
          loan_number?: string | null;
          loan_type?: string | null;
          property_address?: string | null;
          property_city?: string | null;
          property_state?: string | null;
          property_zip?: string | null;
          loan_amount?: number;
          appraised_value?: number | null;
          interest_rate?: number | null;
          term_months?: number | null;
          origination_date?: string | null;
          maturity_date?: string | null;
          stage?: string;
          stage_updated_at?: string;
          originator?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "loans_borrower_id_fkey";
            columns: ["borrower_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      draw_requests: {
        Row: {
          id: string;
          loan_id: string;
          borrower_id: string;
          draw_number: number;
          amount_requested: number;
          amount_approved: number | null;
          description: string | null;
          status: string;
          submitted_at: string;
          reviewed_at: string | null;
          reviewer_notes: string | null;
        };
        Insert: {
          id?: string;
          loan_id: string;
          borrower_id: string;
          draw_number?: number;
          amount_requested: number;
          amount_approved?: number | null;
          description?: string | null;
          status?: string;
          submitted_at?: string;
          reviewed_at?: string | null;
          reviewer_notes?: string | null;
        };
        Update: {
          id?: string;
          loan_id?: string;
          borrower_id?: string;
          draw_number?: number;
          amount_requested?: number;
          amount_approved?: number | null;
          description?: string | null;
          status?: string;
          submitted_at?: string;
          reviewed_at?: string | null;
          reviewer_notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "draw_requests_loan_id_fkey";
            columns: ["loan_id"];
            isOneToOne: false;
            referencedRelation: "loans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "draw_requests_borrower_id_fkey";
            columns: ["borrower_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      loan_payments: {
        Row: {
          id: string;
          loan_id: string;
          borrower_id: string;
          payment_number: number | null;
          amount_due: number;
          amount_paid: number | null;
          principal_amount: number | null;
          interest_amount: number | null;
          due_date: string;
          paid_date: string | null;
          status: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          loan_id: string;
          borrower_id: string;
          payment_number?: number | null;
          amount_due: number;
          amount_paid?: number | null;
          principal_amount?: number | null;
          interest_amount?: number | null;
          due_date: string;
          paid_date?: string | null;
          status?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          loan_id?: string;
          borrower_id?: string;
          payment_number?: number | null;
          amount_due?: number;
          amount_paid?: number | null;
          principal_amount?: number | null;
          interest_amount?: number | null;
          due_date?: string;
          paid_date?: string | null;
          status?: string;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "loan_payments_loan_id_fkey";
            columns: ["loan_id"];
            isOneToOne: false;
            referencedRelation: "loans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "loan_payments_borrower_id_fkey";
            columns: ["borrower_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          id: string;
          owner_id: string;
          uploaded_by: string | null;
          document_type: string;
          file_name: string;
          description: string | null;
          file_path: string;
          file_size: number | null;
          mime_type: string | null;
          fund_id: string | null;
          loan_id: string | null;
          status: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          uploaded_by?: string | null;
          document_type: string;
          file_name: string;
          description?: string | null;
          file_path: string;
          file_size?: number | null;
          mime_type?: string | null;
          fund_id?: string | null;
          loan_id?: string | null;
          status?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          uploaded_by?: string | null;
          document_type?: string;
          file_name?: string;
          description?: string | null;
          file_path?: string;
          file_size?: number | null;
          mime_type?: string | null;
          fund_id?: string | null;
          loan_id?: string | null;
          status?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_fund_id_fkey";
            columns: ["fund_id"];
            isOneToOne: false;
            referencedRelation: "funds";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_loan_id_fkey";
            columns: ["loan_id"];
            isOneToOne: false;
            referencedRelation: "loans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: "admin" | "borrower" | "investor";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Convenience type aliases
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type Fund = Database["public"]["Tables"]["funds"]["Row"];
export type FundInsert = Database["public"]["Tables"]["funds"]["Insert"];
export type FundUpdate = Database["public"]["Tables"]["funds"]["Update"];

export type InvestorCommitment = Database["public"]["Tables"]["investor_commitments"]["Row"];
export type InvestorCommitmentInsert = Database["public"]["Tables"]["investor_commitments"]["Insert"];
export type InvestorCommitmentUpdate = Database["public"]["Tables"]["investor_commitments"]["Update"];

export type CapitalCall = Database["public"]["Tables"]["capital_calls"]["Row"];
export type CapitalCallInsert = Database["public"]["Tables"]["capital_calls"]["Insert"];
export type CapitalCallUpdate = Database["public"]["Tables"]["capital_calls"]["Update"];

export type Distribution = Database["public"]["Tables"]["distributions"]["Row"];
export type DistributionInsert = Database["public"]["Tables"]["distributions"]["Insert"];
export type DistributionUpdate = Database["public"]["Tables"]["distributions"]["Update"];

export type Loan = Database["public"]["Tables"]["loans"]["Row"];
export type LoanInsert = Database["public"]["Tables"]["loans"]["Insert"];
export type LoanUpdate = Database["public"]["Tables"]["loans"]["Update"];

export type DrawRequest = Database["public"]["Tables"]["draw_requests"]["Row"];
export type DrawRequestInsert = Database["public"]["Tables"]["draw_requests"]["Insert"];
export type DrawRequestUpdate = Database["public"]["Tables"]["draw_requests"]["Update"];

export type LoanPayment = Database["public"]["Tables"]["loan_payments"]["Row"];
export type LoanPaymentInsert = Database["public"]["Tables"]["loan_payments"]["Insert"];
export type LoanPaymentUpdate = Database["public"]["Tables"]["loan_payments"]["Update"];

export type Document = Database["public"]["Tables"]["documents"]["Row"];
export type DocumentInsert = Database["public"]["Tables"]["documents"]["Insert"];
export type DocumentUpdate = Database["public"]["Tables"]["documents"]["Update"];

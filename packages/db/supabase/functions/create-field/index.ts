// Supabase Edge Function: create-field
// Creates a new real database column and registers it in field_configurations.
// Only callable by super_admin users.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Postgres reserved words blocklist
const RESERVED_WORDS = new Set([
  "id", "type", "order", "group", "user", "table", "column", "index", "key",
  "select", "insert", "update", "delete", "create", "drop", "alter",
  "primary", "foreign", "constraint", "reference", "default", "null",
  "not", "and", "or", "where", "from", "join", "on", "in", "is", "as",
  "by", "to", "set", "values", "into", "like", "between", "exists",
  "having", "limit", "offset", "union", "all", "any", "case", "when",
  "then", "else", "end", "cast", "check", "unique", "grant", "revoke",
  "role", "schema", "sequence", "trigger", "view", "with", "status",
  "name", "date", "time", "timestamp", "text", "number", "value",
  "result", "level", "position", "comment", "label", "description",
  "data", "metadata", "source", "target", "state", "action", "event",
  "record", "field", "input", "output", "session", "token", "hash",
  "code", "message",
]);

// Map module name to actual table name
const MODULE_TO_TABLE: Record<string, string> = {
  loan_details: "loans",
  property: "loans",
  borrower_entity: "loans",
  equity_deal: "equity_deals",
  equity_property: "equity_properties",
  equity_notes: "equity_deals",
  company_info: "companies",
  borrower_profile: "borrowers",
  investor_profile: "investors",
  contact_profile: "crm_contacts",
  loans_extended: "loans",
  servicing_loan: "servicing_loans",
  fund_details: "funds",
  opportunity: "opportunities",
  standalone_property: "properties",
  borrower_entity_detail: "borrower_entities",
  investing_entity: "investing_entities",
  investor_commitment: "investor_commitments",
  capital_call: "capital_calls",
  distribution: "distributions",
  draw_request: "draw_requests",
  payoff_statement: "payoff_statements",
  wire_instructions: "company_wire_instructions",
  crm_activity: "crm_activities",
  equity_underwriting: "equity_underwriting",
};

// Map field_type to Postgres column type
const FIELD_TYPE_TO_PG: Record<string, string> = {
  text: "TEXT",
  email: "TEXT",
  phone: "TEXT",
  dropdown: "TEXT",
  number: "NUMERIC",
  currency: "NUMERIC",
  percentage: "NUMERIC",
  date: "DATE",
  boolean: "BOOLEAN",
};

interface CreateFieldPayload {
  module: string;
  field_key: string;
  field_label: string;
  field_type: string;
  column_position: "left" | "right";
  dropdown_options: string[] | null;
  formula_expression: string | null;
  formula_source_fields: string[] | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller JWT and check super_admin role
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: callingUser }, error: authError } = await userClient.auth.getUser();
    if (authError || !callingUser) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check super_admin role
    const { data: superAdminRole } = await userClient
      .from("user_roles")
      .select("id")
      .eq("user_id", callingUser.id)
      .eq("role", "super_admin")
      .eq("is_active", true)
      .single();

    if (!superAdminRole) {
      return new Response(
        JSON.stringify({ error: "Forbidden: super_admin role required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse body
    const body: CreateFieldPayload = await req.json();
    const { module, field_key, field_label, field_type, column_position, dropdown_options, formula_expression, formula_source_fields } = body;

    // Validate required fields
    if (!module || !field_key || !field_label || !field_type || !column_position) {
      return new Response(
        JSON.stringify({ error: "module, field_key, field_label, field_type, and column_position are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate field_key format
    if (!/^[a-z][a-z0-9_]*$/.test(field_key)) {
      return new Response(
        JSON.stringify({ error: "field_key must start with a letter and contain only lowercase letters, numbers, and underscores" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (field_key.length > 63) {
      return new Response(
        JSON.stringify({ error: "field_key must be 63 characters or less" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (RESERVED_WORDS.has(field_key)) {
      return new Response(
        JSON.stringify({ error: `'${field_key}' is a reserved word and cannot be used as a field key` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate module
    const tableName = MODULE_TO_TABLE[module];
    if (!tableName) {
      return new Response(
        JSON.stringify({ error: `Unknown module: ${module}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Formula fields don't need a PG column type (they're calculated client-side)
    const isFormula = field_type === "formula";
    const pgType = isFormula ? null : FIELD_TYPE_TO_PG[field_type];
    if (!isFormula && !pgType) {
      return new Response(
        JSON.stringify({ error: `Unknown field_type: ${field_type}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate formula fields have expression and source fields
    if (isFormula && (!formula_expression || !formula_source_fields || formula_source_fields.length === 0)) {
      return new Response(
        JSON.stringify({ error: "Formula fields require formula_expression and formula_source_fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client for DB operations
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // For non-formula fields, check if column already exists on the target table
    if (!isFormula) {
      const { data: colExists } = await adminClient
        .rpc("column_exists", { p_table: tableName, p_column: field_key });

      if (colExists) {
        return new Response(
          JSON.stringify({ error: `Column '${field_key}' already exists on table '${tableName}'` }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Check if field_key already exists in field_configurations for this module
    const { data: existingConfig } = await adminClient
      .from("field_configurations")
      .select("id")
      .eq("module", module)
      .eq("field_key", field_key)
      .single();

    if (existingConfig) {
      return new Response(
        JSON.stringify({ error: `Field key '${field_key}' already exists in module '${module}'` }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the next display_order for this module
    const { data: maxOrderRows } = await adminClient
      .from("field_configurations")
      .select("display_order")
      .eq("module", module)
      .order("display_order", { ascending: false })
      .limit(1);

    const nextOrder = maxOrderRows && maxOrderRows.length > 0
      ? maxOrderRows[0].display_order + 1
      : 0;

    // For non-formula fields, execute ALTER TABLE to add the column
    // Formula fields are calculated client-side, no DB column needed
    if (!isFormula && pgType) {
      const alterSQL = `ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS "${field_key}" ${pgType}`;
      const { error: alterError } = await adminClient.rpc("exec_ddl", { sql: alterSQL });

      if (alterError) {
        console.error("ALTER TABLE error:", alterError);
        return new Response(
          JSON.stringify({ error: `Failed to add column: ${alterError.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Insert field_configurations row
    const { data: newConfig, error: insertError } = await adminClient
      .from("field_configurations")
      .insert({
        module,
        field_key,
        field_label,
        field_type,
        column_position,
        display_order: nextOrder,
        is_visible: true,
        is_locked: false,
        is_admin_created: true,
        dropdown_options: dropdown_options ?? null,
        is_archived: false,
        formula_expression: isFormula ? formula_expression : null,
        formula_source_fields: isFormula ? formula_source_fields : null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert field_configurations error:", insertError);
      return new Response(
        JSON.stringify({ error: `Failed to register field: ${insertError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Audit log
    console.log(JSON.stringify({
      event: "create_field",
      created_by: callingUser.id,
      module,
      field_key,
      field_label,
      field_type,
      table: tableName,
      timestamp: new Date().toISOString(),
    }));

    return new Response(
      JSON.stringify({ success: true, field: newConfig }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("create-field error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

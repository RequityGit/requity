import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://edhlkknvlczhbowasjna.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkaGxra252bGN6aGJvd2Fzam5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMjY5NTYsImV4cCI6MjA4NzgwMjk1Nn0.Ob8m3pUUhgQpWvqmz5lTiQziD4IRRU_GxXrZi67B7x8";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to fetch with caching for ISR (never throws; returns [] on any failure)
export async function fetchSiteData<T>(
  table: string,
  options?: {
    filter?: Record<string, string>;
    order?: { column: string; ascending?: boolean } | null;
    eq?: [string, string | boolean];
  }
): Promise<T[]> {
  try {
    let query = supabase.from(table).select("*");

    if (options?.eq) {
      query = query.eq(options.eq[0], options.eq[1]);
    }

    if (options?.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    // Only add ORDER BY when explicitly requested or when order is not specified.
    // Pass order: null to skip ordering for tables without sort_order (e.g. site_company_info).
    const orderOpt = options?.order;
    if (orderOpt != null && typeof orderOpt === "object") {
      query = query.order(orderOpt.column, {
        ascending: orderOpt.ascending ?? true,
      });
    } else if (orderOpt !== null) {
      query = query.order("sort_order", { ascending: true });
    }

    const { data, error } = await query;
    if (error) {
      console.error(`Error fetching ${table}:`, error);
      return [];
    }
    return (data as T[]) ?? [];
  } catch (err) {
    console.error(`Error fetching ${table}:`, err);
    return [];
  }
}

// Re-export Supabase types for shared usage across apps
// Apps should import their own client/server/admin wrappers
// This package provides the shared types and migration tracking
export type {
  CompositeTypes,
  Database,
  Enums,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "./types";

/**
 * Resilient profile update helper.
 *
 * The `profiles` table may be missing optional columns (`phone`,
 * `company_name`, etc.) if certain migrations haven't been applied yet.
 * PostgREST returns (or throws) a "Could not find the '<col>' column …
 * in the schema cache" error when you reference a column that doesn't
 * exist.
 *
 * This helper attempts the update and, on such an error, progressively
 * removes the offending column from the payload and retries.  It handles
 * errors that are *returned* by the Supabase client **and** errors that
 * are *thrown* as exceptions (behaviour varies between client versions).
 */

// Columns that may legitimately be absent from the live `profiles` table.
const DROPPABLE_COLUMNS = ["phone", "company_name", "full_name", "activation_status"];

interface MinimalSupabaseClient {
  from(table: string): any;
}

/**
 * Update a single profiles row, silently dropping columns that don't
 * exist in the database schema.
 */
export async function resilientProfileUpdate(
  client: MinimalSupabaseClient,
  userId: string,
  data: Record<string, unknown>
): Promise<{ error: string | null }> {
  const payload = { ...data };

  for (let attempt = 0; attempt <= DROPPABLE_COLUMNS.length; attempt++) {
    let pgError: { message: string } | null = null;

    try {
      const { error } = await client
        .from("profiles")
        .update(payload)
        .eq("id", userId);
      pgError = error;
    } catch (thrown: any) {
      pgError = { message: thrown?.message || String(thrown) };
    }

    if (!pgError) return { error: null };

    const problemColumn = DROPPABLE_COLUMNS.find(
      (col) => col in payload && pgError!.message.includes(col)
    );

    if (problemColumn) {
      console.warn(
        `Column '${problemColumn}' missing from profiles — retrying without it`
      );
      delete payload[problemColumn];
      continue;
    }

    return { error: pgError.message };
  }

  return { error: "Failed to update profile after removing missing columns" };
}

/**
 * Upsert a profiles row, silently dropping columns that don't exist in
 * the database schema.
 */
export async function resilientProfileUpsert(
  client: MinimalSupabaseClient,
  data: Record<string, unknown>
): Promise<{ error: string | null }> {
  const payload = { ...data };

  for (let attempt = 0; attempt <= DROPPABLE_COLUMNS.length; attempt++) {
    let pgError: { message: string } | null = null;

    try {
      const { error } = await client.from("profiles").upsert(payload);
      pgError = error;
    } catch (thrown: any) {
      pgError = { message: thrown?.message || String(thrown) };
    }

    if (!pgError) return { error: null };

    const problemColumn = DROPPABLE_COLUMNS.find(
      (col) => col in payload && pgError!.message.includes(col)
    );

    if (problemColumn) {
      console.warn(
        `Column '${problemColumn}' missing from profiles — retrying without it`
      );
      delete payload[problemColumn];
      continue;
    }

    return { error: pgError.message };
  }

  return { error: "Failed to upsert profile after removing missing columns" };
}

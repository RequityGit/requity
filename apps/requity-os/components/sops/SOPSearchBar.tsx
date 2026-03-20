"use client";

import { Search, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSOPSearch } from "@/hooks/useSOPSearch";

export function SOPSearchBar() {
  const { query, setQuery, results, loading } = useSOPSearch();

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search SOPs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-border bg-secondary px-12 py-3 text-foreground placeholder:text-muted-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring"
        />
        {loading && (
          <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-primary" />
        )}
      </div>

      {query.trim() && results.length > 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-border bg-card shadow-lg">
          <div className="p-2">
            {results.slice(0, 8).map((sop) => (
              <Link
                key={sop.id}
                href={`/sops/${sop.slug}`}
                className="block rounded-lg px-3 py-2 transition hover:bg-muted"
                onClick={() => setQuery("")}
              >
                <div className="font-medium text-foreground">{sop.title}</div>
                {sop.summary && (
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {sop.summary}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {query.trim() && !loading && results.length === 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-border bg-card p-4 text-center shadow-lg">
          <p className="text-sm text-muted-foreground">
            No SOPs found for &ldquo;{query}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}

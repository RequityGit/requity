import type { FireGroupPayload, DispositionPayload } from "./types";

export async function fireCallGroup(payload: FireGroupPayload) {
  const res = await fetch("/api/dialer/call-group", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Network error" }));
    throw new Error(err.error || "Failed to fire call group");
  }
  return res.json();
}

export async function submitDisposition(payload: DispositionPayload) {
  const res = await fetch("/api/dialer/disposition", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Network error" }));
    throw new Error(err.error || "Failed to submit disposition");
  }
  return res.json();
}

export async function fetchDialerLists() {
  const res = await fetch("/api/dialer/lists");
  if (!res.ok) throw new Error("Failed to fetch lists");
  return res.json();
}

export async function createDialerList(body: {
  name: string;
  description?: string;
  assigned_to?: string;
  settings?: Record<string, unknown>;
  contactIds?: string[];
}) {
  const res = await fetch("/api/dialer/lists", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Network error" }));
    throw new Error(err.error || "Failed to create list");
  }
  return res.json();
}

export async function updateDialerList(
  listId: string,
  updates: Record<string, unknown>
) {
  const res = await fetch(`/api/dialer/lists/${listId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Network error" }));
    throw new Error(err.error || "Failed to update list");
  }
  return res.json();
}

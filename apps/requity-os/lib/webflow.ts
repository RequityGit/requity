const WEBFLOW_API = 'https://api.webflow.com/v2';

/** A Webflow CMS collection descriptor returned by the API. */
interface WebflowCollection {
  id: string;
  displayName: string;
  slug: string;
  [key: string]: unknown;
}

/** A Webflow CMS item returned by the API. */
interface WebflowItem {
  id: string;
  isDraft?: boolean;
  isArchived?: boolean;
  fieldData?: Record<string, unknown>;
  [key: string]: unknown;
}

/** A field definition within a Webflow collection schema. */
interface WebflowField {
  slug?: string;
  displayName?: string;
  validations?: {
    options?: Array<{ id?: string; name?: string }>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/** Shape returned by the collections endpoint. */
interface WebflowCollectionsResponse {
  collections?: WebflowCollection[];
}

/** Shape returned by the collection items endpoint. */
interface WebflowItemsResponse {
  items?: WebflowItem[];
}

/** Shape returned by a single collection (schema) endpoint. */
interface WebflowCollectionSchema {
  fields?: WebflowField[];
  [key: string]: unknown;
}

function headers() {
  return {
    Authorization: `Bearer ${process.env.WEBFLOW_API_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

async function fetchWebflow(path: string): Promise<Record<string, unknown> | null> {
  const res = await fetch(`${WEBFLOW_API}${path}`, {
    headers: headers(),
    next: { revalidate: 300 }, // cache for 5 minutes
  });
  if (!res.ok) {
    console.error(`Webflow API error: ${res.status} ${res.statusText} for ${path}`);
    return null;
  }
  return res.json();
}

/** List all CMS collections for the site */
export async function getCollections(): Promise<WebflowCollection[]> {
  const siteId = process.env.WEBFLOW_SITE_ID;
  const data = await fetchWebflow(`/sites/${siteId}/collections`) as WebflowCollectionsResponse | null;
  return data?.collections || [];
}

/** Get a single collection by ID */
export async function getCollection(collectionId: string): Promise<WebflowCollectionSchema | null> {
  const data = await fetchWebflow(`/collections/${collectionId}`) as WebflowCollectionSchema | null;
  return data;
}

/** Get all items from a collection (handles pagination) */
export async function getCollectionItems(collectionId: string, limit = 100): Promise<WebflowItem[]> {
  let allItems: WebflowItem[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const data = await fetchWebflow(
      `/collections/${collectionId}/items?limit=${Math.min(limit, 100)}&offset=${offset}`
    ) as WebflowItemsResponse | null;
    if (!data || !data.items) break;

    allItems = allItems.concat(data.items);
    offset += data.items.length;
    hasMore = data.items.length === 100 && allItems.length < limit;
  }

  return allItems;
}

/**
 * Find a collection by name (case-insensitive partial match).
 * Returns { collection, items } or null.
 */
export async function findCollectionByName(name: string) {
  const collections = await getCollections();
  const match = collections.find(
    (c: WebflowCollection) => c.displayName?.toLowerCase().includes(name.toLowerCase()) ||
           c.slug?.toLowerCase().includes(name.toLowerCase())
  );
  if (!match) return null;

  const items = await getCollectionItems(match.id);
  return { collection: match, items };
}

/**
 * Get all published CMS data organized by collection name.
 * Returns a map: { collectionSlug: { collection, items } }
 */
export async function getAllCMSData() {
  const collections = await getCollections();
  const results: Record<string, { collection: WebflowCollection; items: WebflowItem[] }> = {};

  for (const col of collections) {
    const items = await getCollectionItems(col.id);
    results[col.slug] = {
      collection: col,
      items: items.filter((item: WebflowItem) => !item.isDraft && !item.isArchived),
    };
  }

  return results;
}

/**
 * Build an option ID → name lookup map for a given field in a collection.
 * Webflow v2 Option fields return opaque IDs in item data; the collection
 * schema holds the human-readable names.
 * Returns a Map<string, string> (lowercased names).
 */
export async function getOptionMap(collectionId: string, fieldSlug: string): Promise<Map<string, string>> {
  const schema = await getCollection(collectionId);
  if (!schema || !schema.fields) return new Map();

  // Find the field by slug (case-insensitive) — also check partial matches
  const field = schema.fields.find((f: WebflowField) => {
    const s = (f.slug || '').toLowerCase();
    const d = (f.displayName || '').toLowerCase();
    const target = fieldSlug.toLowerCase();
    return s === target || d === target || s.includes(target) || d.includes(target);
  });

  if (!field || !field.validations?.options) return new Map();

  const map = new Map<string, string>();
  for (const opt of field.validations.options) {
    if (opt.id && opt.name) {
      map.set(opt.id, opt.name.toLowerCase().trim());
    }
    // Also map the name to itself for direct-string cases
    if (opt.name) {
      map.set(opt.name.toLowerCase().trim(), opt.name.toLowerCase().trim());
    }
  }
  return map;
}

/**
 * Extract a readable field value from a Webflow item.
 * Webflow CMS items store data in fieldData.
 */
export function getField(item: WebflowItem | null | undefined, fieldName: string): unknown {
  return item?.fieldData?.[fieldName] ?? null;
}

/**
 * Get image URL from a Webflow image field.
 */
export function getImageUrl(item: WebflowItem | null | undefined, fieldName: string): string | null {
  const field = getField(item, fieldName);
  if (!field) return null;
  if (typeof field === 'string') return field;
  if (typeof field === 'object' && field !== null && 'url' in field) {
    return (field as { url: string }).url || null;
  }
  return null;
}

import { getAllCMSData } from '@/lib/webflow';

interface WebflowCollection {
  id: string;
  displayName: string;
  slug: string;
}

interface WebflowItem {
  isDraft: boolean;
  isArchived: boolean;
  fieldData?: Record<string, unknown>;
}

interface CollectionSummary {
  id: string;
  displayName: string;
  slug: string;
  itemCount: number;
  sampleFields: string[];
  sampleItem: Record<string, unknown> | null;
}

export async function GET() {
  try {
    if (!process.env.WEBFLOW_API_TOKEN || !process.env.WEBFLOW_SITE_ID) {
      return Response.json(
        { error: 'WEBFLOW_API_TOKEN and WEBFLOW_SITE_ID env vars are required' },
        { status: 500 }
      );
    }

    const data = await getAllCMSData() as Record<string, { collection: WebflowCollection; items: WebflowItem[] }>;

    // Return a summary for each collection
    const summary: Record<string, CollectionSummary> = {};
    for (const [slug, { collection, items }] of Object.entries(data)) {
      summary[slug] = {
        id: collection.id,
        displayName: collection.displayName,
        slug: collection.slug,
        itemCount: items.length,
        sampleFields: items[0] ? Object.keys(items[0].fieldData || {}) : [],
        sampleItem: items[0]?.fieldData || null,
      };
    }

    return Response.json({ collections: summary });
  } catch (err: unknown) {
    console.error('Webflow collections error:', err);
    return Response.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

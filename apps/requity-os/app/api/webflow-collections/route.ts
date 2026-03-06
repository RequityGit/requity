// @ts-nocheck
import { getAllCMSData } from '@/lib/webflow';

export async function GET() {
  try {
    if (!process.env.WEBFLOW_API_TOKEN || !process.env.WEBFLOW_SITE_ID) {
      return Response.json(
        { error: 'WEBFLOW_API_TOKEN and WEBFLOW_SITE_ID env vars are required' },
        { status: 500 }
      );
    }

    const data = await getAllCMSData();

    // Return a summary for each collection
    const summary = {};
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
  } catch (err) {
    console.error('Webflow collections error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

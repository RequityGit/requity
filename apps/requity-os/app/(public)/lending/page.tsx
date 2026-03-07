import { findCollectionByName, getOptionMap } from '@/lib/webflow';
import { getLoanIndexes } from '@/lib/loan-indexes';
import LendingClient from '@/app/(public)/lending/LendingClient';

export const metadata = {
  title: 'Lending | Requity Group',
  description: 'Bridge loans for commercial and residential real estate. Fast closings, flexible terms, and certainty of execution.',
};

export const revalidate = 300;

const BORROWER_COLLECTION_NAMES = ['borrower-testimonials', 'borrower testimonials'];

interface TestimonialItem {
  id?: string;
  _id?: string;
  isDraft?: boolean;
  isArchived?: boolean;
  fieldData?: Record<string, unknown>;
}

function mapTestimonialItem(item: TestimonialItem, typeOptionMap: Map<string, string>): MappedTestimonial {
  const fd = (item.fieldData || {}) as Record<string, string>;

  const rawType = fd.type || fd['type-2'] || fd.category || fd['testimonial-type'] || '';
  const rawTypeObj = item.fieldData?.[
    'type'] as { name?: string; slug?: string } | string | undefined;
  const rawTypeStr = typeof rawType === 'string' ? rawType :
    (typeof rawTypeObj === 'object' && rawTypeObj !== null ? (rawTypeObj.name || rawTypeObj.slug || '') : '');
  const resolvedType = typeOptionMap.get(rawTypeStr) || rawTypeStr.toLowerCase().trim();

  return {
    id: (item.id || item._id) ?? '',
    name: fd.name || fd.title || fd['borrower-name'] || fd['author-name'] || fd.author || '',
    quote: fd.quote || fd.testimonial || fd['quote-text'] || fd.text || fd.body || fd.content || '',
    role: fd.role || fd.company || fd.title_2 || fd['borrower-role'] || fd['loan-type'] || fd.subtitle || '',
    type: resolvedType,
  };
}

function isBorrowerTestimonial(item: { type: string }) {
  return item.type.includes('borrower') || item.type.includes('lending');
}

interface MappedTestimonial {
  id: string;
  name: string;
  quote: string;
  role: string;
  type: string;
}

async function getTestimonials(): Promise<MappedTestimonial[]> {
  if (!process.env.WEBFLOW_API_TOKEN || !process.env.WEBFLOW_SITE_ID) {
    return [];
  }

  // First, try dedicated borrower testimonials collections
  for (const name of BORROWER_COLLECTION_NAMES) {
    try {
      const result = await findCollectionByName(name);
      if (result && result.items.length > 0) {
        const typeOptionMap = await getOptionMap(result.collection.id, 'type');
        return result.items
          .filter((item) => !item.isDraft && !item.isArchived)
          .map((item) => mapTestimonialItem(item, typeOptionMap))
          .filter((t) => t.quote);
      }
    } catch (err) {
      // Continue to next collection name
    }
  }

  // Fallback: generic "testimonials" collection — resolve option IDs and filter to borrower-only
  try {
    const result = await findCollectionByName('testimonials');
    if (result && result.items.length > 0) {
      const typeOptionMap = await getOptionMap(result.collection.id, 'type');

      const mapped = result.items
        .filter((item) => !item.isDraft && !item.isArchived)
        .map((item) => mapTestimonialItem(item, typeOptionMap));

      return mapped.filter((t) => t.quote && isBorrowerTestimonial(t));
    }
  } catch (err) {
    // ignore
  }

  return [];
}

export default async function LendingPage() {
  const [testimonials, loanIndexes] = await Promise.all([
    getTestimonials(),
    getLoanIndexes(),
  ]);
  return <LendingClient testimonials={testimonials} loanIndexes={loanIndexes} />;
}

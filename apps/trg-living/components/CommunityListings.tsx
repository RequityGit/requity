import ListingGrid from './ListingGrid';
import { getBaseUrl } from '@/lib/utils';

export default async function CommunityListings({ city }: { city: string }) {
    const baseUrl = getBaseUrl();

    try {
        const listingsRes = await fetch(
            `${baseUrl}/api/listings?city=${encodeURIComponent(city)}`,
            {
                next: { revalidate: 3600 },
                signal: AbortSignal.timeout(5000) 
            }
        );
        
        const listings = listingsRes.ok ? await listingsRes.json() : [];
        return <ListingGrid listings={listings} />;
    } catch (err) {
        console.error("Listing Grid Scraper Error:", err);
        return <ListingGrid listings={[]} />;
    }
}
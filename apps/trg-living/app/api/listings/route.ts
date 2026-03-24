import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');

    // input validation
    if (!city || city.length > 50) {
      return NextResponse.json({ error: 'Invalid city' }, { status: 400 });
    }

    // whitelist check
    const supabase = createClient();
    const { data: validCity } = await supabase
      .from('pm_communities')
      .select('city')
      .eq('city', city.trim())
      .eq('status', 'published')
      .limit(1)
      .single();

    if (!validCity) {
      return NextResponse.json({ error: 'Listings not available for this location' }, { status: 403 });
    }

    const safeCity = encodeURIComponent(city.trim());
    // array syntax [] because that's how AppFolio handles filters
    const url = `https://trgliving.appfolio.com/listings?filters[cities][]=${safeCity}`;

    const res = await fetch(url, {
      headers: { 
        'User-Agent': 'TRGLiving-Bot/1.0 (Compliance; Internal Sync)',
        'Accept': 'text/html'
      },
      next: { revalidate: 3600 }
    });

    if (!res.ok) throw new Error('AppFolio Scrape Failed');

    const html = await res.text();
    const $ = cheerio.load(html);
    const listings: any[] = [];

    // use the 'js-' classes from appfolio's listing
    $('.js-listing-item').each((_, el) => {
      const $item = $(el);
      // extract the UUID from the title anchor
      const detailLink = $item.find('.js-listing-title a').attr('href') || '';
      const uid = detailLink.split('/listings/detail/')[1];
      if (!uid) return;       
      // use 'data-original'
      const $img = $item.find('.js-listing-image');
      // image fallback
      const image = $img.attr('data-original') || 
                    $img.attr('src') || 
                    'https://edhlkknvlczhbowasjna.supabase.co/storage/v1/object/public/trg-living-media/communities/general/gallery/placeholder-home.webp';    
      listings.push({
        uid,
        title: $item.find('.js-listing-title').text().trim() || 'Available Unit',
        address: $item.find('.js-listing-address').text().trim(),
        rent: $item.find('.js-listing-blurb-rent').text().trim() || 'Contact for Price',
        available: $item.find('.js-listing-available').first().text().trim(),
        image,
        detailUrl: `https://trgliving.appfolio.com${detailLink}`,
        applyUrl: `https://trgliving.appfolio.com/listings/rental_applications/new?listable_uid=${uid}&source=Website`,
      });
    });

    return NextResponse.json(listings);
  } catch (error: any) {
    console.error('Scraper Error:', error.message);
    return NextResponse.json({ error: 'Listing service temporarily unavailable' }, { status: 500 });
  }
}
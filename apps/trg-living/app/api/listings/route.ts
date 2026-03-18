import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');

    if (!city) {
      return NextResponse.json({ error: 'City parameter is required' }, { status: 400 });
    }

    // Sanitize the input to prevent URL injection
    const safeCity = encodeURIComponent(city.trim());
    const url = `https://trgliving.appfolio.com/listings?filters[cities][]=${safeCity}`;

    const res = await fetch(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html'
      },
      next: { revalidate: 3600 } // Cache for 1 hour to prevent AppFolio from blocking our IP
    });

    if (!res.ok) throw new Error('AppFolio fetch failed');

    const html = await res.text();
    const $ = cheerio.load(html);
    const listings: any[] = [];
    const seen = new Set<string>();

    $('h2 a[href*="/listings/detail/"]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const uid = href.split('/listings/detail/')[1];
      if (!uid || seen.has(uid)) return;
      seen.add(uid);

      const title = $(el).text().trim();
      const $h2 = $(el).closest('h2');
      const address = $h2.next('p, div').text().trim().replace(/\s*Map\s*$/i, '');
      
      // Select the specific thumb associated with this UID
      const $thumb = $(`a[href="/listings/detail/${uid}"]:not(h2 a)`).first();
      const rent = $thumb.text().match(/\$[\d,]+/)?.[0] || 'Contact for Price';
      const image = $thumb.find('img').attr('src');

      listings.push({
        uid,
        title,
        address,
        rent,
        image,
        detailUrl: `https://trgliving.appfolio.com${href}`,
        applyUrl: `https://trgliving.appfolio.com/listings/rental_applications/new?listable_uid=${uid}&source=Website`,
      });
    });

    return NextResponse.json(listings);
  } catch (error: any) {
    console.error('Scraper Error:', error.message);
    return NextResponse.json({ error: 'Failed to sync listings' }, { status: 500 });
  }
}
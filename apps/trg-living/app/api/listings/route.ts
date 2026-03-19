import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');

    if (!city) {
      return NextResponse.json({ error: 'City parameter is required' }, { status: 400 });
    }

    // Sanitize the input
    const safeCity = encodeURIComponent(city.trim());
    // array syntax [] because that's how AppFolio handles filters
    const url = `https://trgliving.appfolio.com/listings?filters[cities][]=${safeCity}`;

    const res = await fetch(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html'
      },
      next: { revalidate: 3600 } // Cache for 1 hour to prevent AppFolio from blocking our IP
    });

    const html = await res.text();
    const $ = cheerio.load(html);
    const listings: any[] = [];

    // Use the 'js-' classes from appfolio's listing
    $('.js-listing-item').each((_, el) => {
      const $item = $(el);

      // Extract the UUID from the title anchor
      const detailLink = $item.find('.js-listing-title a').attr('href') || '';
      const uid = detailLink.split('/listings/detail/')[1];
      if (!uid) return;
      // Map fields based on the specific classes
      const title = $item.find('.js-listing-title').text().trim();
      const address = $item.find('.js-listing-address').text().trim();
      
      // Use 'data-original'
      const $img = $item.find('.js-listing-image');
      const image = $img.attr('data-original') || $img.attr('src');
      // PRICE & AVAILABILITY
      const rent = $item.find('.js-listing-blurb-rent').text().trim() || 'Contact for Price';
      const available = $item.find('.js-listing-available').first().text().trim();

      listings.push({
        uid,
        title,
        address,
        rent,
        available,
        image,
        detailUrl: `https://trgliving.appfolio.com${detailLink}`,
        applyUrl: `https://trgliving.appfolio.com/listings/rental_applications/new?listable_uid=${uid}&source=Website`,
      });
    });

    return NextResponse.json(listings);
  } catch (error: any) {
    console.error('Scraper Error:', error.message);
    return NextResponse.json({ error: 'Internal Sync Error' }, { status: 500 });
  }
}
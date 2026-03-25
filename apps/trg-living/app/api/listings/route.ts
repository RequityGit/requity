import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawCity = searchParams.get('city');

    if (!rawCity || rawCity.length > 50) {
      return NextResponse.json({ error: 'Invalid city' }, { status: 400 });
    }

    const city = rawCity.trim();

    // 1. WHITELIST & STATUS CHECK
    const supabase = createClient();
    const { data: validCity } = await supabase
      .from('pm_communities')
      .select('city')
      .eq('city', city)
      .eq('status', 'published')
      .limit(1)
      .single();

    if (!validCity) {
      return NextResponse.json({ error: 'City not served' }, { status: 403 });
    }

    // 2. FETCH FROM APPFOLIO
    const safeCity = encodeURIComponent(city);
    const url = `https://trgliving.appfolio.com/listings?filters[cities][]=${safeCity}`;

    const res = await fetch(url, {
      headers: { 'User-Agent': 'TRGLiving-Architecture-Bot/1.0', 'Accept': 'text/html' },
      next: { revalidate: 3600 }
    });

    const html = await res.text();
    const $ = cheerio.load(html);
    const listings: any[] = [];

    $('.js-listing-item').each((_, el) => {
      const $item = $(el);
      const address = $item.find('.js-listing-address').text().trim();
      
      if (!address.toLowerCase().includes(city.toLowerCase())) {
        return;
      }

      const detailLink = $item.find('.js-listing-title a').attr('href') || '';
      const uid = detailLink.split('/listings/detail/')[1];
      if (!uid) return;       

      const $img = $item.find('.js-listing-image');
      const image = $img.attr('data-original') || $img.attr('src') || 'https://edhlkknvlczhbowasjna.supabase.co/storage/v1/object/public/trg-living-media/communities/general/gallery/placeholder-home.webp';    

      listings.push({
        uid,
        title: $item.find('.js-listing-title').text().trim(),
        address: address,
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
    return NextResponse.json({ error: 'Internal Sync Error' }, { status: 500 });
  }
}
/**
 * scraper.js — PakRealty
 * Uses simple fetch + cheerio. No browser. No Cloudflare issues.
 * Extracts REAL zameen.com listings with REAL images.
 */

import Property from '../models/Property.js';
import MarketData from '../models/MarketData.js';
import * as cheerio from 'cheerio';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const TARGET_PAGES = [
  { url: 'https://www.zameen.com/Homes/Islamabad-3-1.html', city: 'Islamabad', purpose: 'sale', type: 'House' },
  { url: 'https://www.zameen.com/Rentals/Islamabad-3-1.html', city: 'Islamabad', purpose: 'rent', type: 'House' },
  { url: 'https://www.zameen.com/Apartments/Islamabad-3-1.html', city: 'Islamabad', purpose: 'sale', type: 'Apartment' },
  { url: 'https://www.zameen.com/Homes/Lahore-1-1.html', city: 'Lahore', purpose: 'sale', type: 'House' },
  { url: 'https://www.zameen.com/Rentals/Lahore-1-1.html', city: 'Lahore', purpose: 'rent', type: 'House' },
  { url: 'https://www.zameen.com/Apartments/Lahore-1-1.html', city: 'Lahore', purpose: 'sale', type: 'Apartment' },
  { url: 'https://www.zameen.com/Homes/Karachi-2-1.html', city: 'Karachi', purpose: 'sale', type: 'House' },
  { url: 'https://www.zameen.com/Rentals/Karachi-2-1.html', city: 'Karachi', purpose: 'rent', type: 'House' },
  { url: 'https://www.zameen.com/Homes/Rawalpindi-4-1.html', city: 'Rawalpindi', purpose: 'sale', type: 'House' },
];

// ─── Real browser headers ─────────────────────────────────────────────────────
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Referer': 'https://www.google.com/',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'cross-site',
  'Upgrade-Insecure-Requests': '1',
};

async function fetchZameenListings(target) {
  try {
    const res = await fetch(target.url, { headers: HEADERS });
    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);
    const scripts = $('script#__NEXT_DATA__');
    if (!scripts.length) return [];
    const json = JSON.parse(scripts.html());
    return json?.props?.pageProps?.listings || json?.props?.pageProps?.properties || [];
  } catch (e) {
    return [];
  }
}

// ─── Parse PKR price ──────────────────────────────────────────────────────────
function parsePrice(text = '') {
  const clean = String(text).toLowerCase().replace(/,/g, '').trim();
  if (clean.includes('crore')) {
    const n = parseFloat(clean);
    return isNaN(n) ? null : Math.round(n * 10_000_000);
  }
  if (clean.includes('lakh')) {
    const n = parseFloat(clean);
    return isNaN(n) ? null : Math.round(n * 100_000);
  }
  const n = parseInt(clean.replace(/[^0-9]/g, ''));
  return isNaN(n) ? null : n;
}

// ─── Scrape one page ──────────────────────────────────────────────────────────
async function scrapePage(target, log) {
  log(`   ↗ Fetching: ${target.url}`);

  let html;
  try {
    const res = await fetch(target.url, { headers: HEADERS });
    if (!res.ok) {
      log(`   ⚠ HTTP ${res.status} — skipping`);
      return [];
    }
    html = await res.text();
  } catch (err) {
    log(`   ❌ Fetch failed: ${err.message}`);
    return [];
  }

  // Check for Cloudflare block
  if (html.includes('just a moment') || html.includes('cf-browser-verification')) {
    log(`   ⛔ Cloudflare blocked — skipping`);
    return [];
  }

  const $ = cheerio.load(html);
  const results = [];

  // ── STRATEGY 1: Extract from __NEXT_DATA__ JSON ───────────────────────────
  const nextScript = $('#__NEXT_DATA__').html();
  if (nextScript) {
    log(`   ✅ Found __NEXT_DATA__ — parsing JSON...`);
    try {
      const json = JSON.parse(nextScript);

      // Try all known paths where zameen stores listings
      const possiblePaths = [
        json?.props?.pageProps?.dehydratedState?.queries,
        json?.props?.pageProps?.listings,
        json?.props?.pageProps?.properties,
        json?.props?.pageProps?.searchResults,
        json?.props?.pageProps?.data,
      ];

      let listings = null;

      // Search through dehydrated queries (most common)
      const queries = json?.props?.pageProps?.dehydratedState?.queries;
      if (queries && Array.isArray(queries)) {
        for (const q of queries) {
          const data = q?.state?.data;
          if (data?.results && Array.isArray(data.results)) {
            listings = data.results;
            break;
          }
          if (data?.listings && Array.isArray(data.listings)) {
            listings = data.listings;
            break;
          }
          if (Array.isArray(data)) {
            listings = data;
            break;
          }
        }
      }

      // Try other paths
      if (!listings) {
        for (const path of possiblePaths) {
          if (Array.isArray(path) && path.length > 0) {
            listings = path;
            break;
          }
        }
      }

      if (listings && listings.length > 0) {
        log(`   ✅ Found ${listings.length} listings in JSON`);

        for (const item of listings.slice(0, 25)) {
          const price = item.price || item.price_value;
          const parsedPrice = typeof price === 'number' ? price : parsePrice(String(price || ''));
          if (!parsedPrice) continue;

          // Real image from zameen — media.zameen.com CDN
          const imageUrl =
            item.cover_photo_url ||
            item.thumbnail_url ||
            item.thumbnail ||
            item.cover_image ||
            item.photos?.[0]?.url ||
            item.images?.[0]?.url ||
            null;

          const images = [];
          if (imageUrl) images.push({ url: imageUrl, alt: item.title || 'Property', source: 'scraped' });
          if (item.photos) {
            item.photos.slice(1, 5).forEach(p => {
              const u = p?.url || p;
              if (u && typeof u === 'string' && u.startsWith('http')) {
                images.push({ url: u, alt: 'Property Photo', source: 'scraped' });
              }
            });
          }

          const slug = item.url || item.slug || '';
          const sourceUrl = slug.startsWith('http')
            ? slug
            : `https://www.zameen.com${slug}`;
          if (!sourceUrl.includes('zameen.com')) continue;

          const areaVal = parseFloat(item.area) || null;
          const areaUnit = String(item.area_unit || 'marla').toLowerCase().includes('sq') ? 'sqft' : 'marla';
          const locName = item.location?.name || item.location_name || item.area_name || '';

          results.push({
            title: item.title || `${target.type} for ${target.purpose} in ${target.city}`,
            description: `${item.title || target.type} in ${locName || target.city}. Real listing from Zameen.com.`,
            price: parsedPrice,
            priceUnit: 'PKR',
            priceRaw: item.price_text || item.display_price || String(parsedPrice),
            type: target.type,
            category: 'residential',
            purpose: target.purpose,
            bedrooms: parseInt(item.bedroom || item.beds || item.bedrooms) || null,
            bathrooms: parseInt(item.bathroom || item.baths || item.bathrooms) || null,
            area: areaVal ? { value: areaVal, unit: areaUnit } : undefined,
            location: {
              address: locName || target.city,
              area: locName?.split(',')[0]?.trim() || target.city,
              city: target.city,
            },
            images,
            thumbnail: imageUrl || '',
            status: 'available',
            isExternal: true,
            sourceSite: 'zameen',
            sourceUrl,
            lastScrapedAt: new Date(),
            isVerified: false,
            addedBy: 'scraper',
            contactInfo: {
              name: item.agent?.name || item.contact_name || '',
              phone: item.agent?.phone || item.contact_phone || '',
              email: item.agent?.email || item.contact_email || '',
            },
            investorData: {
              pricePerMarla: (areaVal && areaUnit === 'marla' && parsedPrice)
                ? Math.round(parsedPrice / areaVal) : null,
              areaUnit,
            },
          });
        }

        if (results.length > 0) return results;
      }
    } catch (err) {
      log(`   ⚠ JSON parse error: ${err.message} — trying HTML fallback`);
    }
  }

  // ── STRATEGY 2: Parse HTML directly using zameen's real selectors ─────────
  log(`   🔄 Trying HTML selectors...`);

  // These are zameen.com's actual CSS patterns seen in their HTML
  const listings = $('li[id^="list_"]');
  log(`   Found ${listings.length} listing elements`);

  listings.each((i, elem) => {
    if (i >= 25) return;

    // Title — zameen uses aria-label on the main link
    const linkElem = $(elem).find('a[aria-label]').first();
    const title = linkElem.attr('aria-label') ||
      $(elem).find('h2, h3, [class*="title"]').first().text().trim();
    if (!title) return;

    // Price
    const priceText = $(elem).find('[class*="price"]').first().text().trim();
    const price = parsePrice(priceText);
    if (!price) return;

    // Location
    const locationText = $(elem).find('[class*="location"], [aria-label*="location"]')
      .first().text().trim();

    // Beds / Baths / Area — zameen uses specific span structure
    const spans = $(elem).find('span[aria-label]');
    let bedrooms = null, bathrooms = null, areaText = '';
    spans.each((_, s) => {
      const label = $(s).attr('aria-label') || '';
      const val = $(s).text().trim();
      if (label.toLowerCase().includes('bed')) bedrooms = parseInt(val) || null;
      if (label.toLowerCase().includes('bath')) bathrooms = parseInt(val) || null;
      if (label.toLowerCase().includes('area')) areaText = val;
    });

    // Image — zameen uses media.zameen.com CDN
    let imageUrl = null;
    const imgElem = $(elem).find('img').first();
    for (const attr of ['src', 'data-src', 'data-original']) {
      const val = imgElem.attr(attr) || '';
      if (val && (val.includes('media.zameen.com') || val.includes('zameen'))) {
        imageUrl = val;
        break;
      }
      if (val && val.startsWith('http') && !val.includes('data:image')) {
        imageUrl = val;
        break;
      }
    }

    // Source URL
    const href = linkElem.attr('href') || $(elem).find('a[href*="/Property/"]').first().attr('href') || '';
    const sourceUrl = href.startsWith('http') ? href : `https://www.zameen.com${href}`;
    if (!href) return;

    const areaVal = parseFloat(areaText) || null;
    const areaUnit = areaText.toLowerCase().includes('sq') ? 'sqft' : 'marla';
    const images = imageUrl ? [{ url: imageUrl, alt: title, source: 'scraped' }] : [];

    results.push({
      title,
      description: `${title}. Located in ${locationText || target.city}. Real listing from Zameen.com.`,
      price,
      priceUnit: 'PKR',
      priceRaw: priceText,
      type: target.type,
      category: 'residential',
      purpose: target.purpose,
      bedrooms,
      bathrooms,
      area: areaVal ? { value: areaVal, unit: areaUnit } : undefined,
      location: {
        address: locationText || target.city,
        area: locationText?.split(',')[0]?.trim() || target.city,
        city: target.city,
      },
      images,
      thumbnail: imageUrl || '',
      status: 'available',
      isExternal: true,
      sourceSite: 'zameen',
      sourceUrl,
      lastScrapedAt: new Date(),
      isVerified: false,
      addedBy: 'scraper',
      investorData: {
        pricePerMarla: (areaVal && areaUnit === 'marla' && price)
          ? Math.round(price / areaVal) : null,
        areaUnit,
      },
    });
  });

  log(`   ✅ HTML parse got ${results.length} listings`);
  return results;
}

// ─── Market analytics for Investor Hub ───────────────────────────────────────
async function buildMarketAnalytics(log) {
  log('\n📊 Building Investor Hub analytics...');
  const cities = ['Islamabad', 'Lahore', 'Karachi', 'Rawalpindi'];

  for (const city of cities) {
    const saleProps = await Property.find({
      'location.city': city, purpose: 'sale', price: { $gt: 0 }
    }).lean();
    const rentProps = await Property.find({
      'location.city': city, purpose: 'rent', price: { $gt: 0 }
    }).lean();

    if (!saleProps.length) { log(`   ⚠ No data for ${city}`); continue; }

    const avgSalePrice = Math.round(saleProps.reduce((s, p) => s + p.price, 0) / saleProps.length);
    const avgRentPrice = rentProps.length
      ? Math.round(rentProps.reduce((s, p) => s + p.price, 0) / rentProps.length)
      : null;
    const rentalYield = (avgRentPrice && avgSalePrice)
      ? parseFloat(((avgRentPrice * 12) / avgSalePrice * 100).toFixed(2))
      : null;

    const areaMap = {};
    saleProps.forEach(p => {
      const a = p.location?.area || city;
      if (!areaMap[a]) areaMap[a] = [];
      areaMap[a].push(p.price);
    });

    const areaBreakdown = Object.entries(areaMap).map(([area, prices]) => ({
      area,
      avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      listingCount: prices.length,
    }));

    await MarketData.findOneAndUpdate(
      { city },
      {
        $set: {
          city, totalListings: saleProps.length + rentProps.length,
          saleListings: saleProps.length, rentListings: rentProps.length,
          avgSalePrice, avgRentPrice, rentalYield, areaBreakdown,
          lastUpdated: new Date()
        }
      },
      { upsert: true }
    );

    log(`   ✅ ${city}: avg PKR ${avgSalePrice.toLocaleString()} | yield: ${rentalYield ?? 'N/A'}%`);
  }
}

// ─── Main job ─────────────────────────────────────────────────────────────────
export async function runScraperJob(log = console.log) {
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('🏠 PakRealty Scraper — Fetching real zameen.com data');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  log('🗑️  Clearing old scraped listings...');
  await Property.deleteMany({ isExternal: true });
  log('✅ Cleared.\n');

  let totalSaved = 0, totalSkipped = 0;
  const errors = [];

  for (const target of TARGET_PAGES) {
    log(`📍 ${target.city} — ${target.type} (${target.purpose.toUpperCase()})`);

    const batch = await scrapePage(target, log);

    if (!batch.length) {
      log(`   ⚠ No listings — skipping save.\n`);
      totalSkipped++;
      continue;
    }

    let savedCount = 0;
    for (const prop of batch) {
      try {
        await Property.findOneAndUpdate(
          { sourceUrl: prop.sourceUrl },
          { $set: prop },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        savedCount++;
      } catch (err) {
        totalSkipped++;
        errors.push(err.message);
      }
    }

    totalSaved += savedCount;
    log(`   💾 Saved ${savedCount} to MongoDB\n`);

    // 2 second delay between requests
    await new Promise(r => setTimeout(r, 2000));
  }

  await buildMarketAnalytics(log);

  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log(`✅ Done! Saved: ${totalSaved} | Skipped: ${totalSkipped}`);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return { saved: totalSaved, skipped: totalSkipped, errors };
}

// ─── CLI ──────────────────────────────────────────────────────────────────────
const IS_CLI = process.argv[1]?.endsWith('scraper.js');
if (IS_CLI) {
  const uri = process.env.MONGO_URI;
  if (!uri) { console.error('❌ MONGO_URI missing in .env'); process.exit(1); }
  mongoose.connect(uri)
    .then(() => { console.log('✅ Connected to Atlas'); return runScraperJob(); })
    .then(() => mongoose.connection.close())
    .catch(err => { console.error('❌', err.message); process.exit(1); });
}
// backend/scripts/importCSV.js
import mongoose from 'mongoose';
import fs from 'fs';
import csv from 'csv-parser';
import dotenv from 'dotenv';
import Property from '../models/Property.js';
import MarketData from '../models/MarketData.js';

dotenv.config();

function parsePrice(val = '') {
    const clean = String(val).toLowerCase()
        .replace(/pkr/gi, '').replace(/,/g, '').trim();
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

function parseArea(val = '') {
    const clean = String(val).toLowerCase().trim();
    const num = parseFloat(clean.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return null;
    if (clean.includes('kanal')) return { value: num * 20, unit: 'marla' };
    if (clean.includes('sq')) return { value: num, unit: 'sqft' };
    return { value: num, unit: 'marla' };
}

function normalizeCity(city = '') {
    const map = {
        'islamabad': 'Islamabad',
        'lahore': 'Lahore',
        'karachi': 'Karachi',
        'rawalpindi': 'Rawalpindi',
        'faisalabad': 'Faisalabad',
        'multan': 'Multan',
        'peshawar': 'Peshawar',
        'quetta': 'Quetta',
    };
    return map[city.toLowerCase().trim()] || city.trim();
}

function normalizeType(type = '') {
    const lower = type.toLowerCase();
    if (lower.includes('house') || lower.includes('home') || lower.includes('villa')) return 'House';
    if (lower.includes('flat') || lower.includes('apartment')) return 'Apartment';
    if (lower.includes('plot') || lower.includes('land')) return 'Plot';
    if (lower.includes('commercial') || lower.includes('shop') || lower.includes('office')) return 'Commercial';
    return 'House';
}

function normalizePurpose(purpose = '') {
    return purpose.toLowerCase().includes('rent') ? 'rent' : 'sale';
}

// City image pools using real zameen CDN format
const CITY_IMAGES = {
    Islamabad: 'https://media.zameen.com/thumbnails/298160997-400x300.jpeg',
    Lahore: 'https://media.zameen.com/thumbnails/295432109-400x300.jpeg',
    Karachi: 'https://media.zameen.com/thumbnails/292109876-400x300.jpeg',
    Rawalpindi: 'https://media.zameen.com/thumbnails/289876543-400x300.jpeg',
    Faisalabad: 'https://media.zameen.com/thumbnails/288765432-400x300.jpeg',
    Multan: 'https://media.zameen.com/thumbnails/287654321-400x300.jpeg',
    Peshawar: 'https://media.zameen.com/thumbnails/286543210-400x300.jpeg',
    Quetta: 'https://media.zameen.com/thumbnails/285432109-400x300.jpeg',
};

async function importCSV() {
    console.log('🔗 Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected\n');

    console.log('🗑️  Clearing existing scraped properties...');
    await Property.deleteMany({ isExternal: true });
    console.log('✅ Cleared\n');

    const csvPath = './data/zameen.csv';
    if (!fs.existsSync(csvPath)) {
        console.error('❌ CSV not found at', csvPath);
        process.exit(1);
    }

    const rows = [];
    await new Promise((resolve, reject) => {
        fs.createReadStream(csvPath)
            .pipe(csv())
            .on('data', row => rows.push(row))
            .on('end', resolve)
            .on('error', reject);
    });

    console.log(`📊 Read ${rows.length} rows from CSV`);
    console.log(`📋 Columns found: ${Object.keys(rows[0]).join(', ')}\n`);

    let saved = 0, skipped = 0;
    const BATCH = 500;

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        // ── EXACT column names from YOUR CSV ─────────────────────────
        // index, url, type, purpose, area, bedroom, bath, added, price, location, location_city

        const city = normalizeCity(row.location_city || '');
        const type = normalizeType(row.type || '');
        let purpose = normalizePurpose(row.purpose || '');
        // If CSV marks as sale but URL indicates rent, adjust
        if (purpose === 'sale') {
          const urlLower = (row.url || '').toLowerCase();
          if (urlLower.includes('rent') || urlLower.includes('rented') || urlLower.includes('lease')) {
            purpose = 'rent';
          }
        }
        const price = parsePrice(row.price || '');
        const location = (row.location || '').trim();
        const beds = parseInt(row.bedroom) || null;
        const baths = parseInt(row.bath) || null;
        const area = parseArea(row.area || '');
        const sourceUrl = (row.url || '').trim();

        // Skip if missing critical fields
        if (!price || price < 1000) { skipped++; continue; }
        if (!city) { skipped++; continue; }
        if (!sourceUrl) { skipped++; continue; }

        const areaStr = (row.area || '').trim();
        const title = `${areaStr} ${type} for ${purpose === 'rent' ? 'Rent' : 'Sale'} in ${location || city}`;
        const imageUrl = CITY_IMAGES[city] || CITY_IMAGES['Islamabad'];
        const images = [{ url: imageUrl, alt: title, source: 'scraped' }];

        try {
            await Property.findOneAndUpdate(
                { sourceUrl },
                {
                    $set: {
                        title,
                        description: `${areaStr} ${type} available for ${purpose === 'rent' ? 'rent' : 'sale'} in ${location}, ${city}. Listed on Zameen.com.`,
                        price,
                        priceUnit: 'PKR',
                        priceRaw: (row.price || '').trim(),
                        type,
                        category: type === 'Commercial' ? 'commercial' : 'residential',
                        purpose,
                        bedrooms: beds,
                        bathrooms: baths,
                        area: area || undefined,
                        location: {
                            address: `${location}, ${city}`,
                            area: location || city,
                            city,
                        },
                        images,
                        thumbnail: imageUrl,
                        status: 'available',
                        isExternal: true,
                        sourceSite: 'zameen',
                        sourceUrl,
                        lastScrapedAt: new Date(),
                        isVerified: true,
                        addedBy: 'scraper',
                        investorData: {
                            pricePerMarla: (area?.value && area?.unit === 'marla' && price)
                                ? Math.round(price / area.value) : null,
                            areaUnit: area?.unit || 'marla',
                        },
                    },
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            saved++;
            if (saved % BATCH === 0) {
                console.log(`   💾 Saved ${saved} / ${rows.length} properties...`);
            }
        } catch (err) {
            skipped++;
        }
    }

    console.log(`\n✅ Import complete!`);
    console.log(`   Saved:   ${saved.toLocaleString()} properties`);
    console.log(`   Skipped: ${skipped.toLocaleString()}`);

    await buildMarketAnalytics();

    await mongoose.connection.close();
    console.log('🔌 Done!');
}

async function buildMarketAnalytics() {
    console.log('\n📊 Building Investor Hub analytics...');
    const cities = ['Islamabad', 'Lahore', 'Karachi', 'Rawalpindi', 'Faisalabad', 'Multan'];

    for (const city of cities) {
        const sale = await Property.find({
            'location.city': city, purpose: 'sale', price: { $gt: 0 }
        }).lean();
        const rent = await Property.find({
            'location.city': city, purpose: 'rent', price: { $gt: 0 }
        }).lean();

        if (!sale.length) { console.log(`   ⚠ No data for ${city}`); continue; }

        const avgSale = Math.round(sale.reduce((s, p) => s + p.price, 0) / sale.length);
        const avgRent = rent.length
            ? Math.round(rent.reduce((s, p) => s + p.price, 0) / rent.length)
            : null;
        const yieldPct = (avgRent && avgSale)
            ? parseFloat(((avgRent * 12) / avgSale * 100).toFixed(2))
            : null;

        const areaMap = {};
        sale.forEach(p => {
            const a = p.location?.area || city;
            if (!areaMap[a]) areaMap[a] = [];
            areaMap[a].push(p.price);
        });

        const areaBreakdown = Object.entries(areaMap)
            .map(([area, prices]) => ({
                area,
                avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
                listingCount: prices.length,
            }))
            .sort((a, b) => b.listingCount - a.listingCount)
            .slice(0, 20);

        await MarketData.findOneAndUpdate(
            { city },
            {
                $set: {
                    city,
                    totalListings: sale.length + rent.length,
                    saleListings: sale.length,
                    rentListings: rent.length,
                    avgSalePrice: avgSale,
                    avgRentPrice: avgRent,
                    rentalYield: yieldPct,
                    areaBreakdown,
                    lastUpdated: new Date(),
                },
            },
            { upsert: true }
        );

        console.log(`   ✅ ${city}: ${sale.length.toLocaleString()} sale | ${rent.length.toLocaleString()} rent | avg PKR ${avgSale.toLocaleString()} | yield: ${yieldPct ?? 'N/A'}%`);
    }
}

importCSV().catch(err => {
    console.error('❌ Fatal:', err.message);
    process.exit(1);
});
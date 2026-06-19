import express from 'express';
import { body, validationResult, query } from 'express-validator';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Property from '../models/Property.js';
import csv from 'csv-parser';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ─── File upload setup ────────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename:    (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// ─── Auth middleware ───────────────────────────────────────────────────────────
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'pak_property_secret_2024');
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// ─── GET /api/properties — Public listing with filters ────────────────────────
router.get('/', [
  query('city').optional().trim(),
  query('type').optional().trim(),
  query('purpose').optional().isIn(['sale', 'rent']),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('bedrooms').optional().isInt({ min: 0 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { city, type, purpose, minPrice, maxPrice, bedrooms, search, page = 1, limit = 9 } = req.query;

    // ── Build filter: show all available properties (no isVerified gate for browsing) ──
    const filter = { status: 'available' };

    if (city)     filter['location.city']   = new RegExp(city, 'i');
    if (type)     filter.type               = type;
    if (purpose)  filter.purpose            = purpose;
    if (bedrooms) filter.bedrooms           = { $gte: parseInt(bedrooms) };

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    if (search) {
      filter.$or = [
        { title:           { $regex: search, $options: 'i' } },
        { description:     { $regex: search, $options: 'i' } },
        { 'location.area': { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } },
      ];
    }

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Property.countDocuments(filter);

    const properties = await Property.find(filter)
      .populate('agentId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Prefix image URLs with backend base URL if needed
    const base = process.env.BACKEND_URL || 'https://pakrealty-production.up.railway.app';
    properties.forEach(p => {
      if (p.thumbnail && !p.thumbnail.startsWith('http')) {
        p.thumbnail = `${base}${p.thumbnail}`;
      }
      if (Array.isArray(p.images)) {
        p.images = p.images.map(img => ({
          ...img,
          url: img.url && !img.url.startsWith('http') ? `${base}${img.url}` : img.url,
        }));
      }
    });

    res.json({
      properties,
      pagination: {
        total,
        page:  parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)) || 1,
      },
    });
  } catch (err) {
    console.error('GET /properties error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/properties/data — Investment Analyzer Data ──────────────────────
router.get('/data', async (req, res) => {
  try {
    const csvFilePath = path.join(__dirname, '..', 'data', 'all_listings_clean.csv');
    const results = [];
    const dbProperties = await Property.find({ status: 'available', purpose: 'sale' }).lean();

    // Premium Location Tiers & Momentum
    const premiumLocations = ['dha', 'top city', 'bahria', 'clifton', 'e-7', 'f-7', 'f-8'];
    const standardLocations = ['soan garden', 'lake city', 'paragon city', 'gulberg', 'johar', 'askari'];

    const getTierScore = (location) => {
      const loc = (location || '').toLowerCase();
      if (premiumLocations.some(p => loc.includes(p))) return 10;
      if (standardLocations.some(s => loc.includes(s))) return 7;
      return 4;
    };

    // Simulate market momentum (0-10) based on location string hash to keep it deterministic
    const getMomentumScore = (location) => {
      let hash = 0;
      for (let i = 0; i < location.length; i++) {
        hash = location.charCodeAt(i) + ((hash << 5) - hash);
      }
      return (Math.abs(hash) % 6) + 5; // 5 to 10
    };

    // Deduplication set
    const seenProperties = new Set();

    const processProperty = (p) => {
      const price = parseFloat(p.price_pkr || p.price);
      const marla = parseFloat(p.size_marla || p.marla || p.area?.value);
      
      // Filter out insane outliers that skew averages
      if (!price || !marla || price < 500000 || marla < 0.5 || marla > 500) return null;

      const pricePerMarla = price / marla;
      if (pricePerMarla < 100000 || pricePerMarla > 100000000) return null; // Extreme anomalies
      
      const beds = parseInt(p.beds || p.bedrooms || 0);
      const baths = parseInt(p.baths || p.bathrooms || 0);
      const utilityRatio = ((beds + baths) / marla);
      
      const location = p.neighbourhood || p.area || (p.location ? p.location.area : '') || 'Unknown';
      const city = (p.city || (p.location ? p.location.city : '') || 'Unknown').toLowerCase();
      const title = p.title || p.description || 'Property Listing';

      // Deduplication Key
      const dedupKey = `${city}-${location}-${price}-${marla}`.toLowerCase().replace(/\s+/g, '');
      if (seenProperties.has(dedupKey)) return null;
      seenProperties.add(dedupKey);

      const momentumScore = getMomentumScore(location);

      return {
        id: p._id || Math.random().toString(36).substr(2, 9),
        title: title,
        price: price,
        size_marla: marla,
        price_per_marla: pricePerMarla,
        location: location,
        city: city,
        beds: beds,
        baths: baths,
        utilityRatio: utilityRatio,
        tierScore: getTierScore(location),
        momentumScore: momentumScore,
        source: p._id ? 'database' : 'csv'
      };
    };

    if (fs.existsSync(csvFilePath)) {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (data) => {
          if (data.price_pkr && data.size_marla) {
            const processed = processProperty(data);
            if (processed) results.push(processed);
          }
        })
        .on('end', () => {
          finishProcessing();
        });
    } else {
      finishProcessing();
    }

    function finishProcessing() {
      // Add DB properties
      dbProperties.forEach(dbProp => {
        if (dbProp.price && dbProp.area && dbProp.area.value) {
          let marla = dbProp.area.value;
          if (dbProp.area.unit === 'sqft') marla = marla / 225;
          if (dbProp.area.unit === 'kanal') marla = marla * 20;
          
          const processed = processProperty({
            ...dbProp,
            price_pkr: dbProp.price,
            size_marla: marla,
            neighbourhood: dbProp.location?.area,
            city: dbProp.location?.city
          });
          if (processed) results.push(processed);
        }
      });

      // Calculate averages by city and location
      const cityAverages = {};
      const locAverages = {};
      
      results.forEach(r => {
        if (!cityAverages[r.city]) cityAverages[r.city] = { total: 0, count: 0 };
        cityAverages[r.city].total += r.price_per_marla;
        cityAverages[r.city].count += 1;

        if (!locAverages[r.location]) locAverages[r.location] = { total: 0, count: 0 };
        locAverages[r.location].total += r.price_per_marla;
        locAverages[r.location].count += 1;
      });

      const processedResults = results.map(r => {
        const cityAvg = cityAverages[r.city] ? (cityAverages[r.city].total / cityAverages[r.city].count) : r.price_per_marla;
        const locAvg = locAverages[r.location] ? (locAverages[r.location].total / locAverages[r.location].count) : r.price_per_marla;
        
        // Price Efficiency (35%): How undervalued vs peers. Base 5. Max 10 if -30% below avg.
        const diffFromAvg = locAvg > 0 ? (r.price_per_marla - locAvg) / locAvg : 0;
        let priceEfficiency = 5 - (diffFromAvg * 16.6); // 30% below = 5 - (-0.3 * 16.6) = 5 + 5 = 10
        priceEfficiency = Math.max(0, Math.min(10, priceEfficiency));

        // Utility Score (20%): standard is ~0.8 beds+baths per marla
        let utilityScore = (r.utilityRatio / 0.8) * 5;
        utilityScore = Math.max(0, Math.min(10, utilityScore));

        // Final Score: 35% Efficiency, 25% Location, 20% Utility, 20% Momentum
        const finalScore = (priceEfficiency * 0.35) + (r.tierScore * 0.25) + (utilityScore * 0.20) + (r.momentumScore * 0.20);

        // Intelligence Engine Tags
        let tags = [];
        if (finalScore >= 7.5 && diffFromAvg <= -0.2) tags.push("Best Value Deal");
        if (r.momentumScore >= 8 && r.tierScore < 10) tags.push("Growth Potential");
        if (r.tierScore === 10 && finalScore >= 6) tags.push("Safe Investment");
        if (diffFromAvg <= -0.15 && r.tierScore >= 8) tags.push("Quick Flip");

        return {
          ...r,
          cityAverage: cityAvg,
          locAverage: locAvg,
          priceEfficiency: parseFloat(priceEfficiency.toFixed(1)),
          utilityScore: parseFloat(utilityScore.toFixed(1)),
          investmentScore: parseFloat(finalScore.toFixed(1)),
          discountVsLoc: parseFloat((diffFromAvg * 100).toFixed(1)),
          tags: tags.length ? tags : ["Standard Asset"]
        };
      });

      // Sort by best investment score
      processedResults.sort((a, b) => b.investmentScore - a.investmentScore);

      res.json({
        success: true,
        total: processedResults.length,
        properties: processedResults.slice(0, 500) // limit payload size
      });
    }
  } catch (err) {
    console.error('GET /properties/data error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/properties/featured ─────────────────────────────────────────────
router.get('/featured', async (req, res) => {
  try {
    const featured = await Property.find({ status: 'available', isVerified: true })
      .populate('agentId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    // Prefix image URLs for featured properties
    const base = process.env.BACKEND_URL || 'https://pakrealty-production.up.railway.app';
    featured.forEach(p => {
      if (p.thumbnail && !p.thumbnail.startsWith('http')) {
        p.thumbnail = `${base}${p.thumbnail}`;
      }
      if (Array.isArray(p.images)) {
        p.images = p.images.map(img => ({
          ...img,
          url: img.url && !img.url.startsWith('http') ? `${base}${img.url}` : img.url,
        }));
      }
    });

    res.json({ properties: featured });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/properties/agent/:agentId ───────────────────────────────────────
router.get('/agent/:agentId', async (req, res) => {
  try {
    const properties = await Property.find({ agentId: req.params.agentId })
      .sort({ createdAt: -1 })
      .lean();

    // Prefix image URLs with backend base URL if needed
    const base = process.env.BACKEND_URL || 'https://pakrealty-production.up.railway.app';
    properties.forEach(p => {
      if (p.thumbnail && !p.thumbnail.startsWith('http')) {
        p.thumbnail = `${base}${p.thumbnail}`;
      }
      if (Array.isArray(p.images)) {
        p.images = p.images.map(img => ({
          ...img,
          url: img.url && !img.url.startsWith('http') ? `${base}${img.url}` : img.url,
        }));
      }
    });

    res.json({ properties });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/properties/:id ──────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('agentId', 'name email phone');

    if (!property) return res.status(404).json({ error: 'Property not found' });

    // Prefix image URLs with backend base URL if needed
    const base = process.env.BACKEND_URL || 'https://pakrealty-production.up.railway.app';
    const propObj = property.toObject();
    if (propObj.thumbnail && !propObj.thumbnail.startsWith('http')) {
      propObj.thumbnail = `${base}${propObj.thumbnail}`;
    }
    if (Array.isArray(propObj.images)) {
      propObj.images = propObj.images.map(img => ({
        ...img,
        url: img.url && !img.url.startsWith('http') ? `${base}${img.url}` : img.url,
      }));
    }

    res.json(propObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/properties ─────────────────────────────────────────────────────
router.post('/', verifyToken, upload.array('uploadedImages', 10), [
  body('title').notEmpty().trim().withMessage('Title is required'),
  body('description').isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price required'),
  body('type').isIn(['House', 'Apartment', 'Plot', 'Commercial', 'Shop', 'Office', 'Industrial', 'Farm', 'Other']).withMessage('Invalid property type'),
  body('purpose').isIn(['sale', 'rent']).withMessage('Purpose must be sale or rent'),
  body('city').notEmpty().withMessage('City is required'),
  body('areaValue').optional().isFloat({ min: 0 }).withMessage('Area value must be a positive number'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const body = req.body;
    const images = [];
    const base = process.env.BACKEND_URL || 'https://pakrealty-production.up.railway.app';

    // Source 1: Uploaded files from agent's computer
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        images.push({
          url: `/uploads/${file.filename}`, // Will be served statically
          alt: body.title || 'Property Image',
          source: 'upload',
        });
      });
    }

    // Source 2: Pasted image URLs from agent
    if (body.imageUrls) {
      try {
        const urls = JSON.parse(body.imageUrls);
        urls.forEach(url => {
          if (url && url.startsWith('http')) {
            images.push({
              url,
              alt: body.title || 'Property Image',
              source: 'url',
            });
          }
        });
      } catch (e) {
        console.error("Failed to parse imageUrls:", e);
      }
    }

    const { city, area, address, price, bedrooms, bathrooms, kitchens, parking, areaValue, areaUnit, sourceUrl, contactName, contactPhone, contactEmail, ...rest } = req.body;

    const property = await Property.create({
      title: body.title,
      description: body.description || '',
      price: parseFloat(price),
      priceUnit: 'PKR',
      type: body.type,
      purpose: body.purpose,
      bedrooms: bedrooms ? parseInt(bedrooms) : null,
      bathrooms: bathrooms ? parseInt(bathrooms) : null,
      kitchens: kitchens ? parseInt(kitchens) : null,
      parking: parking ? parseInt(parking) : null,
      area: {
        value: areaValue && !isNaN(parseFloat(areaValue)) ? parseFloat(areaValue) : null,
        unit: areaUnit || 'sqft',
      },
      location: {
        address: address || '',
        area: area || '',
        city: city,
      },
      images,
      thumbnail: images[0]?.url || '',
      status: 'available',
      agentId: req.userId,
      addedBy: 'agent',
      isExternal: false,
      ...(sourceUrl ? { sourceUrl } : {}),
      contactInfo: {
        name: contactName || '',
        phone: contactPhone || '',
        email: contactEmail || '',
      },
      isVerified: false,
    });

    await property.populate('agentId', 'name email phone');

    // Prefix image URLs with backend base URL before sending response
    const propObj = property.toObject();
    if (propObj.thumbnail && !propObj.thumbnail.startsWith('http')) {
      propObj.thumbnail = `${base}${propObj.thumbnail}`;
    }
    if (Array.isArray(propObj.images)) {
      propObj.images = propObj.images.map(img => ({
        ...img,
        url: img.url && !img.url.startsWith('http') ? `${base}${img.url}` : img.url,
      }));
    }

    res.status(201).json({ success: true, data: propObj });
  } catch (err) {
    console.error('POST /properties error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/properties/:id ──────────────────────────────────────────────────
router.put('/:id', verifyToken, upload.array('images', 8), async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ error: 'Property not found' });

    if (property.agentId?.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to edit this property' });
    }

    const newImages = (req.files || []).map(f => ({
      url: `/uploads/${f.filename}`,
      alt: req.body.title || property.title,
    }));

    const updates = { ...req.body };
    if (newImages.length > 0) {
      updates.images    = [...(property.images || []), ...newImages];
      updates.thumbnail = updates.images[0]?.url || property.thumbnail;
    }

    Object.assign(property, updates);
    await property.save();
    await property.populate('agentId', 'name email phone');

    res.json({ message: 'Property updated successfully', property });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/properties/:id ───────────────────────────────────────────────
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ error: 'Property not found' });

    if (property.agentId?.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this property' });
    }

    await Property.findByIdAndDelete(req.params.id);
    res.json({ message: 'Property deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

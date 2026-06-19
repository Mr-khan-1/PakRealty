import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Property from '../models/Property.js';

const router = express.Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────
const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET || 'pak_property_secret_2024', {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });

const validateEmail    = body('email').isEmail().normalizeEmail();
const validatePassword = body('password')
  .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
  .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
  .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
  .matches(/[0-9]/).withMessage('Password must contain a number');

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', [
  body('name').notEmpty().trim().withMessage('Name is required'),
  validateEmail,
  body('phone').optional(),
  validatePassword,
  body('role').isIn(['user', 'agent', 'investor']).withMessage('Invalid role'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, password, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const user = new User({ name, email, phone: phone || '', passwordHash: password, role });
    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', [
  validateEmail,
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated. Contact support.' });
    }

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'pak_property_secret_2024');
    const user    = await User.findById(decoded.userId);
    if (!user)   return res.status(404).json({ error: 'User not found' });

    res.json({ user: user.toJSON() });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

// ─── POST /api/auth/refresh-token ────────────────────────────────────────────
router.post('/refresh-token', (req, res) => {
  try {
    const token   = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded  = jwt.verify(token, process.env.JWT_SECRET || 'pak_property_secret_2024');
    const newToken = generateToken(decoded.userId);

    res.json({ token: newToken });
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// ─── POST /api/auth/seed-demo ─────────────────────────────────────────────────
// Seeds 4 demo accounts + 12 sample properties. Safe to run multiple times.
router.post('/seed-demo', async (req, res) => {
  try {
    const demoUsers = [
      { name: 'Admin User',       email: 'admin@demo.pk',    passwordHash: 'Admin@1234',   role: 'admin'    },
      { name: 'Ahmed Khan Agent', email: 'agent@demo.pk',    passwordHash: 'Agent@1234',   role: 'agent'    },
      { name: 'Zara Investor',    email: 'investor@demo.pk', passwordHash: 'Invest@1234',  role: 'investor' },
      { name: 'Ali Hassan',       email: 'user@demo.pk',     passwordHash: 'User@12345',   role: 'user'     },
    ];

    const savedUsers = [];
    for (const u of demoUsers) {
      let user = await User.findOne({ email: u.email });
      if (!user) {
        user = new User(u);
        await user.save();
      }
      savedUsers.push(user);
    }

    const agentUser = savedUsers.find(u => u.role === 'agent');

    // Check if sample properties already exist
    const existingCount = await Property.countDocuments({ isExternal: false, agentId: agentUser._id });
    if (existingCount >= 12) {
      return res.json({ message: 'Demo data already seeded', usersCreated: 0, propertiesCreated: 0 });
    }

    const sampleProperties = [
      {
        title: '5 Marla Modern House in DHA Phase 2',
        description: 'Beautiful newly constructed house with modern kitchen, marble flooring, and a gorgeous garden. Located in the heart of DHA Phase 2 with easy access to main boulevard.',
        price: 18500000, priceUnit: 'PKR',
        type: 'House', category: 'residential', purpose: 'sale',
        bedrooms: 3, bathrooms: 3, kitchens: 1, parking: 2,
        area: { value: 5, unit: 'marla' },
        location: { address: 'Street 12, DHA Phase 2', area: 'DHA Phase 2', city: 'Islamabad' },
        images: [{ url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', alt: 'House' }],
        thumbnail: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
        status: 'available', agentId: agentUser._id, isVerified: true, isExternal: false,
        contactInfo: { name: 'Ahmed Khan', phone: '0300-1234567', email: 'agent@demo.pk' },
      },
      {
        title: '10 Marla Luxury Villa — Bahria Town',
        description: 'Stunning corner plot villa with 4 bedrooms, cinema room, home gym, rooftop terrace, and smart home automation. Bahria Town Phase 7 premium block.',
        price: 45000000, priceUnit: 'PKR',
        type: 'House', category: 'residential', purpose: 'sale',
        bedrooms: 4, bathrooms: 5, kitchens: 2, parking: 3,
        area: { value: 10, unit: 'marla' },
        location: { address: 'Block A, Bahria Town Phase 7', area: 'Bahria Town', city: 'Islamabad' },
        images: [{ url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800', alt: 'Villa' }],
        thumbnail: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
        status: 'available', agentId: agentUser._id, isVerified: true, isExternal: false,
        contactInfo: { name: 'Ahmed Khan', phone: '0300-1234567', email: 'agent@demo.pk' },
      },
      {
        title: 'Furnished 2-Bed Apartment — F-10 Markaz',
        description: 'Fully furnished luxury apartment on 7th floor with panoramic city views. 24/7 security, backup generator, covered parking. Ready to move in.',
        price: 95000, priceUnit: 'PKR',
        type: 'Apartment', category: 'residential', purpose: 'rent',
        bedrooms: 2, bathrooms: 2, kitchens: 1, parking: 1,
        area: { value: 1200, unit: 'sqft' },
        location: { address: 'F-10 Markaz, Tower B', area: 'F-10', city: 'Islamabad' },
        images: [{ url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', alt: 'Apartment' }],
        thumbnail: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
        status: 'available', agentId: agentUser._id, isVerified: true, isExternal: false,
        contactInfo: { name: 'Ahmed Khan', phone: '0300-1234567', email: 'agent@demo.pk' },
      },
      {
        title: '1 Kanal Residential Plot — DHA Phase 6, Lahore',
        description: 'Prime location 1 Kanal plot in DHA Lahore Phase 6, Block M. All utilities available, level land, corner plot with extra 10% area.',
        price: 75000000, priceUnit: 'PKR',
        type: 'Plot', category: 'residential', purpose: 'sale',
        bedrooms: null, bathrooms: null, kitchens: null, parking: null,
        area: { value: 1, unit: 'kanal' },
        location: { address: 'Block M, DHA Phase 6', area: 'DHA Phase 6', city: 'Lahore' },
        images: [{ url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800', alt: 'Plot' }],
        thumbnail: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800',
        status: 'available', agentId: agentUser._id, isVerified: true, isExternal: false,
        contactInfo: { name: 'Ahmed Khan', phone: '0300-1234567', email: 'agent@demo.pk' },
      },
      {
        title: '3-Bed Luxury Apartment — Clifton Block 4, Karachi',
        description: 'Sea-facing luxury apartment in prestigious Clifton area. Marble floors, imported kitchen, built-in wardrobes. Includes 2 parking spots.',
        price: 32000000, priceUnit: 'PKR',
        type: 'Apartment', category: 'residential', purpose: 'sale',
        bedrooms: 3, bathrooms: 3, kitchens: 1, parking: 2,
        area: { value: 2200, unit: 'sqft' },
        location: { address: 'Block 4, Clifton', area: 'Clifton', city: 'Karachi' },
        images: [{ url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', alt: 'Apartment' }],
        thumbnail: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
        status: 'available', agentId: agentUser._id, isVerified: true, isExternal: false,
        contactInfo: { name: 'Ahmed Khan', phone: '0300-1234567', email: 'agent@demo.pk' },
      },
      {
        title: '7 Marla House for Rent — G-11, Islamabad',
        description: 'Well-maintained family home with large lawn, servant quarter, and double garage. Located on a quiet street in G-11/1, near main market.',
        price: 65000, priceUnit: 'PKR',
        type: 'House', category: 'residential', purpose: 'rent',
        bedrooms: 4, bathrooms: 3, kitchens: 1, parking: 2,
        area: { value: 7, unit: 'marla' },
        location: { address: 'Street 5, G-11/1', area: 'G-11', city: 'Islamabad' },
        images: [{ url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800', alt: 'House' }],
        thumbnail: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
        status: 'available', agentId: agentUser._id, isVerified: true, isExternal: false,
        contactInfo: { name: 'Ahmed Khan', phone: '0300-1234567', email: 'agent@demo.pk' },
      },
      {
        title: 'Commercial Shop — Blue Area, Islamabad',
        description: 'Ground floor commercial shop on main Jinnah Avenue, Blue Area. High foot traffic, excellent visibility, ideal for retail or bank.',
        price: 28000000, priceUnit: 'PKR',
        type: 'Shop', category: 'commercial', purpose: 'sale',
        bedrooms: null, bathrooms: 1, kitchens: null, parking: 1,
        area: { value: 350, unit: 'sqft' },
        location: { address: 'Jinnah Avenue, Blue Area', area: 'Blue Area', city: 'Islamabad' },
        images: [{ url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800', alt: 'Shop' }],
        thumbnail: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
        status: 'available', agentId: agentUser._id, isVerified: true, isExternal: false,
        contactInfo: { name: 'Ahmed Khan', phone: '0300-1234567', email: 'agent@demo.pk' },
      },
      {
        title: '4 Marla Studio Apartment — E-11, Islamabad',
        description: 'Modern studio apartment perfect for young professionals. Fully equipped kitchen, fast internet ready, gym access included. Gated community.',
        price: 42000, priceUnit: 'PKR',
        type: 'Apartment', category: 'residential', purpose: 'rent',
        bedrooms: 1, bathrooms: 1, kitchens: 1, parking: 1,
        area: { value: 600, unit: 'sqft' },
        location: { address: 'E-11/4, Main Boulevard', area: 'E-11', city: 'Islamabad' },
        images: [{ url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', alt: 'Studio' }],
        thumbnail: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
        status: 'available', agentId: agentUser._id, isVerified: true, isExternal: false,
        contactInfo: { name: 'Ahmed Khan', phone: '0300-1234567', email: 'agent@demo.pk' },
      },
      {
        title: '2 Kanal Farmhouse — Bedian Road, Lahore',
        description: 'Peaceful farmhouse with orchards, swimming pool, and guest bungalow. Ideal for weekend retreats or agricultural investment. Tube well included.',
        price: 55000000, priceUnit: 'PKR',
        type: 'Farm', category: 'residential', purpose: 'sale',
        bedrooms: 5, bathrooms: 4, kitchens: 2, parking: 5,
        area: { value: 2, unit: 'kanal' },
        location: { address: 'Bedian Road, Near Raiwind', area: 'Bedian Road', city: 'Lahore' },
        images: [{ url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800', alt: 'Farmhouse' }],
        thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
        status: 'available', agentId: agentUser._id, isVerified: true, isExternal: false,
        contactInfo: { name: 'Ahmed Khan', phone: '0300-1234567', email: 'agent@demo.pk' },
      },
      {
        title: 'Office Space for Rent — Gulshan-e-Iqbal, Karachi',
        description: 'Full floor office space with 15 workstations, conference room, and reception area. High-speed fiber internet, 24/7 power backup.',
        price: 180000, priceUnit: 'PKR',
        type: 'Office', category: 'commercial', purpose: 'rent',
        bedrooms: null, bathrooms: 3, kitchens: 1, parking: 5,
        area: { value: 3000, unit: 'sqft' },
        location: { address: 'Main University Road', area: 'Gulshan-e-Iqbal', city: 'Karachi' },
        images: [{ url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800', alt: 'Office' }],
        thumbnail: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
        status: 'available', agentId: agentUser._id, isVerified: true, isExternal: false,
        contactInfo: { name: 'Ahmed Khan', phone: '0300-1234567', email: 'agent@demo.pk' },
      },
      {
        title: '8 Marla House — Askari 10, Lahore',
        description: 'Beautifully maintained house in the prestigious Askari 10 community. Includes lawn, solar panels, and CCTV cameras. Peaceful and secure neighbourhood.',
        price: 38000000, priceUnit: 'PKR',
        type: 'House', category: 'residential', purpose: 'sale',
        bedrooms: 4, bathrooms: 4, kitchens: 1, parking: 2,
        area: { value: 8, unit: 'marla' },
        location: { address: 'Sector C, Askari 10', area: 'Askari 10', city: 'Lahore' },
        images: [{ url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800', alt: 'House' }],
        thumbnail: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
        status: 'available', agentId: agentUser._id, isVerified: true, isExternal: false,
        contactInfo: { name: 'Ahmed Khan', phone: '0300-1234567', email: 'agent@demo.pk' },
      },
      {
        title: 'Penthouse Apartment — Gulberg III, Lahore',
        description: 'Exclusive penthouse with 360° city views, private rooftop, home automation, Italian marble throughout. The finest address in Gulberg.',
        price: 120000000, priceUnit: 'PKR',
        type: 'Apartment', category: 'residential', purpose: 'sale',
        bedrooms: 4, bathrooms: 5, kitchens: 2, parking: 3,
        area: { value: 4500, unit: 'sqft' },
        location: { address: 'Main Boulevard, Gulberg III', area: 'Gulberg III', city: 'Lahore' },
        images: [{ url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800', alt: 'Penthouse' }],
        thumbnail: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
        status: 'available', agentId: agentUser._id, isVerified: true, isExternal: false,
        contactInfo: { name: 'Ahmed Khan', phone: '0300-1234567', email: 'agent@demo.pk' },
      },
    ];

    let propertiesCreated = 0;
    for (const p of sampleProperties) {
      try {
        await Property.create(p);
        propertiesCreated++;
      } catch (err) {
        console.error('Seed property error:', err.message);
      }
    }

    res.json({
      message: 'Demo data seeded successfully!',
      usersCreated: savedUsers.length,
      propertiesCreated,
      accounts: demoUsers.map(u => ({ role: u.role, email: u.email, password: u.passwordHash })),
    });
  } catch (err) {
    console.error('Seed error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

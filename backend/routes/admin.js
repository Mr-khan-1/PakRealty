/**
 * routes/admin.js — Admin-only API routes
 *
 * All endpoints here require a valid JWT *and* role === 'admin'.
 *
 * Endpoints:
 *   POST /api/admin/scrape          → trigger the property scraper
 *   GET  /api/admin/scrape/status   → check if a scrape is running
 *   GET  /api/admin/stats           → platform-wide statistics
 *   PATCH /api/admin/properties/:id/verify  → verify/unverify a listing
 *   DELETE /api/admin/properties/:id        → hard-delete any listing
 *   PATCH /api/admin/users/:id/status       → activate / deactivate a user
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Property from '../models/Property.js';
import { runScraperJob } from '../scripts/scraper.js';

const router = express.Router();

// ─── Middleware: require valid JWT + admin role ───────────────────────────────
const requireAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_key');
    const user    = await User.findById(decoded.userId);

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.adminUser = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// ─── Scraper state (in-memory lock — prevents concurrent runs) ───────────────
let scraperState = {
  running:   false,
  startedAt: null,
  lastRun:   null,
  lastResult: null,
};

// POST /api/admin/scrape — trigger full property scrape
router.post('/scrape', requireAdmin, async (req, res) => {
  if (scraperState.running) {
    return res.status(409).json({
      error: 'Scraper is already running',
      startedAt: scraperState.startedAt,
    });
  }

  scraperState.running   = true;
  scraperState.startedAt = new Date();

  // Send immediate ACK — scraper runs in background
  res.json({
    message:   'Scraper started successfully',
    startedAt: scraperState.startedAt,
  });

  // Run asynchronously (no await on the response)
  try {
    const result = await runScraperJob(msg => console.log('[SCRAPER]', msg));
    scraperState.lastResult = { ...result, completedAt: new Date() };
    console.log('✅ Admin scraper job complete:', result);
  } catch (err) {
    scraperState.lastResult = { error: err.message, completedAt: new Date() };
    console.error('❌ Admin scraper job failed:', err);
  } finally {
    scraperState.running   = false;
    scraperState.lastRun   = new Date();
  }
});

// GET /api/admin/scrape/status — poll scraper progress
router.get('/scrape/status', requireAdmin, (req, res) => {
  res.json({
    running:    scraperState.running,
    startedAt:  scraperState.startedAt,
    lastRun:    scraperState.lastRun,
    lastResult: scraperState.lastResult,
  });
});

// GET /api/admin/stats — full platform statistics
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      totalAgents,
      totalInvestors,
      totalProperties,
      pendingProperties,
      scrapedProperties,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: 'agent' }),
      User.countDocuments({ role: 'investor' }),
      Property.countDocuments({}),
      Property.countDocuments({ isVerified: false }),
      Property.countDocuments({ isExternal: true }),
    ]);

    const recentListings = await Property.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title location.city price purpose isVerified isExternal createdAt');

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalAgents,
        totalInvestors,
        totalBuyers: totalUsers - totalAgents - totalInvestors,
        totalProperties,
        pendingProperties,
        scrapedProperties,
        lastScraperRun: scraperState.lastRun,
        scraperRunning: scraperState.running,
      },
      recentListings,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/properties/:id/verify — toggle verification
router.patch('/properties/:id/verify', requireAdmin, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ error: 'Property not found' });

    property.isVerified = !property.isVerified;
    await property.save();

    res.json({
      message:    `Property ${property.isVerified ? 'verified' : 'unverified'} successfully`,
      isVerified: property.isVerified,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/properties/:id — hard delete
router.delete('/properties/:id', requireAdmin, async (req, res) => {
  try {
    const property = await Property.findByIdAndDelete(req.params.id);
    if (!property) return res.status(404).json({ error: 'Property not found' });
    res.json({ message: 'Property permanently deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/users/:id/status — activate / deactivate
router.patch('/users/:id/status', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'admin')
      return res.status(403).json({ error: 'Cannot deactivate another admin' });

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message:  `User ${user.isActive ? 'activated' : 'deactivated'}`,
      isActive: user.isActive,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users — list all users (all roles) with search, filter, pagination
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const { role, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (role && ['user', 'agent', 'investor', 'admin'].includes(role)) {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email:     { $regex: search, $options: 'i' } },
      ];
    }

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(filter);

    const users = await User.find(filter)
      .select('name firstName lastName email phone role company isActive verificationStatus createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Role counts
    const [totalUsers, totalAgents, totalInvestors, totalAdmins] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'agent' }),
      User.countDocuments({ role: 'investor' }),
      User.countDocuments({ role: 'admin' }),
    ]);

    res.json({
      success: true,
      users,
      pagination: {
        total,
        page:  parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
      roleCounts: { user: totalUsers, agent: totalAgents, investor: totalInvestors, admin: totalAdmins },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

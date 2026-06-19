import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Property from '../models/Property.js';

const router = express.Router();

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

// ─── GET /api/users/profile/:id ───────────────────────────────────────────────
router.get('/profile/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/users/profile/:id ───────────────────────────────────────────────
router.put('/profile/:id', verifyToken, [
  body('name').optional().trim(),
  body('phone').optional(),
], async (req, res) => {
  try {
    if (req.params.id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const allowed = ['name', 'phone', 'avatar'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    res.json({ message: 'Profile updated', user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/users/favorites/:propertyId ────────────────────────────────────
router.post('/favorites/:propertyId', verifyToken, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $addToSet: { savedProperties: req.params.propertyId } },
      { new: true }
    ).populate('savedProperties', 'title price thumbnail location bedrooms bathrooms');

    res.json({ message: 'Property saved', savedProperties: user.savedProperties });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/users/favorites/:propertyId ──────────────────────────────────
router.delete('/favorites/:propertyId', verifyToken, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $pull: { savedProperties: req.params.propertyId } },
      { new: true }
    ).populate('savedProperties', 'title price thumbnail location bedrooms bathrooms');

    res.json({ message: 'Property removed from saved', savedProperties: user.savedProperties });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/users/favorites ─────────────────────────────────────────────────
router.get('/favorites', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate({
      path:   'savedProperties',
      select: 'title price thumbnail location bedrooms bathrooms area purpose type agentId',
    });
    res.json({ savedProperties: user?.savedProperties || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/users/agents/list ───────────────────────────────────────────────
router.get('/agents/list', async (req, res) => {
  try {
    const agents = await User.find({ role: 'agent', isActive: true })
      .select('name email phone');
    res.json({ agents });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/users/change-password ─────────────────────────────────────────
router.post('/change-password', verifyToken, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);

    if (!user || !(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    user.passwordHash = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

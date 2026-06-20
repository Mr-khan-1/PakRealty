import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import Inquiry from '../models/Inquiry.js';
import Property from '../models/Property.js';

const router = express.Router();

// Auth middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'pak_property_secret_2024');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Create inquiry
router.post('/', verifyToken, [
  body('propertyId').notEmpty().withMessage('propertyId is required'),
  body('message').isLength({ min: 10 }),
  body('inquiryType').isIn(['general', 'inspection', 'offer', 'rental']),
  body('preferredContact').isIn(['email', 'phone', 'whatsapp'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const property = await Property.findById(req.body.propertyId);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const inquiry = new Inquiry({
      ...req.body,
      propertyId: req.body.propertyId,
      userId: req.userId,
      agentId: property.agentId
    });

    await inquiry.save();
    await inquiry.populate([
      { path: 'property', select: 'title price' },
      { path: 'user', select: 'name firstName lastName email' },
      { path: 'agent', select: 'name firstName lastName email' }
    ]);

    res.status(201).json({
      message: 'Inquiry sent successfully',
      inquiry
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's inquiries
router.get('/user/:userId', async (req, res) => {
  try {
    const inquiries = await Inquiry.find({ userId: req.params.userId })
      .populate('property', 'title price images')
      .populate('agent', 'name firstName lastName email phone')
      .sort({ createdAt: -1 });

    res.json({ inquiries });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get agent's inquiries for their properties
router.get('/agent/:agentId', async (req, res) => {
  try {
    const inquiries = await Inquiry.find({ agentId: req.params.agentId })
      .populate('property', 'title price images')
      .populate('user', 'name firstName lastName email phone')
      .sort({ createdAt: -1 });

    res.json({ inquiries });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single inquiry
router.get('/:id', async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id)
      .populate('property')
      .populate('user', 'name firstName lastName email phone')
      .populate('agent', 'name firstName lastName email phone');

    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    res.json(inquiry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update inquiry status
router.patch('/:id/status', verifyToken, [
  body('status').isIn(['new', 'contacted', 'in-progress', 'resolved', 'closed'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status, updatedAt: new Date() },
      { new: true }
    ).populate([
      { path: 'property' },
      { path: 'user' },
      { path: 'agent' }
    ]);

    res.json({
      message: 'Inquiry status updated',
      inquiry
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add response to inquiry
router.post('/:id/response', verifyToken, [
  body('message').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      {
        reply: req.body.message,
        status: 'replied',
        updatedAt: new Date()
      },
      { new: true }
    ).populate('agentId', 'name firstName lastName email');

    res.json({
      message: 'Response added',
      inquiry
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete inquiry
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);

    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    // Check authorization
    if (inquiry.userId.toString() !== req.userId && inquiry.agentId?.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Inquiry.findByIdAndDelete(req.params.id);

    res.json({ message: 'Inquiry deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

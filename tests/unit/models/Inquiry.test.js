import mongoose from 'mongoose';
import Inquiry from '../../../backend/models/Inquiry.js';
import User from '../../../backend/models/User.js';
import Property from '../../../backend/models/Property.js';
import { mockUser, mockProperty } from '../../fixtures/testData.js';

describe('Inquiry Model Unit Tests', () => {
  let userId, agentId, propertyId;

  beforeAll(async () => {
    const user = new User({ ...mockUser, passwordHash: mockUser.password, email: 'inquiry-user@test.com' });
    const savedUser = await user.save();
    userId = savedUser._id;

    const agent = new User({ ...mockUser, passwordHash: mockUser.password, email: 'inquiry-agent@test.com', role: 'agent' });
    const savedAgent = await agent.save();
    agentId = savedAgent._id;

    const property = new Property({ ...mockProperty, agentId });
    const savedProp = await property.save();
    propertyId = savedProp._id;
  }, 30000);

  it('should create an inquiry with all required fields', async () => {
    const inquiry = new Inquiry({
      propertyId, userId, agentId,
      message: 'I am very interested in this property.',
      inquiryType: 'general',
      preferredContact: 'phone',
    });
    const saved = await inquiry.save();
    expect(saved._id).toBeDefined();
    expect(saved.status).toBe('pending');
    expect(saved.message).toBe('I am very interested in this property.');
  });

  it('should default status to pending', async () => {
    const inquiry = new Inquiry({
      propertyId, userId, agentId,
      message: 'Default status test message here.',
      inquiryType: 'general',
      preferredContact: 'email',
    });
    const saved = await inquiry.save();
    expect(saved.status).toBe('pending');
  });

  it('should fail without required propertyId', async () => {
    const inquiry = new Inquiry({
      userId, agentId,
      message: 'Missing property id test.',
      inquiryType: 'general',
      preferredContact: 'email',
    });
    let error;
    try { await inquiry.save(); } catch (e) { error = e; }
    expect(error).toBeDefined();
    expect(error.errors.propertyId).toBeDefined();
  });

  it('should fail without required userId', async () => {
    const inquiry = new Inquiry({
      propertyId, agentId,
      message: 'Missing user id test message.',
      inquiryType: 'general',
      preferredContact: 'email',
    });
    let error;
    try { await inquiry.save(); } catch (e) { error = e; }
    expect(error).toBeDefined();
    expect(error.errors.userId).toBeDefined();
  });

  it('should fail with an invalid status enum', async () => {
    const inquiry = new Inquiry({
      propertyId, userId, agentId,
      message: 'Invalid status enum test.',
      status: 'approved', // invalid
    });
    let error;
    try { await inquiry.save(); } catch (e) { error = e; }
    expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
  });

  it('should allow updating status to replied', async () => {
    const inquiry = new Inquiry({
      propertyId, userId, agentId,
      message: 'Update status test message here.',
      inquiryType: 'general',
      preferredContact: 'phone',
    });
    const saved = await inquiry.save();
    saved.status = 'replied';
    saved.reply = 'Thank you for your interest!';
    const updated = await saved.save();
    expect(updated.status).toBe('replied');
    expect(updated.reply).toBe('Thank you for your interest!');
  });

  it('should find all inquiries for a specific agent', async () => {
    const results = await Inquiry.find({ agentId });
    expect(results.length).toBeGreaterThan(0);
    results.forEach(i => expect(i.agentId.toString()).toBe(agentId.toString()));
  });
});

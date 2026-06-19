import mongoose from 'mongoose';
import Property from '../../backend/models/Property.js';
import User from '../../backend/models/User.js';
import Inquiry from '../../backend/models/Inquiry.js';
import { mockUser, mockProperty } from '../fixtures/testData.js';

describe('Integration - Database CRUD Operations', () => {
  let agentId;

  beforeAll(async () => {
    const agent = new User({ ...mockUser, email: 'db-agent@test.com', passwordHash: mockUser.password });
    const saved = await agent.save();
    agentId = saved._id;
  });

  it('should perform full CRUD on Property', async () => {
    // CREATE
    const created = await Property.create({ ...mockProperty, agentId, title: 'CRUD Test Property' });
    expect(created._id).toBeDefined();

    // READ
    const found = await Property.findById(created._id);
    expect(found.title).toBe('CRUD Test Property');

    // UPDATE
    const updated = await Property.findByIdAndUpdate(created._id, { title: 'Updated CRUD Property' }, { new: true });
    expect(updated.title).toBe('Updated CRUD Property');

    // DELETE
    await Property.findByIdAndDelete(created._id);
    const deleted = await Property.findById(created._id);
    expect(deleted).toBeNull();
  });

  it('should enforce email uniqueness at DB level for User', async () => {
    const email = 'unique-db-test@test.com';
    await User.create({ name: 'User One', email, passwordHash: 'HashedPass123' });

    let error;
    try {
      await User.create({ name: 'User Two', email, passwordHash: 'OtherHash123' });
    } catch (e) {
      error = e;
    }
    expect(error).toBeDefined();
    expect(error.code).toBe(11000);
  });

  it('should retrieve paginated properties correctly', async () => {
    // Seed 5 properties
    for (let i = 0; i < 5; i++) {
      await Property.create({ ...mockProperty, agentId, title: `Paginate Prop ${i}` });
    }
    const page1 = await Property.find({}).skip(0).limit(3);
    const page2 = await Property.find({}).skip(3).limit(3);
    expect(page1.length).toBeLessThanOrEqual(3);
    // Page 2 should have different documents than page 1
    const page1Ids = page1.map(p => p._id.toString());
    const page2Ids = page2.map(p => p._id.toString());
    const overlap = page1Ids.filter(id => page2Ids.includes(id));
    expect(overlap.length).toBe(0);
  });

  it('should populate agentId with user details correctly', async () => {
    const property = await Property.create({ ...mockProperty, agentId, title: 'Populate Test' });
    const populated = await Property.findById(property._id).populate('agentId', 'name email');
    expect(populated.agentId).toBeDefined();
    expect(populated.agentId.name).toBe(mockUser.name);
  });

  it('should filter properties by status=available', async () => {
    await Property.create({ ...mockProperty, agentId, title: 'Sold Prop', status: 'sold' });
    const available = await Property.find({ status: 'available' });
    available.forEach(p => expect(p.status).toBe('available'));
  });

  it('should run compound filters (city + purpose + status)', async () => {
    await Property.create({
      ...mockProperty, agentId, title: 'Compound Filter Prop',
      purpose: 'rent', location: { city: 'Rawalpindi', address: 'S1', area: 'Satellite Town' }
    });
    const results = await Property.find({ 'location.city': 'Rawalpindi', purpose: 'rent', status: 'available' });
    expect(results.length).toBeGreaterThan(0);
    results.forEach(p => {
      expect(p.location.city).toBe('Rawalpindi');
      expect(p.purpose).toBe('rent');
    });
  });
});

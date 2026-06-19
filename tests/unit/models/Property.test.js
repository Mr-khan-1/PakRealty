import mongoose from 'mongoose';
import Property from '../../../backend/models/Property.js';
import User from '../../../backend/models/User.js';
import { mockUser, mockProperty } from '../../fixtures/testData.js';

describe('Property Model Unit Tests', () => {
  let agentId;

  beforeAll(async () => {
    const user = new User({ ...mockUser, passwordHash: mockUser.password });
    const saved = await user.save();
    agentId = saved._id;
  }, 30000);

  it('should create a property successfully with all required fields', async () => {
    const property = new Property({ ...mockProperty, agentId });
    const saved = await property.save();
    expect(saved._id).toBeDefined();
    expect(saved.title).toBe(mockProperty.title);
    expect(saved.price).toBe(mockProperty.price);
    expect(saved.status).toBe('available');
  });

  it('should fail without required title field', async () => {
    const { title, ...rest } = mockProperty;
    const property = new Property({ ...rest, agentId });
    let error;
    try { await property.save(); } catch (e) { error = e; }
    expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(error.errors.title).toBeDefined();
  });

  it('should fail without required price field', async () => {
    const { price, ...rest } = mockProperty;
    const property = new Property({ ...rest, agentId });
    let error;
    try { await property.save(); } catch (e) { error = e; }
    expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(error.errors.price).toBeDefined();
  });

  it('should fail without required city in location', async () => {
    const property = new Property({
      ...mockProperty,
      agentId,
      location: { address: 'Street 1', area: 'DHA' }, // missing city
    });
    let error;
    try { await property.save(); } catch (e) { error = e; }
    expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
  });

  it('should default status to available', async () => {
    const property = new Property({ ...mockProperty, agentId, title: 'Status Test' });
    const saved = await property.save();
    expect(saved.status).toBe('available');
  });

  it('should reject invalid type enum', async () => {
    const property = new Property({ ...mockProperty, agentId, type: 'Spaceship' });
    let error;
    try { await property.save(); } catch (e) { error = e; }
    expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(error.errors.type).toBeDefined();
  });

  it('should correctly store area.value and area.unit', async () => {
    const property = new Property({
      ...mockProperty, agentId, title: 'Area Test',
      area: { value: 5, unit: 'marla' }
    });
    const saved = await property.save();
    expect(saved.area.value).toBe(5);
    expect(saved.area.unit).toBe('marla');
  });

  it('should increment views correctly', async () => {
    const property = new Property({ ...mockProperty, agentId, title: 'Views Test' });
    const saved = await property.save();
    await Property.findByIdAndUpdate(saved._id, { $inc: { views: 1 } });
    const updated = await Property.findById(saved._id);
    expect(updated.views).toBe(1);
  });

  it('should query by city filter correctly', async () => {
    await Property.create({ ...mockProperty, agentId, title: 'Lahore Prop', location: { city: 'Lahore', address: 'S1', area: 'DHA' } });
    const results = await Property.find({ 'location.city': 'Lahore' });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].location.city).toBe('Lahore');
  });
});

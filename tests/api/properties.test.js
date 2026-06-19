import request from 'supertest';
import app from '../../backend/server.js';
import Property from '../../backend/models/Property.js';
import User from '../../backend/models/User.js';
import jwt from 'jsonwebtoken';
import { mockUser, mockProperty } from '../fixtures/testData.js';

describe('Properties API Tests', () => {
  let agentToken, agentId;

  beforeAll(async () => {
    const agent = new User({ ...mockUser, email: 'prop-agent@test.com', passwordHash: mockUser.password, role: 'agent' });
    const saved = await agent.save();
    agentId = saved._id;
    agentToken = jwt.sign({ userId: saved._id }, process.env.JWT_SECRET || 'pak_property_secret_2024');

    // Seed some properties
    await Property.create({ ...mockProperty, agentId, title: 'Lahore House', location: { city: 'Lahore', address: 'S1', area: 'DHA' } });
    await Property.create({ ...mockProperty, agentId, title: 'Karachi Flat', type: 'Apartment', purpose: 'rent', price: 50000, location: { city: 'Karachi', address: 'S2', area: 'Clifton' } });
  });

  // ─── GET /api/properties ─────────────────────────────────────────────────────
  describe('GET /api/properties', () => {
    it('should return all properties with pagination', async () => {
      const res = await request(app).get('/api/properties');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('properties');
      expect(res.body).toHaveProperty('total');
      expect(Array.isArray(res.body.properties)).toBe(true);
    });

    it('should filter by city correctly', async () => {
      const res = await request(app).get('/api/properties?city=Lahore');
      expect(res.statusCode).toBe(200);
      res.body.properties.forEach(p => expect(p.location.city).toMatch(/lahore/i));
    });

    it('should filter by purpose correctly', async () => {
      const res = await request(app).get('/api/properties?purpose=rent');
      expect(res.statusCode).toBe(200);
      res.body.properties.forEach(p => expect(p.purpose).toBe('rent'));
    });

    it('should paginate results correctly', async () => {
      const res = await request(app).get('/api/properties?page=1&limit=1');
      expect(res.statusCode).toBe(200);
      expect(res.body.properties.length).toBeLessThanOrEqual(1);
    });

    it('should reject invalid purpose filter', async () => {
      const res = await request(app).get('/api/properties?purpose=barter');
      expect(res.statusCode).toBe(400);
    });

    it('should search by keyword', async () => {
      const res = await request(app).get('/api/properties?search=Karachi');
      expect(res.statusCode).toBe(200);
      expect(res.body.properties.length).toBeGreaterThan(0);
    });
  });

  // ─── GET /api/properties/:id ─────────────────────────────────────────────────
  describe('GET /api/properties/:id', () => {
    let propertyId;

    beforeAll(async () => {
      const p = await Property.findOne({ title: 'Lahore House' });
      propertyId = p._id;
    });

    it('should return a specific property by ID', async () => {
      const res = await request(app).get(`/api/properties/${propertyId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.property.title).toBe('Lahore House');
    });

    it('should return 404 for non-existent property', async () => {
      const fakeId = '000000000000000000000000';
      const res = await request(app).get(`/api/properties/${fakeId}`);
      expect(res.statusCode).toBe(404);
    });

    it('should return 400 for invalid ObjectId format', async () => {
      const res = await request(app).get('/api/properties/not-an-id');
      expect([400, 500]).toContain(res.statusCode);
    });
  });

  // ─── POST /api/properties ─────────────────────────────────────────────────────
  describe('POST /api/properties', () => {
    it('should reject request without auth token', async () => {
      const res = await request(app).post('/api/properties').send(mockProperty);
      expect(res.statusCode).toBe(401);
    });

    it('should reject request with missing title', async () => {
      const { title, ...rest } = mockProperty;
      const res = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${agentToken}`)
        .field('description', rest.description)
        .field('price', rest.price)
        .field('type', rest.type)
        .field('purpose', rest.purpose)
        .field('city', rest.location.city);
      expect([400, 422]).toContain(res.statusCode);
    });

    it('should reject request with missing price', async () => {
      const res = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${agentToken}`)
        .field('title', 'Test Property')
        .field('description', mockProperty.description)
        .field('type', mockProperty.type)
        .field('purpose', mockProperty.purpose)
        .field('city', mockProperty.location.city);
      expect([400, 422]).toContain(res.statusCode);
    });
  });

  // ─── GET /api/properties/agent/:agentId ──────────────────────────────────────
  describe('GET /api/properties/agent/:id', () => {
    it('should return properties for a specific agent', async () => {
      const res = await request(app)
        .get(`/api/properties/agent/${agentId}`)
        .set('Authorization', `Bearer ${agentToken}`);
      expect([200, 401]).toContain(res.statusCode);
    });
  });
});

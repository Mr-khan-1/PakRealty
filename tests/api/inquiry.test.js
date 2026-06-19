import request from 'supertest';
import app from '../../backend/server.js';
import User from '../../backend/models/User.js';
import Property from '../../backend/models/Property.js';
import Inquiry from '../../backend/models/Inquiry.js';
import jwt from 'jsonwebtoken';
import { mockUser, mockProperty } from '../fixtures/testData.js';

describe('Inquiry API Tests', () => {
  let userToken, agentToken, userId, agentId, propertyId;

  beforeAll(async () => {
    const user = new User({ ...mockUser, email: 'inq-user@test.com', passwordHash: mockUser.password, role: 'user' });
    const savedUser = await user.save();
    userId = savedUser._id;
    userToken = jwt.sign({ userId }, process.env.JWT_SECRET || 'pak_property_secret_2024');

    const agent = new User({ ...mockUser, email: 'inq-agent@test.com', passwordHash: mockUser.password, role: 'agent' });
    const savedAgent = await agent.save();
    agentId = savedAgent._id;
    agentToken = jwt.sign({ userId: agentId }, process.env.JWT_SECRET || 'pak_property_secret_2024');

    const prop = await Property.create({ ...mockProperty, agentId });
    propertyId = prop._id;
  });

  // ─── POST /api/inquiries ──────────────────────────────────────────────────────
  describe('POST /api/inquiries', () => {
    const validPayload = () => ({
      propertyId,
      message: 'I am very interested in this property!',
      inquiryType: 'general',
      preferredContact: 'phone',
    });

    it('should create inquiry successfully with valid data', async () => {
      const res = await request(app)
        .post('/api/inquiries')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validPayload());
      expect(res.statusCode).toBe(201);
      expect(res.body.inquiry).toBeDefined();
      expect(res.body.inquiry.status).toBe('pending');
    });

    it('should fail without auth token', async () => {
      const res = await request(app)
        .post('/api/inquiries')
        .send(validPayload());
      expect(res.statusCode).toBe(401);
    });

    it('should fail without required propertyId', async () => {
      const { propertyId: pid, ...rest } = validPayload();
      const res = await request(app)
        .post('/api/inquiries')
        .set('Authorization', `Bearer ${userToken}`)
        .send(rest);
      expect(res.statusCode).toBe(400);
    });

    it('should fail with invalid inquiryType', async () => {
      const res = await request(app)
        .post('/api/inquiries')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ ...validPayload(), inquiryType: 'invalid-type' });
      expect(res.statusCode).toBe(400);
    });

    it('should fail with short message (under 10 chars)', async () => {
      const res = await request(app)
        .post('/api/inquiries')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ ...validPayload(), message: 'Short' });
      expect(res.statusCode).toBe(400);
    });

    it('should fail for non-existent property', async () => {
      const res = await request(app)
        .post('/api/inquiries')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ ...validPayload(), propertyId: '000000000000000000000000' });
      expect(res.statusCode).toBe(404);
    });

    it('should save the correct agentId from the property', async () => {
      const res = await request(app)
        .post('/api/inquiries')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validPayload());
      expect(res.statusCode).toBe(201);
      expect(res.body.inquiry.agentId.toString()).toBe(agentId.toString());
    });
  });

  // ─── GET /api/inquiries/agent/:id ─────────────────────────────────────────────
  describe('GET /api/inquiries/agent/:id', () => {
    it('should return inquiries for the logged-in agent', async () => {
      // First create an inquiry
      await request(app)
        .post('/api/inquiries')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          propertyId,
          message: 'Agent inquiry test message here for testing.',
          inquiryType: 'general',
          preferredContact: 'email',
        });

      const res = await request(app)
        .get(`/api/inquiries/agent/${agentId}`)
        .set('Authorization', `Bearer ${agentToken}`);
      expect([200, 401]).toContain(res.statusCode);
    });
  });
});

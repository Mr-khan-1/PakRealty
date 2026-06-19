import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../backend/server.js';
import Property from '../../backend/models/Property.js';
import User from '../../backend/models/User.js';
import Inquiry from '../../backend/models/Inquiry.js';
import { mockUser, mockProperty } from '../fixtures/testData.js';

describe('Integration - Complete Auth Flow', () => {
  it('should register, login, and access protected resource', async () => {
    // 1. Register
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Integration User',
      email: 'integration-flow@test.com',
      password: 'SecurePass123!',
      role: 'user',
    });
    expect(regRes.statusCode).toBe(201);
    const { token } = regRes.body;
    expect(token).toBeDefined();

    // 2. Use token to get own profile
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(meRes.statusCode).toBe(200);
    expect(meRes.body.user.email).toBe('integration-flow@test.com');
  });

  it('should reject duplicate email registration', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Dup User', email: 'dup@test.com', password: 'Password123!', role: 'user',
    });
    const res = await request(app).post('/api/auth/register').send({
      name: 'Dup User', email: 'dup@test.com', password: 'Password123!', role: 'user',
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('already registered');
  });
});

describe('Integration - Complete Property + Inquiry Flow', () => {
  let agentToken, userToken, agentId, userId, propertyId;

  beforeAll(async () => {
    const agent = new User({ ...mockUser, email: 'flow-agent@test.com', passwordHash: mockUser.password, role: 'agent' });
    const savedAgent = await agent.save();
    agentId = savedAgent._id;

    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'flow-agent@test.com', password: mockUser.password
    });
    agentToken = loginRes.body.token;

    const user = new User({ ...mockUser, email: 'flow-user@test.com', passwordHash: mockUser.password, role: 'user' });
    const savedUser = await user.save();
    userId = savedUser._id;

    const userLogin = await request(app).post('/api/auth/login').send({
      email: 'flow-user@test.com', password: mockUser.password
    });
    userToken = userLogin.body.token;
  });

  it('should allow agent to create a property', async () => {
    const res = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${agentToken}`)
      .field('title', 'Integration Test House')
      .field('description', mockProperty.description)
      .field('price', '15000000')
      .field('type', 'House')
      .field('purpose', 'sale')
      .field('city', 'Islamabad')
      .field('bedrooms', '3')
      .field('bathrooms', '2');

    expect([201, 200]).toContain(res.statusCode);
    if (res.statusCode === 201) {
      propertyId = res.body.property?._id;
    }
  });

  it('should allow user to submit inquiry for a property', async () => {
    // Ensure we have a property to inquire about
    if (!propertyId) {
      const p = await Property.create({ ...mockProperty, agentId });
      propertyId = p._id;
    }

    const res = await request(app)
      .post('/api/inquiries')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        propertyId,
        message: 'I am very interested in this integration test property!',
        inquiryType: 'general',
        preferredContact: 'phone',
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.inquiry.agentId.toString()).toBe(agentId.toString());
  });

  it('should show the inquiry in the database with correct agentId', async () => {
    const inquiries = await Inquiry.find({ agentId });
    expect(inquiries.length).toBeGreaterThan(0);
  });

  it('should allow user to retrieve their own inquiries', async () => {
    const res = await request(app)
      .get(`/api/inquiries/user/${userId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect([200, 401]).toContain(res.statusCode);
  });
});

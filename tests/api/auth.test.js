import request from 'supertest';
import app from '../../backend/server.js';
import User from '../../backend/models/User.js';

describe('Auth API Tests', () => {
  const validUserPayload = {
    name: 'API Test User',
    email: 'apitest@example.com',
    password: 'ValidPassword123!',
    role: 'user'
  };

  it('POST /api/auth/register - should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(validUserPayload);
    
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Registration successful');
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(validUserPayload.email);
  });

  it('POST /api/auth/register - should fail with duplicate email', async () => {
    // Attempt to register again
    const res = await request(app)
      .post('/api/auth/register')
      .send(validUserPayload);
    
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Email already registered');
  });

  it('POST /api/auth/login - should login successfully and return JWT', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: validUserPayload.email,
        password: validUserPayload.password
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Login successful');
    expect(res.body.token).toBeDefined();
  });

  it('POST /api/auth/login - should fail with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: validUserPayload.email,
        password: 'WrongPassword1!'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });
});

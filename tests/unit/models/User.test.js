import mongoose from 'mongoose';
import User from '../../../backend/models/User.js';
import { mockUser, invalidUser } from '../../fixtures/testData.js';
import bcrypt from 'bcryptjs';

describe('User Model Unit Tests', () => {
  it('should create a user successfully with valid inputs', async () => {
    const user = new User({ ...mockUser, passwordHash: mockUser.password });
    await user.save();
    
    expect(user._id).toBeDefined();
    expect(user.name).toBe(mockUser.name);
    expect(user.email).toBe(mockUser.email.toLowerCase());
    expect(user.isActive).toBe(true);
    expect(user.role).toBe('agent');
  }, 20000);

  it('should hash the password before saving', async () => {
    const user = new User({ ...mockUser, email: 'hash@test.com', passwordHash: 'Plaintext123!' });
    await user.save();
    
    expect(user.passwordHash).not.toBe('Plaintext123!');
    const isMatch = await bcrypt.compare('Plaintext123!', user.passwordHash);
    expect(isMatch).toBe(true);
  }, 20000);

  it('should fail to create a user without required fields', async () => {
    const user = new User(invalidUser);
    let error;
    try {
      await user.save();
    } catch (err) {
      error = err;
    }
    
    expect(error).toBeDefined();
    expect(error.constructor.name).toBe('ValidationError');
  });

  it('should correctly output virtuals for firstName and lastName', () => {
    const user = new User({ name: 'Ali Raza Khan' });
    expect(user.firstName).toBe('Ali');
    expect(user.lastName).toBe('Raza Khan');
  });
});

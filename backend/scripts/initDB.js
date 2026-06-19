// backend/scripts/initDB.js
/*
  Database initialization script for PakProperty Hub.
  - Ensures all required indexes are created (Mongoose does this on model compile).
  - Creates a default admin account if none exists.
  - Can be run manually: `node backend/scripts/initDB.js`
*/
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load .env located in the backend directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });
if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI not defined in .env');
  process.exit(1);
}

import mongoose from 'mongoose';
import User from '../models/User.js';
import Property from '../models/Property.js';
import Inquiry from '../models/Inquiry.js';
import Investment from '../models/Investment.js';

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');

    // Ensure indexes (Mongoose will sync on model import, but we call syncIndexes for safety)
    await Promise.all([
      User.syncIndexes(),
      Property.syncIndexes(),
      Inquiry.syncIndexes(),
      Investment.syncIndexes(),
    ]);
    console.log('🔍 Indexes synced');

    // Create admin if absent
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@pakpropertyhub.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const admin = new User({
        name: 'Admin',
        email: adminEmail,
        passwordHash: process.env.ADMIN_PASSWORD || 'ChangeMe123!', // will be hashed by pre‑save hook
        role: 'admin',
        isActive: true,
      });
      await admin.save();
      console.log('🛠️ Created default admin user');
    } else {
      console.log('👤 Admin user already exists');
    }

    console.log('✅ Database initialization complete');
    process.exit(0);
  } catch (err) {
    console.error('❌ Init script failed:', err);
    process.exit(1);
  }
};

run();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import authRoutes     from './routes/auth.js';
import propertyRoutes from './routes/property.js';
import inquiryRoutes  from './routes/inquiry.js';
import userRoutes     from './routes/user.js';
import investorRoutes from './routes/investor.js';
import adminRoutes    from './routes/admin.js';

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ─── Auto-create uploads directory ───────────────────────────────────────────
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created public/uploads directory');
}

// ─── Security middleware ──────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin:         process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials:    true,
  methods:        ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Rate limiter ─────────────────────────────────────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      300,
  message:  'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders:   false,
}));

// ─── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// ─── DB connection ────────────────────────────────────────────────────────────
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS:          45000,
    });
    console.log(`✅ MongoDB Atlas connected: ${conn.connection.host}`);
    console.log(`✅ Database: ${conn.connection.name}`);
  } catch (err) {
    console.error(`❌ MongoDB connection failed: ${err.message}`);
    console.error('   Check: MONGO_URI in .env, Atlas IP whitelist, credentials');
    process.exit(1);
  }
};

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status:    'Server running',
    timestamp: new Date().toISOString(),
    uptime:    process.uptime(),
    db:        mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

app.use('/api/auth',       authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/inquiries',  inquiryRoutes);
app.use('/api/users',      userRoutes);
app.use('/api/investor',   investorRoutes);
app.use('/api/admin',      adminRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path, method: req.method });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── Start server ─────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  await connectDB();
}

const PORT = parseInt(process.env.PORT || '5000', 10);

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`🌐 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️  Port ${port} is already in use — trying port ${port + 1}...`);
      server.close();
      startServer(port + 1);   // auto-retry on next port
    } else {
      console.error('❌ Server error:', err);
      process.exit(1);
    }
  });

  // ─── Graceful shutdown ──────────────────────────────────────────────────────
  const shutdown = async () => {
    console.log('\n🔌 Shutting down gracefully...');
    server.close(async () => {
      try {
        await mongoose.connection.close();
        console.log('✅ Server and DB closed.');
        process.exit(0);
      } catch (shutErr) {
        console.error('Error during shutdown:', shutErr);
        process.exit(1);
      }
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT',  shutdown);
  process.on('SIGUSR2', shutdown);

  return server;
};

if (process.env.NODE_ENV !== 'test') {
  startServer(PORT);
}

export default app;

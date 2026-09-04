import express from 'express';
import http from 'http';
import cors from 'cors';
import { PORT } from './config/env';
import { connectDB } from './config/db';
import { initSocket } from './services/socketService';
import { seedDatabase } from './seed/seedData';

import authRoutes from './routes/authRoutes';
import patientRoutes from './routes/patientRoutes';
import adminRoutes from './routes/adminRoutes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection & seeding middleware for Serverless / Vercel compatibility
app.use(async (req, res, next) => {
  try {
    await connectDB();
    await seedDatabase();
    next();
  } catch (err) {
    console.error('Database connection / seed error:', err);
    res.status(500).json({ message: 'Database connection failed' });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Hospital Canteen Management API is running.' });
});

// Standalone Server startup (when not running as a Vercel serverless function)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const server = http.createServer(app);
  initSocket(server);

  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🏥 HOSPITAL CANTEEN MANAGEMENT BACKEND SERVER`);
    console.log(`   Running on http://localhost:${PORT}`);
    console.log(`====================================================`);
  });
}

export default app;

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
const server = http.createServer(app);

// Initialize Socket.IO with persistent WebSockets for Render deployment
initSocket(server);

// CORS configuration supporting Vercel frontend & Render cross-origin calls
app.use(
  cors({
    origin: true, // Accepts dynamic origin from frontend
    credentials: true,
  })
);

app.use(express.json());

// Database connection & seeding middleware
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
  res.status(200).json({ status: 'OK', message: 'Hospital Canteen Management API is running on Render.' });
});
app.get('/', (req, res) => {
  res.status(200).send('🏥 Hospital Canteen Management Backend Service Running on Render.');
});

// Server startup
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🏥 HOSPITAL CANTEEN MANAGEMENT BACKEND SERVER`);
  console.log(`   Running on Port ${PORT} (Render Deployment Ready)`);
  console.log(`====================================================`);
});

export default app;

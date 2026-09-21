import mongoose from 'mongoose';
import { DATABASE_URL } from './env';

export const connectDB = async () => {
  // If already connected, reuse connection (optimizes serverless execution)
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    const dbUri = process.env.MONGODB_URI || process.env.DATABASE_URL || DATABASE_URL;
    console.log('Connecting to MongoDB Atlas database...');
    await mongoose.connect(dbUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`MongoDB connected successfully to ${mongoose.connection.name}!`);
  } catch (error) {
    console.error('MongoDB Atlas Connection Error:', error);
    throw error;
  }
};

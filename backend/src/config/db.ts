import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { DATABASE_URL } from './env';

let mongod: MongoMemoryServer | null = null;

export const connectDB = async () => {
  // If already connected, reuse connection (optimizes Vercel serverless functions)
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    const dbUri = process.env.MONGODB_URI || DATABASE_URL;
    console.log('Connecting to MongoDB...');
    await mongoose.connect(dbUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('MongoDB connected successfully!');
  } catch (error) {
    console.log('Local/Atlas MongoDB connection failed or not configured, attempting Memory Server fallback...');
    // Only use memory server if not running in production / Vercel serverless
    if (process.env.VERCEL) {
      console.error('MongoDB Atlas Connection Error on Vercel:', error);
      throw error;
    }
    try {
      if (!mongod) {
        mongod = await MongoMemoryServer.create();
      }
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log(`Connected to MongoDB Memory Server fallback at ${uri}`);
    } catch (memError) {
      console.error('Failed to start MongoDB Memory Server:', memError);
      throw memError;
    }
  }
};

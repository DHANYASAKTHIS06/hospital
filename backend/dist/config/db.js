"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
const env_1 = require("./env");
let mongod = null;
const connectDB = async () => {
    // If already connected, reuse connection (optimizes Vercel serverless functions)
    if (mongoose_1.default.connection.readyState >= 1) {
        return;
    }
    try {
        const dbUri = process.env.MONGODB_URI || env_1.DATABASE_URL;
        console.log('Connecting to MongoDB...');
        await mongoose_1.default.connect(dbUri, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log('MongoDB connected successfully!');
    }
    catch (error) {
        console.log('Local/Atlas MongoDB connection failed or not configured, attempting Memory Server fallback...');
        // Only use memory server if not running in production / Vercel serverless
        if (process.env.VERCEL) {
            console.error('MongoDB Atlas Connection Error on Vercel:', error);
            throw error;
        }
        try {
            if (!mongod) {
                mongod = await mongodb_memory_server_1.MongoMemoryServer.create();
            }
            const uri = mongod.getUri();
            await mongoose_1.default.connect(uri);
            console.log(`Connected to MongoDB Memory Server fallback at ${uri}`);
        }
        catch (memError) {
            console.error('Failed to start MongoDB Memory Server:', memError);
            throw memError;
        }
    }
};
exports.connectDB = connectDB;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
const connectDB = async () => {
    // If already connected, reuse connection (optimizes serverless execution)
    if (mongoose_1.default.connection.readyState >= 1) {
        return;
    }
    try {
        const dbUri = process.env.MONGODB_URI || process.env.DATABASE_URL || env_1.DATABASE_URL;
        console.log('Connecting to MongoDB Atlas database...');
        await mongoose_1.default.connect(dbUri, {
            serverSelectionTimeoutMS: 10000,
        });
        console.log(`MongoDB connected successfully to ${mongoose_1.default.connection.name}!`);
    }
    catch (error) {
        console.error('MongoDB Atlas Connection Error:', error);
        throw error;
    }
};
exports.connectDB = connectDB;

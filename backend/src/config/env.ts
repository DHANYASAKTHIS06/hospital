import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export const PORT = process.env.PORT || 5000;
export const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/hospital_canteen';
export const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_hospital_canteen_jwt_key_2026';
export const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const ATLAS_URI = 'mongodb+srv://sakthis25sk_db_user:Sx4vwp3789lDRPNU@cluster0.py4u2nq.mongodb.net/hospital_canteen?retryWrites=true&w=majority';

export const PORT = process.env.PORT || 5000;
export const DATABASE_URL = process.env.MONGODB_URI || process.env.DATABASE_URL || ATLAS_URI;
export const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_hospital_canteen_jwt_key_2026';
export const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

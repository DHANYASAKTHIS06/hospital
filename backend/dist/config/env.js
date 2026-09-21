"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLIENT_URL = exports.JWT_SECRET = exports.DATABASE_URL = exports.PORT = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const ATLAS_URI = 'mongodb+srv://sakthis25sk_db_user:Sx4vwp3789lDRPNU@cluster0.py4u2nq.mongodb.net/hospital_canteen?retryWrites=true&w=majority';
exports.PORT = process.env.PORT || 5000;
exports.DATABASE_URL = process.env.MONGODB_URI || process.env.DATABASE_URL || ATLAS_URI;
exports.JWT_SECRET = process.env.JWT_SECRET || 'super_secret_hospital_canteen_jwt_key_2026';
exports.CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

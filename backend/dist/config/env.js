"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLIENT_URL = exports.JWT_SECRET = exports.DATABASE_URL = exports.PORT = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
exports.PORT = process.env.PORT || 5000;
exports.DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/hospital_canteen';
exports.JWT_SECRET = process.env.JWT_SECRET || 'super_secret_hospital_canteen_jwt_key_2026';
exports.CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

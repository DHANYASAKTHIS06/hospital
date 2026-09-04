"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const db_1 = require("./config/db");
const socketService_1 = require("./services/socketService");
const seedData_1 = require("./seed/seedData");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const patientRoutes_1 = __importDefault(require("./routes/patientRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Database connection & seeding middleware for Serverless / Vercel compatibility
app.use(async (req, res, next) => {
    try {
        await (0, db_1.connectDB)();
        await (0, seedData_1.seedDatabase)();
        next();
    }
    catch (err) {
        console.error('Database connection / seed error:', err);
        res.status(500).json({ message: 'Database connection failed' });
    }
});
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/patient', patientRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Hospital Canteen Management API is running.' });
});
// Standalone Server startup (when not running as a Vercel serverless function)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    const server = http_1.default.createServer(app);
    (0, socketService_1.initSocket)(server);
    server.listen(env_1.PORT, () => {
        console.log(`====================================================`);
        console.log(`🏥 HOSPITAL CANTEEN MANAGEMENT BACKEND SERVER`);
        console.log(`   Running on http://localhost:${env_1.PORT}`);
        console.log(`====================================================`);
    });
}
exports.default = app;

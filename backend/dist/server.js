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
const server = http_1.default.createServer(app);
// Initialize Socket.IO with persistent WebSockets for Render deployment
(0, socketService_1.initSocket)(server);
// CORS configuration supporting Vercel frontend & Render cross-origin calls
app.use((0, cors_1.default)({
    origin: true, // Accepts dynamic origin from frontend
    credentials: true,
}));
app.use(express_1.default.json());
// Database connection & seeding middleware
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
    res.status(200).json({ status: 'OK', message: 'Hospital Canteen Management API is running on Render.' });
});
app.get('/', (req, res) => {
    res.status(200).send('🏥 Hospital Canteen Management Backend Service Running on Render.');
});
// Server startup
server.listen(env_1.PORT, () => {
    console.log(`====================================================`);
    console.log(`🏥 HOSPITAL CANTEEN MANAGEMENT BACKEND SERVER`);
    console.log(`   Running on Port ${env_1.PORT} (Render Deployment Ready)`);
    console.log(`====================================================`);
});
exports.default = app;

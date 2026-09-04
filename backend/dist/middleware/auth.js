"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPatientOwnership = exports.requirePatient = exports.requireAdmin = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized access. Token missing.' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        return res.status(403).json({ message: 'Invalid or expired token.' });
    }
};
exports.authenticateToken = authenticateToken;
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'ADMIN') {
        return res
            .status(403)
            .json({ message: 'Unauthorized access. You do not have permission to perform this action.' });
    }
    next();
};
exports.requireAdmin = requireAdmin;
const requirePatient = (req, res, next) => {
    if (!req.user || req.user.role !== 'PATIENT') {
        return res
            .status(403)
            .json({ message: 'Unauthorized access. Patient role required.' });
    }
    next();
};
exports.requirePatient = requirePatient;
const verifyPatientOwnership = (targetPatientId, req) => {
    if (!req.user)
        return false;
    if (req.user.role === 'ADMIN')
        return true;
    return req.user.patient_id === targetPatientId;
};
exports.verifyPatientOwnership = verifyPatientOwnership;

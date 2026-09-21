"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminLogin = exports.patientLogin = exports.unifiedLogin = exports.patientSignup = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Patient_1 = require("../models/Patient");
const Admin_1 = require("../models/Admin");
const env_1 = require("../config/env");
const patientSignup = async (req, res) => {
    return res.status(403).json({
        message: 'Public patient self-registration is disabled. Only the Canteen Admin can create new patient accounts.',
    });
};
exports.patientSignup = patientSignup;
const unifiedLogin = async (req, res) => {
    try {
        const rawIdentifier = req.body.identifier || req.body.patient_id || req.body.username;
        const { password } = req.body;
        if (!rawIdentifier || !password) {
            return res.status(400).json({ message: 'Patient ID / Username and Password are required.' });
        }
        const identifier = String(rawIdentifier).trim();
        // 1. Check if the identifier matches Admin username ("admin" case-insensitive)
        if (identifier.toLowerCase() === 'admin') {
            const admin = await Admin_1.Admin.findOne({ username: 'admin' });
            if (admin) {
                const isMatch = await bcryptjs_1.default.compare(password, admin.password_hash);
                if (isMatch) {
                    const token = jsonwebtoken_1.default.sign({
                        id: admin._id,
                        username: admin.username,
                        role: 'ADMIN',
                    }, env_1.JWT_SECRET, { expiresIn: '7d' });
                    return res.status(200).json({
                        message: 'Admin Login successful',
                        token,
                        user: {
                            id: admin._id,
                            username: admin.username,
                            role: 'ADMIN',
                        },
                    });
                }
            }
        }
        // 2. Search Patient collection by patient_id
        const patient = await Patient_1.Patient.findOne({ patient_id: identifier.toUpperCase() });
        if (patient) {
            const isMatch = await bcryptjs_1.default.compare(password, patient.password_hash);
            if (isMatch) {
                const token = jsonwebtoken_1.default.sign({
                    id: patient._id,
                    patient_id: patient.patient_id,
                    role: 'PATIENT',
                }, env_1.JWT_SECRET, { expiresIn: '7d' });
                return res.status(200).json({
                    message: 'Patient Login successful',
                    token,
                    user: {
                        id: patient._id,
                        patient_id: patient.patient_id,
                        name: patient.name,
                        age: patient.age,
                        address: patient.address,
                        room_number: patient.room_number,
                        mobile: patient.mobile,
                        role: 'PATIENT',
                    },
                });
            }
        }
        // 3. Fallback invalid credentials error
        return res.status(401).json({ message: 'Invalid Patient ID / Username or Password.' });
    }
    catch (error) {
        console.error('Unified Login Error:', error);
        return res.status(500).json({ message: 'Server error during login.' });
    }
};
exports.unifiedLogin = unifiedLogin;
exports.patientLogin = exports.unifiedLogin;
exports.adminLogin = exports.unifiedLogin;

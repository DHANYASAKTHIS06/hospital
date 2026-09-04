"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminLogin = exports.patientLogin = exports.patientSignup = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Patient_1 = require("../models/Patient");
const Admin_1 = require("../models/Admin");
const Counter_1 = require("../models/Counter");
const env_1 = require("../config/env");
const patientSignup = async (req, res) => {
    try {
        const { name, age, address, room_number, mobile, password, confirmPassword } = req.body;
        if (!name || !age || !address || !room_number || !mobile || !password) {
            return res.status(400).json({ message: 'All fields are required.' });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
        }
        // Validate Indian mobile number (10 digits)
        const mobileRegex = /^[6-9]\d{9}$/;
        if (!mobileRegex.test(mobile)) {
            return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number.' });
        }
        // Check if mobile number is already registered
        const existingPatient = await Patient_1.Patient.findOne({ mobile });
        if (existingPatient) {
            return res.status(400).json({ message: 'Mobile Number already registered.' });
        }
        // Generate unique Patient ID e.g. P20260001
        const year = new Date().getFullYear();
        const seq = await (0, Counter_1.getNextSequenceValue)(`patient_id_${year}`);
        const formattedSeq = String(seq).padStart(4, '0');
        const patient_id = `P${year}${formattedSeq}`;
        const password_hash = await bcryptjs_1.default.hash(password, 10);
        const newPatient = await Patient_1.Patient.create({
            patient_id,
            name,
            age: Number(age),
            address,
            room_number,
            mobile,
            password_hash,
        });
        return res.status(201).json({
            message: 'Registration successful',
            patient: {
                patient_id: newPatient.patient_id,
                name: newPatient.name,
                age: newPatient.age,
                address: newPatient.address,
                room_number: newPatient.room_number,
                mobile: newPatient.mobile,
            },
        });
    }
    catch (error) {
        console.error('Signup Error:', error);
        return res.status(500).json({ message: 'Server error during signup.', error: error.message });
    }
};
exports.patientSignup = patientSignup;
const patientLogin = async (req, res) => {
    try {
        const { patient_id, password } = req.body;
        if (!patient_id || !password) {
            return res.status(400).json({ message: 'Patient ID and Password are required.' });
        }
        const patient = await Patient_1.Patient.findOne({ patient_id: patient_id.toUpperCase().trim() });
        if (!patient) {
            return res.status(401).json({ message: 'Invalid Patient ID or Password' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, patient.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid Patient ID or Password' });
        }
        const token = jsonwebtoken_1.default.sign({
            id: patient._id,
            patient_id: patient.patient_id,
            role: 'PATIENT',
        }, env_1.JWT_SECRET, { expiresIn: '7d' });
        return res.status(200).json({
            message: 'Login successful',
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
    catch (error) {
        console.error('Patient Login Error:', error);
        return res.status(500).json({ message: 'Server error during login.' });
    }
};
exports.patientLogin = patientLogin;
const adminLogin = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Admin Username and Password are required.' });
        }
        const admin = await Admin_1.Admin.findOne({ username: username.trim() });
        if (!admin) {
            return res.status(401).json({ message: 'Invalid Admin Credentials' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, admin.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid Admin Credentials' });
        }
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
    catch (error) {
        console.error('Admin Login Error:', error);
        return res.status(500).json({ message: 'Server error during admin login.' });
    }
};
exports.adminLogin = adminLogin;

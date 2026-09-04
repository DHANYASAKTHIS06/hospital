import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Patient } from '../models/Patient';
import { Admin } from '../models/Admin';
import { getNextSequenceValue } from '../models/Counter';
import { JWT_SECRET } from '../config/env';

export const patientSignup = async (req: Request, res: Response) => {
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
    const existingPatient = await Patient.findOne({ mobile });
    if (existingPatient) {
      return res.status(400).json({ message: 'Mobile Number already registered.' });
    }

    // Generate unique Patient ID e.g. P20260001
    const year = new Date().getFullYear();
    const seq = await getNextSequenceValue(`patient_id_${year}`);
    const formattedSeq = String(seq).padStart(4, '0');
    const patient_id = `P${year}${formattedSeq}`;

    const password_hash = await bcrypt.hash(password, 10);

    const newPatient = await Patient.create({
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
  } catch (error: any) {
    console.error('Signup Error:', error);
    return res.status(500).json({ message: 'Server error during signup.', error: error.message });
  }
};

export const patientLogin = async (req: Request, res: Response) => {
  try {
    const { patient_id, password } = req.body;

    if (!patient_id || !password) {
      return res.status(400).json({ message: 'Patient ID and Password are required.' });
    }

    const patient = await Patient.findOne({ patient_id: patient_id.toUpperCase().trim() });
    if (!patient) {
      return res.status(401).json({ message: 'Invalid Patient ID or Password' });
    }

    const isMatch = await bcrypt.compare(password, patient.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid Patient ID or Password' });
    }

    const token = jwt.sign(
      {
        id: patient._id,
        patient_id: patient.patient_id,
        role: 'PATIENT',
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

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
  } catch (error: any) {
    console.error('Patient Login Error:', error);
    return res.status(500).json({ message: 'Server error during login.' });
  }
};

export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Admin Username and Password are required.' });
    }

    const admin = await Admin.findOne({ username: username.trim() });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid Admin Credentials' });
    }

    const isMatch = await bcrypt.compare(password,password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid Admin Credentials' });
    }

    const token = jwt.sign(
      {
        id: admin._id,S
        username: admin.username,
        role: 'ADMIN',
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message: 'Admin Login successful',
      token,
      user: {
        id: admin._id,
        username: admin.username,
        role: 'ADMIN',
      },
    });
  } catch (error: any) {
    console.error('Admin Login Error:', error);
    return res.status(500).json({ message: 'Server error during admin login.' });
  }
};

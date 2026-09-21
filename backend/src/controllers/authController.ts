import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Patient } from '../models/Patient';
import { Admin } from '../models/Admin';
import { getNextSequenceValue } from '../models/Counter';
import { JWT_SECRET } from '../config/env';

export const patientSignup = async (req: Request, res: Response) => {
  return res.status(403).json({
    message: 'Public patient self-registration is disabled. Only the Canteen Admin can create new patient accounts.',
  });
};

export const unifiedLogin = async (req: Request, res: Response) => {
  try {
    const rawIdentifier = req.body.identifier || req.body.patient_id || req.body.username;
    const { password } = req.body;

    if (!rawIdentifier || !password) {
      return res.status(400).json({ message: 'Patient ID / Username and Password are required.' });
    }

    const identifier = String(rawIdentifier).trim();

    // 1. Check if the identifier matches Admin username ("admin" case-insensitive)
    if (identifier.toLowerCase() === 'admin') {
      const admin = await Admin.findOne({ username: 'admin' });
      if (admin) {
        const isMatch = await bcrypt.compare(password, admin.password_hash);
        if (isMatch) {
          const token = jwt.sign(
            {
              id: admin._id,
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
        }
      }
    }

    // 2. Search Patient collection by patient_id
    const patient = await Patient.findOne({ patient_id: identifier.toUpperCase() });
    if (patient) {
      const isMatch = await bcrypt.compare(password, patient.password_hash);
      if (isMatch) {
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
  } catch (error: any) {
    console.error('Unified Login Error:', error);
    return res.status(500).json({ message: 'Server error during login.' });
  }
};

export const patientLogin = unifiedLogin;
export const adminLogin = unifiedLogin;


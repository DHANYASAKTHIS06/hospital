import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: 'ADMIN' | 'PATIENT';
    patient_id?: string;
    username?: string;
  };
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Response | void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized access. Token missing.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      role: 'ADMIN' | 'PATIENT';
      patient_id?: string;
      username?: string;
    };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Response | void => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res
      .status(403)
      .json({ message: 'Unauthorized access. You do not have permission to perform this action.' });
  }
  next();
};

export const requirePatient = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Response | void => {
  if (!req.user || req.user.role !== 'PATIENT') {
    return res
      .status(403)
      .json({ message: 'Unauthorized access. Patient role required.' });
  }
  next();
};

export const verifyPatientOwnership = (targetPatientId: string, req: AuthRequest): boolean => {
  if (!req.user) return false;
  if (req.user.role === 'ADMIN') return true;
  return req.user.patient_id === targetPatientId;
};

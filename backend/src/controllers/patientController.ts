import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Patient } from '../models/Patient';
import { FoodOrder } from '../models/FoodOrder';
import { OrderItem } from '../models/OrderItem';

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const patient_id = req.user?.patient_id;
    if (!patient_id) {
      return res.status(403).json({ message: 'Patient identity missing.' });
    }

    const patient = await Patient.findOne({ patient_id }).select('-password_hash');
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found.' });
    }

    return res.status(200).json(patient);
  } catch (error: any) {
    console.error('Get Profile Error:', error);
    return res.status(500).json({ message: 'Error retrieving profile.' });
  }
};

export const getFoodHistory = async (req: AuthRequest, res: Response) => {
  try {
    const patient_id = req.user?.patient_id;
    if (!patient_id) {
      return res.status(403).json({ message: 'Patient identity missing.' });
    }

    const orders = await FoodOrder.find({ patient_id }).sort({ createdAt: -1 });

    const history = await Promise.all(
      orders.map(async (order) => {
        const items = await OrderItem.find({ order_id: order.order_id });
        return {
          order_id: order.order_id,
          order_date: order.order_date,
          order_time: order.order_time,
          meal_type: order.meal_type,
          order_status: order.order_status,
          total_amount: order.total_amount,
          items,
        };
      })
    );

    return res.status(200).json(history);
  } catch (error: any) {
    console.error('Get Food History Error:', error);
    return res.status(500).json({ message: 'Error retrieving food history.' });
  }
};

import { Request, Response } from 'express';
import { SystemSetting } from '../models/SystemSetting';
import { getIO } from '../services/socketService';

export const getOrderingLockedStatus = async (): Promise<boolean> => {
  try {
    const setting = await SystemSetting.findOne({ key: 'is_ordering_locked' });
    return setting ? Boolean(setting.value) : false;
  } catch (err) {
    console.error('Error reading ordering lock setting:', err);
    return false;
  }
};

export const getSystemStatus = async (req: Request, res: Response) => {
  try {
    const is_ordering_locked = await getOrderingLockedStatus();
    return res.status(200).json({ is_ordering_locked });
  } catch (error: any) {
    console.error('Get System Status Error:', error);
    return res.status(500).json({ message: 'Error retrieving system status.' });
  }
};

export const toggleOrderingLock = async (req: Request, res: Response) => {
  try {
    const { is_ordering_locked } = req.body;

    let targetValue: boolean;
    if (typeof is_ordering_locked === 'boolean') {
      targetValue = is_ordering_locked;
    } else {
      const current = await getOrderingLockedStatus();
      targetValue = !current;
    }

    await SystemSetting.findOneAndUpdate(
      { key: 'is_ordering_locked' },
      { value: targetValue },
      { upsert: true, new: true }
    );

    // Broadcast to all socket clients (patients & admins)
    try {
      const io = getIO();
      io.emit('ordering_status_changed', { is_ordering_locked: targetValue });
    } catch (e) {
      console.warn('Socket emit warning:', e);
    }

    return res.status(200).json({
      message: `Ordering has been ${targetValue ? 'LOCKED (Closed)' : 'UNLOCKED (Open)'}.`,
      is_ordering_locked: targetValue,
    });
  } catch (error: any) {
    console.error('Toggle Ordering Lock Error:', error);
    return res.status(500).json({ message: 'Error updating ordering lock status.' });
  }
};

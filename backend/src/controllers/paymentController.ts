import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Bill } from '../models/Bill';
import { Patient } from '../models/Patient';
import { emitToPatient, emitToAdmin } from '../services/socketService';

export const updatePaymentStatus = async (req: AuthRequest, res: Response) => {
  try {
    // ADMIN ONLY
    const { billId } = req.params;
    const { payment_status, advance_amount } = req.body;

    const bill = await Bill.findOne({ bill_id: billId });
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found.' });
    }

    if (payment_status && !['UNPAID', 'ADVANCE', 'PAID'].includes(payment_status)) {
      return res.status(400).json({ message: 'Invalid payment status value.' });
    }

    if (advance_amount !== undefined) {
      const adv = Number(advance_amount);
      if (adv < 0) {
        return res.status(400).json({ message: 'Advance amount cannot be negative.' });
      }
      if (adv > bill.total_amount) {
        return res.status(400).json({ message: 'Advance amount cannot exceed total bill amount.' });
      }
      bill.advance_amount = adv;
      bill.remaining_amount = Math.max(0, bill.total_amount - adv);
    }

    if (payment_status === 'PAID') {
      bill.payment_status = 'PAID';
      bill.advance_amount = bill.total_amount;
      bill.remaining_amount = 0;
    } else if (payment_status === 'UNPAID') {
      bill.payment_status = 'UNPAID';
      bill.advance_amount = 0;
      bill.remaining_amount = bill.total_amount;
    } else if (payment_status === 'ADVANCE') {
      bill.payment_status = 'ADVANCE';
      if (bill.advance_amount <= 0) {
        bill.advance_amount = Math.round(bill.total_amount / 2); // Default to half if unspecified
        bill.remaining_amount = bill.total_amount - bill.advance_amount;
      }
    }

    await bill.save();

    const patient = await Patient.findOne({ patient_id: bill.patient_id });
    const payload = {
      ...bill.toObject(),
      patient_name: patient ? patient.name : 'Unknown',
      room_number: patient ? patient.room_number : 'N/A',
    };

    emitToPatient(bill.patient_id, 'payment_status_updated', payload);
    emitToAdmin('payment_status_updated', payload);

    return res.status(200).json({
      message: 'Payment status updated successfully',
      bill: payload,
    });
  } catch (error: any) {
    console.error('Update Payment Status Error:', error);
    return res.status(500).json({ message: 'Error updating payment status.' });
  }
};

export const getPatientPaymentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const patient_id = req.user?.patient_id;
    if (!patient_id) {
      return res.status(403).json({ message: 'Patient identity missing.' });
    }

    const bills = await Bill.find({ patient_id }).sort({ createdAt: -1 });
    const total_billed = bills.reduce((acc, b) => acc + b.total_amount, 0);
    const total_advance = bills.reduce((acc, b) => acc + b.advance_amount, 0);
    const total_remaining = bills.reduce((acc, b) => acc + b.remaining_amount, 0);

    return res.status(200).json({
      bills,
      summary: {
        total_billed,
        total_advance,
        total_remaining,
      },
    });
  } catch (error: any) {
    console.error('Get Patient Payment Status Error:', error);
    return res.status(500).json({ message: 'Error retrieving payment status.' });
  }
};

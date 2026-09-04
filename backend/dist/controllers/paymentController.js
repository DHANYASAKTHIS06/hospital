"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPatientPaymentStatus = exports.updatePaymentStatus = void 0;
const Bill_1 = require("../models/Bill");
const Patient_1 = require("../models/Patient");
const socketService_1 = require("../services/socketService");
const updatePaymentStatus = async (req, res) => {
    try {
        // ADMIN ONLY
        const { billId } = req.params;
        const { payment_status, advance_amount } = req.body;
        const bill = await Bill_1.Bill.findOne({ bill_id: billId });
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
        }
        else if (payment_status === 'UNPAID') {
            bill.payment_status = 'UNPAID';
            bill.advance_amount = 0;
            bill.remaining_amount = bill.total_amount;
        }
        else if (payment_status === 'ADVANCE') {
            bill.payment_status = 'ADVANCE';
            if (bill.advance_amount <= 0) {
                bill.advance_amount = Math.round(bill.total_amount / 2); // Default to half if unspecified
                bill.remaining_amount = bill.total_amount - bill.advance_amount;
            }
        }
        await bill.save();
        const patient = await Patient_1.Patient.findOne({ patient_id: bill.patient_id });
        const payload = {
            ...bill.toObject(),
            patient_name: patient ? patient.name : 'Unknown',
            room_number: patient ? patient.room_number : 'N/A',
        };
        (0, socketService_1.emitToPatient)(bill.patient_id, 'payment_status_updated', payload);
        (0, socketService_1.emitToAdmin)('payment_status_updated', payload);
        return res.status(200).json({
            message: 'Payment status updated successfully',
            bill: payload,
        });
    }
    catch (error) {
        console.error('Update Payment Status Error:', error);
        return res.status(500).json({ message: 'Error updating payment status.' });
    }
};
exports.updatePaymentStatus = updatePaymentStatus;
const getPatientPaymentStatus = async (req, res) => {
    try {
        const patient_id = req.user?.patient_id;
        if (!patient_id) {
            return res.status(403).json({ message: 'Patient identity missing.' });
        }
        const bills = await Bill_1.Bill.find({ patient_id }).sort({ createdAt: -1 });
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
    }
    catch (error) {
        console.error('Get Patient Payment Status Error:', error);
        return res.status(500).json({ message: 'Error retrieving payment status.' });
    }
};
exports.getPatientPaymentStatus = getPatientPaymentStatus;

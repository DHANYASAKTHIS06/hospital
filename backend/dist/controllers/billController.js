"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllBillsAdmin = exports.getPatientBills = exports.generateBill = void 0;
const Bill_1 = require("../models/Bill");
const FoodOrder_1 = require("../models/FoodOrder");
const OrderItem_1 = require("../models/OrderItem");
const Patient_1 = require("../models/Patient");
const Counter_1 = require("../models/Counter");
const socketService_1 = require("../services/socketService");
const generateBill = async (req, res) => {
    try {
        const { patient_id, billing_period, advance_amount } = req.body;
        if (!patient_id) {
            return res.status(400).json({ message: 'Patient ID is required.' });
        }
        const patient = await Patient_1.Patient.findOne({ patient_id });
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found.' });
        }
        // Find all non-cancelled orders for this patient that are not yet billed
        const existingBills = await Bill_1.Bill.find({ patient_id });
        const billedOrderIds = new Set();
        existingBills.forEach((b) => b.orders_included.forEach((id) => billedOrderIds.add(id)));
        const unbilledOrders = await FoodOrder_1.FoodOrder.find({
            patient_id,
            order_status: { $ne: 'CANCELLED' },
            order_id: { $nin: Array.from(billedOrderIds) },
        });
        if (unbilledOrders.length === 0) {
            return res.status(400).json({ message: 'No unbilled orders found for this patient.' });
        }
        const total_amount = unbilledOrders.reduce((sum, o) => sum + o.total_amount, 0);
        const advance = Number(advance_amount) || 0;
        const remaining_amount = Math.max(0, total_amount - advance);
        let payment_status = 'UNPAID';
        if (advance >= total_amount && total_amount > 0) {
            payment_status = 'PAID';
        }
        else if (advance > 0 && advance < total_amount) {
            payment_status = 'ADVANCE';
        }
        const year = new Date().getFullYear();
        const seq = await (0, Counter_1.getNextSequenceValue)(`bill_id_${year}`);
        const formattedSeq = String(seq).padStart(4, '0');
        const bill_id = `B${year}${formattedSeq}`;
        const now = new Date();
        const billing_date = now.toLocaleDateString('en-GB');
        // Default due date = 15 days from today
        const due = new Date();
        due.setDate(due.getDate() + 15);
        const due_date = due.toLocaleDateString('en-GB');
        const orders_included = unbilledOrders.map((o) => o.order_id);
        const newBill = await Bill_1.Bill.create({
            bill_id,
            patient_id,
            billing_date,
            billing_period: billing_period || `${now.toLocaleString('default', { month: 'long' })} ${year}`,
            total_amount,
            advance_amount: advance,
            remaining_amount,
            payment_status,
            due_date,
            orders_included,
        });
        (0, socketService_1.emitToPatient)(patient_id, 'payment_status_updated', newBill);
        (0, socketService_1.emitToAdmin)('payment_status_updated', newBill);
        return res.status(201).json({
            message: 'Bill generated successfully',
            bill: newBill,
        });
    }
    catch (error) {
        console.error('Generate Bill Error:', error);
        return res.status(500).json({ message: 'Error generating bill.' });
    }
};
exports.generateBill = generateBill;
const getPatientBills = async (req, res) => {
    try {
        const patient_id = req.user?.patient_id;
        if (!patient_id) {
            return res.status(403).json({ message: 'Patient identity missing.' });
        }
        const bills = await Bill_1.Bill.find({ patient_id }).sort({ createdAt: -1 });
        const enrichedBills = await Promise.all(bills.map(async (bill) => {
            const orders = await FoodOrder_1.FoodOrder.find({ order_id: { $in: bill.orders_included } });
            const ordersWithItems = await Promise.all(orders.map(async (o) => {
                const items = await OrderItem_1.OrderItem.find({ order_id: o.order_id });
                return { ...o.toObject(), items };
            }));
            return {
                ...bill.toObject(),
                orders: ordersWithItems,
            };
        }));
        return res.status(200).json(enrichedBills);
    }
    catch (error) {
        console.error('Get Patient Bills Error:', error);
        return res.status(500).json({ message: 'Error fetching bills.' });
    }
};
exports.getPatientBills = getPatientBills;
const getAllBillsAdmin = async (req, res) => {
    try {
        const bills = await Bill_1.Bill.find().sort({ createdAt: -1 });
        const patients = await Patient_1.Patient.find();
        const patientMap = new Map(patients.map((p) => [p.patient_id, p]));
        const enrichedBills = await Promise.all(bills.map(async (bill) => {
            const patient = patientMap.get(bill.patient_id);
            const orders = await FoodOrder_1.FoodOrder.find({ order_id: { $in: bill.orders_included } });
            const ordersWithItems = await Promise.all(orders.map(async (o) => {
                const items = await OrderItem_1.OrderItem.find({ order_id: o.order_id });
                return { ...o.toObject(), items };
            }));
            return {
                ...bill.toObject(),
                patient_name: patient ? patient.name : 'Unknown',
                room_number: patient ? patient.room_number : 'N/A',
                orders: ordersWithItems,
            };
        }));
        return res.status(200).json(enrichedBills);
    }
    catch (error) {
        console.error('Get Admin Bills Error:', error);
        return res.status(500).json({ message: 'Error fetching bills for admin.' });
    }
};
exports.getAllBillsAdmin = getAllBillsAdmin;

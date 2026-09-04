"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoomFoodRecords = exports.getFoodRecords = exports.getPatientById = exports.getPatientsList = exports.getAdminDashboardStats = void 0;
const Patient_1 = require("../models/Patient");
const FoodOrder_1 = require("../models/FoodOrder");
const OrderItem_1 = require("../models/OrderItem");
const Bill_1 = require("../models/Bill");
const getAdminDashboardStats = async (req, res) => {
    try {
        const totalPatients = await Patient_1.Patient.countDocuments();
        const pendingOrders = await FoodOrder_1.FoodOrder.countDocuments({ order_status: 'PENDING' });
        const acceptedOrders = await FoodOrder_1.FoodOrder.countDocuments({ order_status: 'ACCEPTED' });
        const todayStr = new Date().toLocaleDateString('en-GB');
        const todaysOrdersDocs = await FoodOrder_1.FoodOrder.find({ order_date: todayStr });
        const todayOrdersCount = todaysOrdersDocs.length;
        const todaysRevenue = todaysOrdersDocs
            .filter((o) => o.order_status !== 'CANCELLED')
            .reduce((acc, o) => acc + o.total_amount, 0);
        const pendingPaymentsCount = await Bill_1.Bill.countDocuments({
            payment_status: { $in: ['UNPAID', 'ADVANCE'] },
        });
        const recentPendingOrders = await FoodOrder_1.FoodOrder.find({ order_status: 'PENDING' })
            .sort({ createdAt: -1 })
            .limit(10);
        const patients = await Patient_1.Patient.find();
        const patientMap = new Map(patients.map((p) => [p.patient_id, p]));
        const enrichedPendingOrders = await Promise.all(recentPendingOrders.map(async (order) => {
            const items = await OrderItem_1.OrderItem.find({ order_id: order.order_id });
            const patient = patientMap.get(order.patient_id);
            return {
                ...order.toObject(),
                patient_name: patient ? patient.name : 'Unknown',
                room_number: patient ? patient.room_number : 'N/A',
                items,
            };
        }));
        return res.status(200).json({
            totalPatients,
            pendingOrders,
            acceptedOrders,
            todayOrdersCount,
            todaysRevenue,
            pendingPaymentsCount,
            recentPendingOrders: enrichedPendingOrders,
        });
    }
    catch (error) {
        console.error('Admin Dashboard Stats Error:', error);
        return res.status(500).json({ message: 'Error retrieving dashboard stats.' });
    }
};
exports.getAdminDashboardStats = getAdminDashboardStats;
const getPatientsList = async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};
        if (search) {
            const regex = new RegExp(String(search), 'i');
            query = {
                $or: [
                    { patient_id: regex },
                    { name: regex },
                    { room_number: regex },
                    { mobile: regex },
                ],
            };
        }
        const patients = await Patient_1.Patient.find(query).select('-password_hash').sort({ createdAt: -1 });
        return res.status(200).json(patients);
    }
    catch (error) {
        console.error('Get Patients List Error:', error);
        return res.status(500).json({ message: 'Error fetching patients list.' });
    }
};
exports.getPatientsList = getPatientsList;
const getPatientById = async (req, res) => {
    try {
        const { patientId } = req.params;
        const patient = await Patient_1.Patient.findOne({ patient_id: patientId }).select('-password_hash');
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found.' });
        }
        return res.status(200).json(patient);
    }
    catch (error) {
        console.error('Get Patient By ID Error:', error);
        return res.status(500).json({ message: 'Error fetching patient details.' });
    }
};
exports.getPatientById = getPatientById;
const getFoodRecords = async (req, res) => {
    try {
        const { date, patient_id, room_number, meal_type } = req.query;
        let query = {};
        if (date)
            query.order_date = String(date);
        if (patient_id)
            query.patient_id = String(patient_id).toUpperCase();
        if (meal_type)
            query.meal_type = String(meal_type);
        const orders = await FoodOrder_1.FoodOrder.find(query).sort({ createdAt: -1 });
        const patients = await Patient_1.Patient.find();
        const patientMap = new Map(patients.map((p) => [p.patient_id, p]));
        let enrichedRecords = await Promise.all(orders.map(async (order) => {
            const items = await OrderItem_1.OrderItem.find({ order_id: order.order_id });
            const patient = patientMap.get(order.patient_id);
            return {
                ...order.toObject(),
                patient_name: patient ? patient.name : 'Unknown',
                room_number: patient ? patient.room_number : 'N/A',
                items,
            };
        }));
        if (room_number) {
            enrichedRecords = enrichedRecords.filter((r) => r.room_number.toLowerCase() === String(room_number).toLowerCase());
        }
        return res.status(200).json(enrichedRecords);
    }
    catch (error) {
        console.error('Get Food Records Error:', error);
        return res.status(500).json({ message: 'Error fetching food records.' });
    }
};
exports.getFoodRecords = getFoodRecords;
const getRoomFoodRecords = async (req, res) => {
    try {
        const { date, room_number } = req.query;
        if (!date || !room_number) {
            return res.status(400).json({ message: 'Date and Room Number are required.' });
        }
        const patientsInRoom = await Patient_1.Patient.find({
            room_number: String(room_number).trim(),
        });
        if (patientsInRoom.length === 0) {
            return res.status(200).json({
                date: String(date),
                room_number: String(room_number),
                patients: [],
            });
        }
        const patientIds = patientsInRoom.map((p) => p.patient_id);
        const orders = await FoodOrder_1.FoodOrder.find({
            order_date: String(date),
            patient_id: { $in: patientIds },
            order_status: { $ne: 'CANCELLED' },
        });
        const resultPatients = await Promise.all(patientsInRoom.map(async (patient) => {
            const patientOrders = orders.filter((o) => o.patient_id === patient.patient_id);
            const orderDetails = await Promise.all(patientOrders.map(async (o) => {
                const items = await OrderItem_1.OrderItem.find({ order_id: o.order_id });
                return {
                    order_id: o.order_id,
                    meal_type: o.meal_type,
                    items,
                    total_amount: o.total_amount,
                };
            }));
            const totalSpent = orderDetails.reduce((sum, o) => sum + o.total_amount, 0);
            return {
                patient_id: patient.patient_id,
                name: patient.name,
                room_number: patient.room_number,
                orders: orderDetails,
                total_day_amount: totalSpent,
            };
        }));
        return res.status(200).json({
            date: String(date),
            room_number: String(room_number),
            patients: resultPatients,
        });
    }
    catch (error) {
        console.error('Get Room Food Records Error:', error);
        return res.status(500).json({ message: 'Error fetching room food records.' });
    }
};
exports.getRoomFoodRecords = getRoomFoodRecords;

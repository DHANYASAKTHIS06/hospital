"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoomFoodRecords = exports.getFoodRecords = exports.getPatientById = exports.getPatientsList = exports.getAdminDashboardStats = void 0;
const Patient_1 = require("../models/Patient");
const FoodOrder_1 = require("../models/FoodOrder");
const OrderItem_1 = require("../models/OrderItem");
const Bill_1 = require("../models/Bill");
const MenuItem_1 = require("../models/MenuItem");
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
        // Food Items to Prepare aggregation
        // Aggregates quantities from all ACCEPTED and DELIVERY CONFIRMATION PENDING orders
        let allMenuItems = await MenuItem_1.MenuItem.find().sort({ menu_id: 1 });
        if (!allMenuItems || allMenuItems.length === 0) {
            const { seedDatabase } = await Promise.resolve().then(() => __importStar(require('../seed/seedData')));
            await seedDatabase();
            allMenuItems = await MenuItem_1.MenuItem.find().sort({ menu_id: 1 });
        }
        const activeAcceptedOrders = await FoodOrder_1.FoodOrder.find({
            order_status: {
                $in: ['ACCEPTED', 'DELIVERY CONFIRMATION PENDING', 'Accepted', 'Delivery Confirmation Pending'],
            },
        });
        const activeOrderIds = activeAcceptedOrders.map((o) => o.order_id);
        const activeOrderItems = await OrderItem_1.OrderItem.find({ order_id: { $in: activeOrderIds } });
        const quantityByMenuId = new Map();
        const quantityByName = new Map();
        for (const item of activeOrderItems) {
            if (item.menu_id !== undefined && item.menu_id !== null) {
                const key = String(item.menu_id);
                quantityByMenuId.set(key, (quantityByMenuId.get(key) || 0) + item.quantity);
            }
            if (item.item_name_snapshot) {
                const key = item.item_name_snapshot.trim().toLowerCase();
                quantityByName.set(key, (quantityByName.get(key) || 0) + item.quantity);
            }
        }
        const foodItemsToPrepare = allMenuItems.map((item) => {
            const byId = quantityByMenuId.get(String(item.menu_id)) || 0;
            const byName = quantityByName.get(item.item_name.trim().toLowerCase()) || 0;
            const totalQty = Math.max(byId, byName);
            return {
                menu_id: item.menu_id,
                item_name: item.item_name,
                category: item.category,
                portion_size: item.quantity,
                total_preparation_quantity: totalQty,
            };
        });
        return res.status(200).json({
            totalPatients,
            pendingOrders,
            acceptedOrders,
            todayOrdersCount,
            todaysRevenue,
            pendingPaymentsCount,
            recentPendingOrders: enrichedPendingOrders,
            foodItemsToPrepare,
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

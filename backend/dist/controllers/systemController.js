"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleOrderingLock = exports.getSystemStatus = exports.getOrderingLockedStatus = void 0;
const SystemSetting_1 = require("../models/SystemSetting");
const socketService_1 = require("../services/socketService");
const getOrderingLockedStatus = async () => {
    try {
        const setting = await SystemSetting_1.SystemSetting.findOne({ key: 'is_ordering_locked' });
        return setting ? Boolean(setting.value) : false;
    }
    catch (err) {
        console.error('Error reading ordering lock setting:', err);
        return false;
    }
};
exports.getOrderingLockedStatus = getOrderingLockedStatus;
const getSystemStatus = async (req, res) => {
    try {
        const is_ordering_locked = await (0, exports.getOrderingLockedStatus)();
        return res.status(200).json({ is_ordering_locked });
    }
    catch (error) {
        console.error('Get System Status Error:', error);
        return res.status(500).json({ message: 'Error retrieving system status.' });
    }
};
exports.getSystemStatus = getSystemStatus;
const toggleOrderingLock = async (req, res) => {
    try {
        const { is_ordering_locked } = req.body;
        let targetValue;
        if (typeof is_ordering_locked === 'boolean') {
            targetValue = is_ordering_locked;
        }
        else {
            const current = await (0, exports.getOrderingLockedStatus)();
            targetValue = !current;
        }
        await SystemSetting_1.SystemSetting.findOneAndUpdate({ key: 'is_ordering_locked' }, { value: targetValue }, { upsert: true, new: true });
        // Broadcast to all socket clients (patients & admins)
        try {
            const io = (0, socketService_1.getIO)();
            io.emit('ordering_status_changed', { is_ordering_locked: targetValue });
        }
        catch (e) {
            console.warn('Socket emit warning:', e);
        }
        return res.status(200).json({
            message: `Ordering has been ${targetValue ? 'LOCKED (Closed)' : 'UNLOCKED (Open)'}.`,
            is_ordering_locked: targetValue,
        });
    }
    catch (error) {
        console.error('Toggle Ordering Lock Error:', error);
        return res.status(500).json({ message: 'Error updating ordering lock status.' });
    }
};
exports.toggleOrderingLock = toggleOrderingLock;

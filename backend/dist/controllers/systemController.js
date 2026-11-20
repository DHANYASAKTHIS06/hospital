"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleOrderingLock = exports.getSystemStatus = exports.getOrderingLockedStatus = exports.endAnnouncement = exports.publishAnnouncement = exports.getAnnouncement = exports.getActiveAnnouncementValue = void 0;
const SystemSetting_1 = require("../models/SystemSetting");
const socketService_1 = require("../services/socketService");
// ─── ANNOUNCEMENT HELPERS ────────────────────────────────────────────────────
/**
 * Returns the currently active announcement object, or null if none is active.
 */
const getActiveAnnouncementValue = async () => {
    try {
        const setting = await SystemSetting_1.SystemSetting.findOne({ key: 'active_announcement' });
        if (!setting || !setting.value?.is_active)
            return null;
        return setting.value;
    }
    catch {
        return null;
    }
};
exports.getActiveAnnouncementValue = getActiveAnnouncementValue;
/**
 * GET /admin/announcement  — returns current active announcement (admin view, includes status)
 * GET /patient/announcement — same endpoint, same data
 */
const getAnnouncement = async (req, res) => {
    try {
        const setting = await SystemSetting_1.SystemSetting.findOne({ key: 'active_announcement' });
        if (!setting || !setting.value?.is_active) {
            return res.status(200).json({ is_active: false, text: '', published_at: null });
        }
        return res.status(200).json(setting.value);
    }
    catch (error) {
        console.error('Get Announcement Error:', error);
        return res.status(500).json({ message: 'Error retrieving announcement.' });
    }
};
exports.getAnnouncement = getAnnouncement;
/**
 * POST /admin/announcement/publish  — publish or update active announcement
 * Body: { text: string }
 */
const publishAnnouncement = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || typeof text !== 'string' || !text.trim()) {
            return res.status(400).json({ message: 'Announcement text is required.' });
        }
        const announcementValue = {
            is_active: true,
            text: text.trim(),
            published_at: new Date().toISOString(),
        };
        await SystemSetting_1.SystemSetting.findOneAndUpdate({ key: 'active_announcement' }, { value: announcementValue }, { upsert: true, new: true });
        // Broadcast to ALL connected clients (patients + admin)
        try {
            const io = (0, socketService_1.getIO)();
            io.emit('announcement_updated', announcementValue);
        }
        catch (e) {
            console.warn('Socket emit warning (announcement):', e);
        }
        return res.status(200).json({
            message: 'Announcement published successfully.',
            announcement: announcementValue,
        });
    }
    catch (error) {
        console.error('Publish Announcement Error:', error);
        return res.status(500).json({ message: 'Error publishing announcement.' });
    }
};
exports.publishAnnouncement = publishAnnouncement;
/**
 * POST /admin/announcement/end  — deactivate the current announcement
 */
const endAnnouncement = async (req, res) => {
    try {
        const announcementValue = {
            is_active: false,
            text: '',
            published_at: null,
        };
        await SystemSetting_1.SystemSetting.findOneAndUpdate({ key: 'active_announcement' }, { value: announcementValue }, { upsert: true, new: true });
        // Broadcast to ALL clients so patient dashboards clear immediately
        try {
            const io = (0, socketService_1.getIO)();
            io.emit('announcement_updated', announcementValue);
        }
        catch (e) {
            console.warn('Socket emit warning (end announcement):', e);
        }
        return res.status(200).json({ message: 'Announcement ended successfully.', announcement: announcementValue });
    }
    catch (error) {
        console.error('End Announcement Error:', error);
        return res.status(500).json({ message: 'Error ending announcement.' });
    }
};
exports.endAnnouncement = endAnnouncement;
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

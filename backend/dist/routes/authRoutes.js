"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const router = (0, express_1.Router)();
router.post('/patient/signup', authController_1.patientSignup);
router.post('/patient/login', authController_1.patientLogin);
router.post('/admin/login', authController_1.adminLogin);
router.post('/logout', (req, res) => {
    return res.status(200).json({ message: 'Logged out successfully' });
});
exports.default = router;

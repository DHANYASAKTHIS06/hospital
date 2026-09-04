"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const patientController_1 = require("../controllers/patientController");
const menuController_1 = require("../controllers/menuController");
const orderController_1 = require("../controllers/orderController");
const billController_1 = require("../controllers/billController");
const paymentController_1 = require("../controllers/paymentController");
const router = (0, express_1.Router)();
// Apply auth middleware to all patient routes
router.use(auth_1.authenticateToken, auth_1.requirePatient);
router.get('/profile', patientController_1.getProfile);
router.get('/menu', menuController_1.getMenuItems);
router.post('/orders', orderController_1.createOrder);
router.get('/orders', orderController_1.getPatientOrders);
router.post('/orders/:orderId/confirm-delivery', orderController_1.patientConfirmDelivery);
// EXPLICIT REJECTION for any attempt by patient to cancel order
router.post('/orders/:orderId/cancel', (req, res) => {
    return res.status(403).json({
        message: 'Patients do not have permission to cancel orders. Only Admin can cancel.',
    });
});
router.get('/food-history', patientController_1.getFoodHistory);
router.get('/bills', billController_1.getPatientBills);
router.get('/payment-status', paymentController_1.getPatientPaymentStatus);
exports.default = router;

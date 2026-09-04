"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const adminController_1 = require("../controllers/adminController");
const menuController_1 = require("../controllers/menuController");
const orderController_1 = require("../controllers/orderController");
const billController_1 = require("../controllers/billController");
const paymentController_1 = require("../controllers/paymentController");
const router = (0, express_1.Router)();
// Apply auth middleware and requireAdmin to all admin routes
router.use(auth_1.authenticateToken, auth_1.requireAdmin);
router.get('/dashboard', adminController_1.getAdminDashboardStats);
// Order Management
router.get('/orders', orderController_1.getAllOrdersAdmin);
router.post('/orders/:orderId/accept', orderController_1.acceptOrder);
router.post('/orders/:orderId/cancel', orderController_1.cancelOrder);
router.post('/orders/:orderId/confirm-delivery', orderController_1.adminConfirmDelivery);
// Menu Management
router.get('/menu', menuController_1.getMenuItems);
router.post('/menu', menuController_1.addMenuItem);
router.put('/menu/:menuId', menuController_1.updateMenuItem);
router.delete('/menu/:menuId', menuController_1.deleteMenuItem);
// Patient Management
router.get('/patients', adminController_1.getPatientsList);
router.get('/patients/:patientId', adminController_1.getPatientById);
// Food Records & Room-wise view
router.get('/food-records', adminController_1.getFoodRecords);
router.get('/room-food-records', adminController_1.getRoomFoodRecords);
// Bill & Payment Management
router.get('/bills', billController_1.getAllBillsAdmin);
router.post('/bills/generate', billController_1.generateBill);
router.get('/payments', billController_1.getAllBillsAdmin);
router.put('/payments/:billId/status', paymentController_1.updatePaymentStatus);
exports.default = router;

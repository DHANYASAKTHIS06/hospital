import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import {
  getAdminDashboardStats,
  getPatientsList,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  rechargePatientBalance,
  adjustPatientBalance,
  deductPatientBalance,
  getFoodRecords,
  getRoomFoodRecords,
  getKitchenReport,
} from '../controllers/adminController';
import {
  getMenuItems,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from '../controllers/menuController';
import {
  getAllOrdersAdmin,
  acceptOrder,
  cancelOrder,
  adminConfirmDelivery,
  clearActiveOrdersView,
} from '../controllers/orderController';
import { generateBill, getAllBillsAdmin } from '../controllers/billController';
import { updatePaymentStatus } from '../controllers/paymentController';
import { getSystemStatus, toggleOrderingLock } from '../controllers/systemController';

const router = Router();

// Apply auth middleware and requireAdmin to all admin routes
router.use(authenticateToken, requireAdmin);

router.get('/dashboard', getAdminDashboardStats);
router.get('/system-status', getSystemStatus);
router.post('/toggle-ordering-lock', toggleOrderingLock);

// Order Management
router.get('/orders', getAllOrdersAdmin);
router.post('/orders/clear-active-view', clearActiveOrdersView);
router.post('/orders/:orderId/accept', acceptOrder);
router.post('/orders/:orderId/cancel', cancelOrder);
router.post('/orders/:orderId/confirm-delivery', adminConfirmDelivery);

// Menu Management
router.get('/menu', getMenuItems);
router.post('/menu', addMenuItem);
router.put('/menu/:menuId', updateMenuItem);
router.delete('/menu/:menuId', deleteMenuItem);

// Patient Management & Amount Adjustment
router.get('/patients', getPatientsList);
router.post('/patients', createPatient);
router.get('/patients/:patientId', getPatientById);
router.put('/patients/:patientId', updatePatient);
router.patch('/patients/:patientId', updatePatient);
router.post('/patients/:patientId/recharge', rechargePatientBalance);
router.post('/patients/:patientId/adjust-balance', adjustPatientBalance);
router.post('/patients/:patientId/deduct', deductPatientBalance);
router.post('/patients/:patientId/deduct-balance', deductPatientBalance);
router.patch('/patients/:patientId/balance', adjustPatientBalance);
router.put('/patients/:patientId/balance', adjustPatientBalance);
router.delete('/patients/:patientId', deletePatient);

// Food Records & Room-wise view & Kitchen Report
router.get('/food-records', getFoodRecords);
router.get('/room-food-records', getRoomFoodRecords);
router.get('/kitchen-report', getKitchenReport);

// Bill & Payment Management
router.get('/bills', getAllBillsAdmin);
router.post('/bills/generate', generateBill);
router.get('/payments', getAllBillsAdmin);
router.put('/payments/:billId/status', updatePaymentStatus);

export default router;

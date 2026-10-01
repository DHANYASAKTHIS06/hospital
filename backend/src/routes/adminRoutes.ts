import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import {
  getAdminDashboardStats,
  getPatientsList,
  getPatientById,
  createPatient,
  deletePatient,
  rechargePatientBalance,
  getFoodRecords,
  getRoomFoodRecords,
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
router.post('/orders/:orderId/accept', acceptOrder);
router.post('/orders/:orderId/cancel', cancelOrder);
router.post('/orders/:orderId/confirm-delivery', adminConfirmDelivery);

// Menu Management
router.get('/menu', getMenuItems);
router.post('/menu', addMenuItem);
router.put('/menu/:menuId', updateMenuItem);
router.delete('/menu/:menuId', deleteMenuItem);

// Patient Management
router.get('/patients', getPatientsList);
router.post('/patients', createPatient);
router.get('/patients/:patientId', getPatientById);
router.post('/patients/:patientId/recharge', rechargePatientBalance);
router.delete('/patients/:patientId', deletePatient);

// Food Records & Room-wise view
router.get('/food-records', getFoodRecords);
router.get('/room-food-records', getRoomFoodRecords);

// Bill & Payment Management
router.get('/bills', getAllBillsAdmin);
router.post('/bills/generate', generateBill);
router.get('/payments', getAllBillsAdmin);
router.put('/payments/:billId/status', updatePaymentStatus);

export default router;

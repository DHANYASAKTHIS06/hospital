import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import {
  getAdminDashboardStats,
  getPatientsList,
  getPatientById,
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

const router = Router();

// Apply auth middleware and requireAdmin to all admin routes
router.use(authenticateToken, requireAdmin);

router.get('/dashboard', getAdminDashboardStats);

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
router.get('/patients/:patientId', getPatientById);

// Food Records & Room-wise view
router.get('/food-records', getFoodRecords);
router.get('/room-food-records', getRoomFoodRecords);

// Bill & Payment Management
router.get('/bills', getAllBillsAdmin);
router.post('/bills/generate', generateBill);
router.get('/payments', getAllBillsAdmin);
router.put('/payments/:billId/status', updatePaymentStatus);

export default router;

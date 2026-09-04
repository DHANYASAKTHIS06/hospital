import { Router } from 'express';
import { authenticateToken, requirePatient } from '../middleware/auth';
import { getProfile, getFoodHistory } from '../controllers/patientController';
import { getMenuItems } from '../controllers/menuController';
import { createOrder, getPatientOrders, patientConfirmDelivery } from '../controllers/orderController';
import { getPatientBills } from '../controllers/billController';
import { getPatientPaymentStatus } from '../controllers/paymentController';

const router = Router();

// Apply auth middleware to all patient routes
router.use(authenticateToken, requirePatient);

router.get('/profile', getProfile);
router.get('/menu', getMenuItems);

router.post('/orders', createOrder);
router.get('/orders', getPatientOrders);
router.post('/orders/:orderId/confirm-delivery', patientConfirmDelivery);

// EXPLICIT REJECTION for any attempt by patient to cancel order
router.post('/orders/:orderId/cancel', (req, res) => {
  return res.status(403).json({
    message: 'Patients do not have permission to cancel orders. Only Admin can cancel.',
  });
});

router.get('/food-history', getFoodHistory);
router.get('/bills', getPatientBills);
router.get('/payment-status', getPatientPaymentStatus);

export default router;

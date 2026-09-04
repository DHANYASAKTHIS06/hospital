import { Router } from 'express';
import { patientSignup, patientLogin, adminLogin } from '../controllers/authController';

const router = Router();

router.post('/patient/signup', patientSignup);
router.post('/patient/login', patientLogin);
router.post('/admin/login', adminLogin);
router.post('/logout', (req, res) => {
  return res.status(200).json({ message: 'Logged out successfully' });
});

export default router;

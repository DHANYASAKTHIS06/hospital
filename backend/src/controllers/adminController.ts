import { Request, Response } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Patient } from '../models/Patient';
import { FoodOrder } from '../models/FoodOrder';
import { OrderItem } from '../models/OrderItem';
import { Bill } from '../models/Bill';
import { MenuItem } from '../models/MenuItem';
import { getNextSequenceValue } from '../models/Counter';
import { getOrderingLockedStatus } from './systemController';
import { emitToPatient, emitToAdmin } from '../services/socketService';

/**
 * Helper to parse any valid numeric amount from number or string (including currency symbols/commas).
 * Removes any restrictions so amounts like ₹125, ₹275, ₹1,235, ₹5,250 are fully valid.
 */
export const parseAdjustmentAmount = (val: any): number | null => {
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'number') {
    return !isNaN(val) && isFinite(val) ? val : null;
  }
  if (typeof val === 'string') {
    const cleaned = val.replace(/[₹$,\s]/g, '').trim();
    if (!cleaned) return null;
    const parsed = Number(cleaned);
    return !isNaN(parsed) && isFinite(parsed) ? parsed : null;
  }
  return null;
};


export const getAdminDashboardStats = async (req: Request, res: Response) => {
  try {
    const is_ordering_locked = await getOrderingLockedStatus();
    const totalPatients = await Patient.countDocuments();
    const activeOrdersCount = await FoodOrder.countDocuments({
      order_status: { $nin: ['DELIVERED', 'CANCELLED'] },
      is_cleared_from_active_view: { $ne: true },
    });

    const todayStr = new Date().toLocaleDateString('en-GB');
    const todaysOrdersDocs = await FoodOrder.find({ order_date: todayStr });
    const todayOrdersCount = todaysOrdersDocs.length;

    const todaysRevenue = todaysOrdersDocs
      .filter((o) => o.order_status !== 'CANCELLED')
      .reduce((acc, o) => acc + o.total_amount, 0);

    const pendingPaymentsCount = await Bill.countDocuments({
      payment_status: { $in: ['UNPAID', 'ADVANCE'] },
    });

    const recentActiveOrders = await FoodOrder.find({
      order_status: { $nin: ['DELIVERED', 'CANCELLED'] },
      is_cleared_from_active_view: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .limit(10);

    const patients = await Patient.find();
    const patientMap = new Map(patients.map((p) => [p.patient_id, p]));

    const enrichedRecentActiveOrders = await Promise.all(
      recentActiveOrders.map(async (order) => {
        const items = await OrderItem.find({ order_id: order.order_id });
        const patient = patientMap.get(order.patient_id);
        return {
          ...order.toObject(),
          patient_name: patient ? patient.name : 'Unknown',
          room_number: patient ? patient.room_number : 'N/A',
          items,
        };
      })
    );

    // Food Items to Prepare aggregation:
    // Aggregates quantities from active (non-delivered, non-cancelled, non-cleared) orders
    // Common Menu items are automatically split into Breakfast, Lunch, or Dinner based on order's meal_type
    let allMenuItems = await MenuItem.find().sort({ menu_id: 1 });
    if (!allMenuItems || allMenuItems.length === 0) {
      const { seedDatabase } = await import('../seed/seedData');
      await seedDatabase();
      allMenuItems = await MenuItem.find().sort({ menu_id: 1 });
    }

    const activeOrders = await FoodOrder.find({
      order_status: { $nin: ['DELIVERED', 'CANCELLED'] },
      is_cleared_from_active_view: { $ne: true },
    });

    const activeOrderIds = activeOrders.map((o) => o.order_id);
    const activeOrderItems = await OrderItem.find({ order_id: { $in: activeOrderIds } });

    // Map order_id -> meal_type
    const orderMealMap = new Map<string, string>();
    for (const o of activeOrders) {
      orderMealMap.set(o.order_id, o.meal_type || 'Breakfast');
    }

    // Function to standardize meal name & key
    const normalizeMeal = (raw: string): { mealName: string; mealKey: string } => {
      const trimmed = (raw || 'Breakfast').trim();
      if (/^breakfast$/i.test(trimmed)) return { mealName: 'Breakfast', mealKey: 'BREAKFAST' };
      if (/^lunch$/i.test(trimmed)) return { mealName: 'Lunch', mealKey: 'LUNCH' };
      if (/^dinner$/i.test(trimmed)) return { mealName: 'Dinner', mealKey: 'DINNER' };
      if (/^tea/i.test(trimmed)) return { mealName: 'Tea / Milk', mealKey: 'TEA / MILK' };
      if (/^snack/i.test(trimmed)) return { mealName: 'Snacks', mealKey: 'SNACKS' };
      return { mealName: trimmed, mealKey: trimmed.toUpperCase() };
    };

    // Maps to aggregate quantities by (meal_key, menu_id) or (meal_key, item_name)
    const qtyByMealAndMenuId = new Map<string, number>();
    const qtyByMealAndName = new Map<string, number>();

    for (const item of activeOrderItems) {
      const rawMeal = orderMealMap.get(item.order_id) || 'Breakfast';
      const { mealKey } = normalizeMeal(rawMeal);

      if (item.menu_id !== undefined && item.menu_id !== null) {
        const key = `${mealKey}::${item.menu_id}`;
        qtyByMealAndMenuId.set(key, (qtyByMealAndMenuId.get(key) || 0) + item.quantity);
      }
      if (item.item_name_snapshot) {
        const key = `${mealKey}::${item.item_name_snapshot.trim().toLowerCase()}`;
        qtyByMealAndName.set(key, (qtyByMealAndName.get(key) || 0) + item.quantity);
      }
    }

    const foodItemsToPrepare: any[] = [];

    for (const item of allMenuItems) {
      const origCategory = (item.category || '').trim().toUpperCase();

      if (origCategory === 'COMMON MENU') {
        // Common Menu items are split into Breakfast, Lunch, and Dinner
        const commonMealSessions = ['Breakfast', 'Lunch', 'Dinner'];
        for (const meal of commonMealSessions) {
          const mealKey = meal.toUpperCase();
          const byId = qtyByMealAndMenuId.get(`${mealKey}::${item.menu_id}`) || 0;
          const byName = qtyByMealAndName.get(`${mealKey}::${item.item_name.trim().toLowerCase()}`) || 0;
          const totalQty = Math.max(byId, byName);

          foodItemsToPrepare.push({
            menu_id: item.menu_id,
            item_name: item.item_name,
            meal_type: meal,
            category: mealKey, // 'BREAKFAST', 'LUNCH', 'DINNER'
            portion_size: item.quantity,
            total_preparation_quantity: totalQty,
          });
        }
      } else {
        // Items with specific category (e.g. BREAKFAST, LUNCH, DINNER, TEA / MILK, SNACKS)
        let targetMeal = 'Breakfast';
        if (origCategory === 'LUNCH') targetMeal = 'Lunch';
        else if (origCategory === 'DINNER') targetMeal = 'Dinner';
        else if (origCategory === 'TEA / MILK') targetMeal = 'Tea / Milk';
        else if (origCategory === 'SNACKS') targetMeal = 'Snacks';
        else if (origCategory === 'BREAKFAST') targetMeal = 'Breakfast';

        const mealKey = targetMeal.toUpperCase();
        const byId = qtyByMealAndMenuId.get(`${mealKey}::${item.menu_id}`) || 0;
        const byName = qtyByMealAndName.get(`${mealKey}::${item.item_name.trim().toLowerCase()}`) || 0;
        const totalQty = Math.max(byId, byName);

        foodItemsToPrepare.push({
          menu_id: item.menu_id,
          item_name: item.item_name,
          meal_type: targetMeal,
          category: origCategory,
          portion_size: item.quantity,
          total_preparation_quantity: totalQty,
        });
      }
    }

    return res.status(200).json({
      is_ordering_locked,
      totalPatients,
      pendingOrders: 0,
      acceptedOrders: activeOrdersCount,
      activeOrdersCount,
      todayOrdersCount,
      todaysRevenue,
      pendingPaymentsCount,
      recentPendingOrders: enrichedRecentActiveOrders,
      recentActiveOrders: enrichedRecentActiveOrders,
      foodItemsToPrepare,
    });
  } catch (error: any) {
    console.error('Admin Dashboard Stats Error:', error);
    return res.status(500).json({ message: 'Error retrieving dashboard stats.' });
  }
};

export const getPatientsList = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    let query: any = {};

    if (search) {
      const regex = new RegExp(String(search), 'i');
      query = {
        $or: [
          { patient_id: regex },
          { name: regex },
          { room_number: regex },
          { mobile: regex },
        ],
      };
    }

    const patients = await Patient.find(query).select('-password_hash').sort({ createdAt: -1 });
    return res.status(200).json(patients);
  } catch (error: any) {
    console.error('Get Patients List Error:', error);
    return res.status(500).json({ message: 'Error fetching patients list.' });
  }
};

export const getPatientById = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const patient = await Patient.findOne({ patient_id: patientId }).select('-password_hash');
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' });
    }
    return res.status(200).json(patient);
  } catch (error: any) {
    console.error('Get Patient By ID Error:', error);
    return res.status(500).json({ message: 'Error fetching patient details.' });
  }
};

export const deletePatient = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const formattedId = String(patientId).toUpperCase().trim();

    const patient = await Patient.findOne({
      $or: [
        { patient_id: formattedId },
        { patient_id: String(patientId).trim() },
        ...(mongoose.isValidObjectId(patientId) ? [{ _id: patientId }] : []),
      ],
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient record not found.' });
    }

    await Patient.deleteOne({ _id: patient._id });

    return res.status(200).json({
      message: `Patient account "${patient.name}" (${patient.patient_id}) deleted successfully.`,
      patient_id: patient.patient_id,
    });
  } catch (error: any) {
    console.error('Delete Patient Error:', error);
    return res.status(500).json({ message: 'Error deleting patient record.' });
  }
};

export const getFoodRecords = async (req: Request, res: Response) => {
  try {
    const { date, patient_id, room_number, meal_type } = req.query;
    let query: any = {};

    if (date) query.order_date = String(date);
    if (patient_id) query.patient_id = String(patient_id).toUpperCase();
    if (meal_type) query.meal_type = String(meal_type);

    const orders = await FoodOrder.find(query).sort({ createdAt: -1 });
    const patients = await Patient.find();
    const patientMap = new Map(patients.map((p) => [p.patient_id, p]));

    let enrichedRecords = await Promise.all(
      orders.map(async (order) => {
        const items = await OrderItem.find({ order_id: order.order_id });
        const patient = patientMap.get(order.patient_id);
        return {
          ...order.toObject(),
          patient_name: patient ? patient.name : 'Unknown',
          room_number: patient ? patient.room_number : 'N/A',
          items,
        };
      })
    );

    if (room_number) {
      enrichedRecords = enrichedRecords.filter(
        (r) => r.room_number.toLowerCase() === String(room_number).toLowerCase()
      );
    }

    return res.status(200).json(enrichedRecords);
  } catch (error: any) {
    console.error('Get Food Records Error:', error);
    return res.status(500).json({ message: 'Error fetching food records.' });
  }
};

export const getRoomFoodRecords = async (req: Request, res: Response) => {
  try {
    const { date, room_number } = req.query;

    if (!date || !room_number) {
      return res.status(400).json({ message: 'Date and Room Number are required.' });
    }

    const patientsInRoom = await Patient.find({
      room_number: String(room_number).trim(),
    });

    if (patientsInRoom.length === 0) {
      return res.status(200).json({
        date: String(date),
        room_number: String(room_number),
        patients: [],
      });
    }

    const patientIds = patientsInRoom.map((p) => p.patient_id);

    const orders = await FoodOrder.find({
      order_date: String(date),
      patient_id: { $in: patientIds },
      order_status: { $ne: 'CANCELLED' },
    });

    const resultPatients = await Promise.all(
      patientsInRoom.map(async (patient) => {
        const patientOrders = orders.filter((o) => o.patient_id === patient.patient_id);
        const orderDetails = await Promise.all(
          patientOrders.map(async (o) => {
            const items = await OrderItem.find({ order_id: o.order_id });
            return {
              order_id: o.order_id,
              meal_type: o.meal_type,
              items,
              total_amount: o.total_amount,
            };
          })
        );

        const totalSpent = orderDetails.reduce((sum, o) => sum + o.total_amount, 0);

        return {
          patient_id: patient.patient_id,
          name: patient.name,
          room_number: patient.room_number,
          orders: orderDetails,
          total_day_amount: totalSpent,
        };
      })
    );

    return res.status(200).json({
      date: String(date),
      room_number: String(room_number),
      patients: resultPatients,
    });
  } catch (error: any) {
    console.error('Get Room Food Records Error:', error);
    return res.status(500).json({ message: 'Error fetching room food records.' });
  }
};

export const createPatient = async (req: Request, res: Response) => {
  try {
    const { patient_id: rawPatientId, name, age, address, room_number, mobile, password, advance_balance } = req.body;

    if (!name || !age || !address || !room_number || !mobile || !password) {
      return res.status(400).json({ message: 'Name, Age, Address, Room Number, Mobile, and Password are required.' });
    }

    if (password.length < 4) {
      return res.status(400).json({ message: 'Password must be at least 4 characters long.' });
    }

    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobile)) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number.' });
    }

    // Check if mobile number is already registered
    const existingMobile = await Patient.findOne({ mobile });
    if (existingMobile) {
      return res.status(400).json({ message: 'Mobile Number is already registered for another patient.' });
    }

    let finalPatientId = rawPatientId ? String(rawPatientId).toUpperCase().trim() : '';

    if (!finalPatientId) {
      const year = new Date().getFullYear();
      const seq = await getNextSequenceValue(`patient_id_${year}`);
      const formattedSeq = String(seq).padStart(4, '0');
      finalPatientId = `P${year}${formattedSeq}`;
    }

    const existingId = await Patient.findOne({ patient_id: finalPatientId });
    if (existingId) {
      return res.status(400).json({ message: `Patient ID "${finalPatientId}" already exists. Please use a unique Patient ID.` });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const parsedAdvance = parseAdjustmentAmount(advance_balance);
    const initialAdvance = parsedAdvance !== null && parsedAdvance >= 0 ? Math.round(parsedAdvance * 100) / 100 : 0;

    const newPatient = await Patient.create({
      patient_id: finalPatientId,
      name: name.trim(),
      age: Number(age),
      address: address.trim(),
      room_number: String(room_number).trim(),
      mobile: String(mobile).trim(),
      password_hash,
      advance_balance: initialAdvance,
    });

    return res.status(201).json({
      message: 'Patient account created successfully',
      patient: {
        _id: newPatient._id,
        patient_id: newPatient.patient_id,
        name: newPatient.name,
        age: newPatient.age,
        address: newPatient.address,
        room_number: newPatient.room_number,
        mobile: newPatient.mobile,
        advance_balance: newPatient.advance_balance,
        plain_password: password,
      },
    });
  } catch (error: any) {
    console.error('Create Patient Error:', error);
    return res.status(500).json({ message: 'Error creating patient account.', error: error.message });
  }
};

/**
 * Adjust patient advance balance (Admin Panel only).
 * Allows admin to add or deduct ANY valid amount (e.g. ₹125, ₹275, ₹1,235, ₹5,250, etc.).
 * Removes all restrictions to multiples of 50 or 100.
 * Supports positive/negative amount, action ('add' | 'deduct'), deduct_amount, and socket broadcasts.
 */
export const rechargePatientBalance = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const {
      amount,
      adjustment,
      recharge_amount,
      deduct_amount,
      deduction,
      action,
      type,
      operation,
    } = req.body;

    // Detect if this is explicitly a deduction action
    const isExplicitDeductAction =
      String(action || type || operation || '').toLowerCase().trim() === 'deduct' ||
      String(action || type || operation || '').toLowerCase().trim() === 'subtract' ||
      String(action || type || operation || '').toLowerCase().trim() === 'minus';

    // Parse the adjustment amount from any supplied field
    let rawAmount: number | null = null;
    let isDeduct = isExplicitDeductAction;

    if (deduct_amount !== undefined || deduction !== undefined) {
      rawAmount = parseAdjustmentAmount(deduct_amount !== undefined ? deduct_amount : deduction);
      isDeduct = true;
    } else if (recharge_amount !== undefined) {
      rawAmount = parseAdjustmentAmount(recharge_amount);
      if (!isExplicitDeductAction) isDeduct = false;
    } else if (adjustment !== undefined) {
      rawAmount = parseAdjustmentAmount(adjustment);
    } else if (amount !== undefined) {
      rawAmount = parseAdjustmentAmount(amount);
    }

    if (rawAmount === null) {
      return res.status(400).json({
        message: 'Please provide a valid adjustment amount (e.g. ₹125, ₹275, ₹1,235, ₹5,250).',
      });
    }

    // Negative amounts represent deductions
    if (rawAmount < 0) {
      isDeduct = true;
    }

    const absAmount = Math.round(Math.abs(rawAmount) * 100) / 100;

    if (absAmount <= 0) {
      return res.status(400).json({
        message: 'Adjustment amount must be a valid number greater than zero.',
      });
    }

    const patient = await Patient.findOne({
      $or: [
        { patient_id: String(patientId).toUpperCase().trim() },
        { patient_id: String(patientId).trim() },
        ...(mongoose.isValidObjectId(patientId) ? [{ _id: patientId }] : []),
      ],
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient record not found.' });
    }

    const currentBalance = Math.round((patient.advance_balance || 0) * 100) / 100;

    let newBalance = currentBalance;
    const actionType: 'add' | 'deduct' = isDeduct ? 'deduct' : 'add';
    let message = '';

    if (isDeduct) {
      if (currentBalance < absAmount) {
        return res.status(400).json({
          message: `Cannot deduct ₹${absAmount}. Patient's current advance balance is only ₹${currentBalance}.`,
          current_balance: currentBalance,
        });
      }
      newBalance = Math.round((currentBalance - absAmount) * 100) / 100;
      message = `Successfully deducted ₹${absAmount} from patient ${patient.name} (${patient.patient_id}). Remaining balance: ₹${newBalance}.`;
    } else {
      newBalance = Math.round((currentBalance + absAmount) * 100) / 100;
      message = `Successfully recharged ₹${absAmount} for patient ${patient.name} (${patient.patient_id}). Updated balance: ₹${newBalance}.`;
    }

    patient.advance_balance = newBalance;
    await patient.save();

    // Emit real-time balance updates
    try {
      emitToPatient(patient.patient_id, 'patient_balance_updated', {
        patient_id: patient.patient_id,
        advance_balance: newBalance,
        previous_balance: currentBalance,
        action: actionType,
        amount: absAmount,
      });
      emitToAdmin('patient_balance_updated', {
        patient_id: patient.patient_id,
        advance_balance: newBalance,
        previous_balance: currentBalance,
        action: actionType,
        amount: absAmount,
      });
    } catch (socketErr) {
      console.warn('Socket emission error during balance adjustment:', socketErr);
    }

    return res.status(200).json({
      message,
      patient_id: patient.patient_id,
      advance_balance: newBalance,
      previous_balance: currentBalance,
      action: actionType,
      amount: absAmount,
      patient: {
        _id: patient._id,
        patient_id: patient.patient_id,
        name: patient.name,
        room_number: patient.room_number,
        advance_balance: newBalance,
      },
    });
  } catch (error: any) {
    console.error('Adjust Patient Balance Error:', error);
    return res.status(500).json({ message: 'Error adjusting patient balance.', error: error.message });
  }
};

export const adjustPatientBalance = rechargePatientBalance;

export const deductPatientBalance = async (req: Request, res: Response) => {
  req.body = { ...req.body, action: 'deduct' };
  return rechargePatientBalance(req, res);
};

export const updatePatient = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const { name, age, address, room_number, mobile, advance_balance } = req.body;

    const patient = await Patient.findOne({
      $or: [
        { patient_id: String(patientId).toUpperCase().trim() },
        { patient_id: String(patientId).trim() },
        ...(mongoose.isValidObjectId(patientId) ? [{ _id: patientId }] : []),
      ],
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient record not found.' });
    }

    if (name !== undefined) patient.name = String(name).trim();
    if (age !== undefined) patient.age = Number(age);
    if (address !== undefined) patient.address = String(address).trim();
    if (room_number !== undefined) patient.room_number = String(room_number).trim();
    if (mobile !== undefined) patient.mobile = String(mobile).trim();

    if (advance_balance !== undefined) {
      const parsedBalance = parseAdjustmentAmount(advance_balance);
      if (parsedBalance === null || parsedBalance < 0) {
        return res.status(400).json({ message: 'Advance balance must be a valid non-negative amount.' });
      }
      patient.advance_balance = Math.round(parsedBalance * 100) / 100;
    }

    await patient.save();

    try {
      emitToPatient(patient.patient_id, 'patient_balance_updated', {
        patient_id: patient.patient_id,
        advance_balance: patient.advance_balance,
      });
      emitToAdmin('patient_balance_updated', {
        patient_id: patient.patient_id,
        advance_balance: patient.advance_balance,
      });
    } catch (socketErr) {
      console.warn('Socket emission error during patient update:', socketErr);
    }

    return res.status(200).json({
      message: 'Patient record updated successfully.',
      patient,
    });
  } catch (error: any) {
    console.error('Update Patient Error:', error);
    return res.status(500).json({ message: 'Error updating patient record.', error: error.message });
  }
};


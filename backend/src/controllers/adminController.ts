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

    // Maps to aggregate quantities by (meal_type, menu_id) or (meal_type, item_name)
    const qtyByMealAndMenuId = new Map<string, number>();
    const qtyByMealAndName = new Map<string, number>();

    for (const item of activeOrderItems) {
      const meal = orderMealMap.get(item.order_id) || 'Breakfast';
      if (item.menu_id !== undefined && item.menu_id !== null) {
        const key = `${meal}::${item.menu_id}`;
        qtyByMealAndMenuId.set(key, (qtyByMealAndMenuId.get(key) || 0) + item.quantity);
      }
      if (item.item_name_snapshot) {
        const key = `${meal}::${item.item_name_snapshot.trim().toLowerCase()}`;
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
          const byId = qtyByMealAndMenuId.get(`${meal}::${item.menu_id}`) || 0;
          const byName = qtyByMealAndName.get(`${meal}::${item.item_name.trim().toLowerCase()}`) || 0;
          const totalQty = Math.max(byId, byName);

          foodItemsToPrepare.push({
            menu_id: item.menu_id,
            item_name: item.item_name,
            meal_type: meal,
            category: meal.toUpperCase(), // 'BREAKFAST', 'LUNCH', 'DINNER'
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

        const byId = qtyByMealAndMenuId.get(`${targetMeal}::${item.menu_id}`) || 0;
        const byName = qtyByMealAndName.get(`${targetMeal}::${item.item_name.trim().toLowerCase()}`) || 0;
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
    const initialAdvance = Number(advance_balance) >= 0 ? Number(advance_balance) : 0;

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

export const rechargePatientBalance = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const { amount } = req.body;

    const rechargeAmount = Number(amount);
    if (isNaN(rechargeAmount) || rechargeAmount <= 0) {
      return res.status(400).json({ message: 'Recharge amount must be a positive number.' });
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

    patient.advance_balance = (patient.advance_balance || 0) + rechargeAmount;
    await patient.save();

    return res.status(200).json({
      message: `Successfully recharged ₹${rechargeAmount} for patient ${patient.name} (${patient.patient_id}).`,
      patient_id: patient.patient_id,
      advance_balance: patient.advance_balance,
    });
  } catch (error: any) {
    console.error('Recharge Patient Balance Error:', error);
    return res.status(500).json({ message: 'Error recharging patient balance.' });
  }
};


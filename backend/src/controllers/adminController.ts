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
      order_status: { $nin: ['PENDING', 'DELIVERED', 'CANCELLED'] },
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
    const qtyBySlotAndMenuId = new Map<string, number>();
    const qtyBySlotAndName = new Map<string, number>();

    const normalizeSlotHelper = (rawSlot: string): string => {
      const s = (rawSlot || '').trim().toUpperCase();
      if (/^7(\.00|:00)?\s*AM/i.test(s) || /^07:00/i.test(s)) return '7:00 AM';
      if (/^11(\.00|:00)?\s*AM/i.test(s)) return '11:00 AM';
      if (/^4(\.00|:00)?\s*PM/i.test(s) || /^16:00/i.test(s)) return '4:00 PM';
      if (/^7(\.00|:00)?\s*PM/i.test(s) || /^19:00/i.test(s)) return '7:00 PM';
      return '7:00 AM';
    };

    const activeOrderMap = new Map<string, any>();
    for (const o of activeOrders) {
      activeOrderMap.set(o.order_id, o);
    }

    for (const item of activeOrderItems) {
      const rawMeal = orderMealMap.get(item.order_id) || 'Breakfast';
      const { mealKey } = normalizeMeal(rawMeal);
      const parentOrder = activeOrderMap.get(item.order_id);

      if (mealKey === 'TEA / MILK') {
        const slot = normalizeSlotHelper((item as any).serving_time || parentOrder?.serving_time || '7:00 AM');
        if (item.menu_id !== undefined && item.menu_id !== null) {
          const key = `${slot}::${item.menu_id}`;
          qtyBySlotAndMenuId.set(key, (qtyBySlotAndMenuId.get(key) || 0) + item.quantity);
        }
        if (item.item_name_snapshot) {
          const key = `${slot}::${item.item_name_snapshot.trim().toLowerCase()}`;
          qtyBySlotAndName.set(key, (qtyBySlotAndName.get(key) || 0) + item.quantity);
        }
      }

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
    const teaSlots = ['7:00 AM', '11:00 AM', '4:00 PM', '7:00 PM'];

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
      } else if (origCategory === 'TEA / MILK') {
        // Tea / Milk and Coffee items are split into 4 serving time slots: 7:00 AM, 11:00 AM, 4:00 PM, 7:00 PM
        for (const slot of teaSlots) {
          const byId = qtyBySlotAndMenuId.get(`${slot}::${item.menu_id}`) || 0;
          const byName = qtyBySlotAndName.get(`${slot}::${item.item_name.trim().toLowerCase()}`) || 0;
          const totalQty = Math.max(byId, byName);

          foodItemsToPrepare.push({
            menu_id: item.menu_id,
            item_name: item.item_name,
            meal_type: `Tea / Milk (${slot})`,
            serving_time: slot,
            category: 'TEA / MILK',
            portion_size: item.quantity,
            total_preparation_quantity: totalQty,
          });
        }
      } else {
        // Items with specific category (e.g. BREAKFAST, LUNCH, DINNER, SNACKS)
        let targetMeal = 'Breakfast';
        if (origCategory === 'LUNCH') targetMeal = 'Lunch';
        else if (origCategory === 'DINNER') targetMeal = 'Dinner';
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

    const teaCoffeeSlots = teaSlots.map((slot) => {
      const items = allMenuItems
        .filter((m) => (m.category || '').trim().toUpperCase() === 'TEA / MILK' || m.requires_serving_time)
        .map((m) => {
          const byId = qtyBySlotAndMenuId.get(`${slot}::${m.menu_id}`) || 0;
          const byName = qtyBySlotAndName.get(`${slot}::${m.item_name.trim().toLowerCase()}`) || 0;
          return {
            menu_id: m.menu_id,
            item_name: m.item_name,
            serving_time: slot,
            total_quantity: Math.max(byId, byName),
            portion_size: m.quantity,
          };
        })
        .filter((it) => it.total_quantity > 0);
      const subtotal = items.reduce((sum, it) => sum + it.total_quantity, 0);
      return {
        serving_time: slot,
        items,
        subtotal,
      };
    });

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
      teaCoffeeSlots,
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

    // Cascade delete all associated orders, order items, and bills for clean patient lifecycle
    const patientOrders = await FoodOrder.find({
      $or: [{ patient_id: patient.patient_id }, { patient_id: formattedId }],
    });
    const orderIds = patientOrders.map((o) => o.order_id);
    if (orderIds.length > 0) {
      await OrderItem.deleteMany({ order_id: { $in: orderIds } });
    }
    await FoodOrder.deleteMany({
      $or: [{ patient_id: patient.patient_id }, { patient_id: formattedId }],
    });
    await Bill.deleteMany({
      $or: [{ patient_id: patient.patient_id }, { patient_id: formattedId }],
    });

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

/**
 * Generates the aggregated Kitchen Cooking & Preparation Report.
 * Groups active orders into 5 distinct meal categories:
 * 1. Tea / Milk and Coffee Preparation (separated by 7:00 AM, 11:00 AM, 4:00 PM, 7:00 PM)
 * 2. Breakfast Preparation
 * 3. Lunch Preparation
 * 4. Dinner Preparation
 * 5. Snacks Preparation
 * Common Menu items are classified automatically under the meal session chosen by the patient.
 * Strictly excludes pending, cancelled, cleared, and delivered orders.
 */
export const getKitchenReport = async (req: Request, res: Response) => {
  try {
    const activeOrders = await FoodOrder.find({
      order_status: { $nin: ['PENDING', 'DELIVERED', 'CANCELLED'] },
      is_cleared_from_active_view: { $ne: true },
    }).sort({ createdAt: -1 });

    const activeOrderIds = activeOrders.map((o) => o.order_id);
    const activeOrderItems = await OrderItem.find({ order_id: { $in: activeOrderIds } });

    const patients = await Patient.find();
    const patientMap = new Map<string, any>(patients.map((p) => [p.patient_id, p]));

    const orderMap = new Map<string, any>();
    const orderMealMap = new Map<string, string>();
    for (const o of activeOrders) {
      orderMap.set(o.order_id, o);
      orderMealMap.set(o.order_id, o.meal_type || 'Breakfast');
    }

    const allMenuItems = await MenuItem.find().sort({ menu_id: 1 });
    const menuMap = new Map<number, any>();
    const menuNameMap = new Map<string, any>();
    for (const m of allMenuItems) {
      menuMap.set(m.menu_id, m);
      menuNameMap.set(m.item_name.trim().toLowerCase(), m);
    }

    const normalizeSlot = (rawSlot: string): string => {
      const s = (rawSlot || '').trim().toUpperCase();
      if (/^7(\.00|:00)?\s*AM/i.test(s) || /^07:00/i.test(s)) return '7:00 AM';
      if (/^11(\.00|:00)?\s*AM/i.test(s)) return '11:00 AM';
      if (/^4(\.00|:00)?\s*PM/i.test(s) || /^16:00/i.test(s)) return '4:00 PM';
      if (/^7(\.00|:00)?\s*PM/i.test(s) || /^19:00/i.test(s)) return '7:00 PM';
      return '7:00 AM';
    };

    const normalizeCategory = (rawMeal: string, fallbackCat?: string): string => {
      let trimmed = (rawMeal || '').trim().toUpperCase();
      if (!trimmed || trimmed === 'GENERAL' || trimmed === 'COMMON MENU') {
        trimmed = (fallbackCat || 'BREAKFAST').trim().toUpperCase();
      }
      if (/^TEA/i.test(trimmed) || /^MILK/i.test(trimmed) || /^COFFEE/i.test(trimmed)) return 'TEA / MILK';
      if (/^BREAKFAST/i.test(trimmed)) return 'BREAKFAST';
      if (/^LUNCH/i.test(trimmed)) return 'LUNCH';
      if (/^DINNER/i.test(trimmed)) return 'DINNER';
      if (/^SNACK/i.test(trimmed)) return 'SNACKS';
      return 'BREAKFAST';
    };

    // 1. Dedicated aggregation for Tea/Milk and Coffee by serving time slot (7:00 AM, 11:00 AM, 4:00 PM, 7:00 PM)
    const teaSlotPrepMap = new Map<string, {
      menu_id: number;
      item_name: string;
      serving_time: string;
      category: string;
      portion_size: string;
      unit: string;
      total_quantity: number;
      order_count: number;
      patients: Array<{
        patient_id: string;
        patient_name: string;
        room_number: string;
        quantity: number;
        order_id: string;
      }>;
    }>();

    // 2. Aggregation for other food items (Breakfast, Lunch, Dinner, Snacks)
    const prepMap = new Map<string, {
      menu_id: number;
      item_name: string;
      category: string;
      portion_size: string;
      unit: string;
      total_quantity: number;
      order_count: number;
    }>();

    for (const item of activeOrderItems) {
      const order = orderMap.get(item.order_id);
      const orderMeal = orderMealMap.get(item.order_id) || 'Breakfast';
      const menuDoc = (item.menu_id ? menuMap.get(item.menu_id) : null) || menuNameMap.get((item.item_name_snapshot || '').trim().toLowerCase());
      const cat = normalizeCategory(orderMeal, menuDoc?.category);
      const itemName = (item.item_name_snapshot || menuDoc?.item_name || 'Food Item').trim();

      const portionSize = menuDoc ? menuDoc.quantity : '1 portion';
      let unit = 'Nos';
      if (portionSize) {
        if (/ml/i.test(portionSize)) unit = 'ml';
        else if (/plate/i.test(portionSize)) unit = 'Plate(s)';
        else if (/cup/i.test(portionSize)) unit = 'Cup(s)';
        else if (/nos/i.test(portionSize) || /no\b/i.test(portionSize)) unit = 'Nos';
      }

      if (cat === 'TEA / MILK') {
        const slot = normalizeSlot((item as any).serving_time || order?.serving_time || '7:00 AM');
        const key = `${slot}::${itemName.toLowerCase()}`;
        const patient = order ? patientMap.get(order.patient_id) : null;
        const patientEntry = {
          patient_id: order?.patient_id || 'N/A',
          patient_name: patient?.name || 'Patient',
          room_number: patient?.room_number || 'N/A',
          quantity: item.quantity,
          order_id: item.order_id,
        };

        const existing = teaSlotPrepMap.get(key);
        if (existing) {
          existing.total_quantity += item.quantity;
          existing.order_count += 1;
          existing.patients.push(patientEntry);
        } else {
          teaSlotPrepMap.set(key, {
            menu_id: item.menu_id || (menuDoc ? menuDoc.menu_id : 0),
            item_name: itemName,
            serving_time: slot,
            category: 'TEA / MILK',
            portion_size: portionSize,
            unit,
            total_quantity: item.quantity,
            order_count: 1,
            patients: [patientEntry],
          });
        }
      } else {
        const key = `${cat}::${itemName.toLowerCase()}`;
        const existing = prepMap.get(key);
        if (existing) {
          existing.total_quantity += item.quantity;
          existing.order_count += 1;
        } else {
          prepMap.set(key, {
            menu_id: item.menu_id || (menuDoc ? menuDoc.menu_id : 0),
            item_name: itemName,
            category: cat,
            portion_size: portionSize,
            unit,
            total_quantity: item.quantity,
            order_count: 1,
          });
        }
      }
    }

    const standardTimeSlots = ['7:00 AM', '11:00 AM', '4:00 PM', '7:00 PM'];
    const teaCoffeeSlots = standardTimeSlots.map((slot) => {
      const items = Array.from(teaSlotPrepMap.values())
        .filter((it) => it.serving_time === slot)
        .sort((a, b) => a.item_name.localeCompare(b.item_name));
      const subtotal = items.reduce((sum, it) => sum + it.total_quantity, 0);
      return {
        serving_time: slot,
        items,
        subtotal,
      };
    });

    const totalTeaCoffeeQuantity = teaCoffeeSlots.reduce((sum, s) => sum + s.subtotal, 0);

    // Flat items for Tea / Milk section sorted by slot order then item name
    const teaPreparationItems: any[] = [];
    standardTimeSlots.forEach((slot) => {
      const slotItems = Array.from(teaSlotPrepMap.values())
        .filter((it) => it.serving_time === slot)
        .sort((a, b) => a.item_name.localeCompare(b.item_name));
      teaPreparationItems.push(...slotItems);
    });

    const standardSections = [
      {
        key: 'TEA / MILK',
        title: 'Tea / Milk & Coffee Preparation',
        icon: 'coffee',
        is_tea_coffee: true,
        time_slots: teaCoffeeSlots,
        items: teaPreparationItems,
        subtotal: totalTeaCoffeeQuantity,
      },
      {
        key: 'BREAKFAST',
        title: 'Breakfast Preparation',
        icon: 'sun',
        is_tea_coffee: false,
        items: Array.from(prepMap.values())
          .filter((it) => it.category === 'BREAKFAST')
          .sort((a, b) => a.item_name.localeCompare(b.item_name)),
        subtotal: Array.from(prepMap.values())
          .filter((it) => it.category === 'BREAKFAST')
          .reduce((sum, it) => sum + it.total_quantity, 0),
      },
      {
        key: 'LUNCH',
        title: 'Lunch Preparation',
        icon: 'utensils',
        is_tea_coffee: false,
        items: Array.from(prepMap.values())
          .filter((it) => it.category === 'LUNCH')
          .sort((a, b) => a.item_name.localeCompare(b.item_name)),
        subtotal: Array.from(prepMap.values())
          .filter((it) => it.category === 'LUNCH')
          .reduce((sum, it) => sum + it.total_quantity, 0),
      },
      {
        key: 'DINNER',
        title: 'Dinner Preparation',
        icon: 'moon',
        is_tea_coffee: false,
        items: Array.from(prepMap.values())
          .filter((it) => it.category === 'DINNER')
          .sort((a, b) => a.item_name.localeCompare(b.item_name)),
        subtotal: Array.from(prepMap.values())
          .filter((it) => it.category === 'DINNER')
          .reduce((sum, it) => sum + it.total_quantity, 0),
      },
      {
        key: 'SNACKS',
        title: 'Snacks Preparation',
        icon: 'cookie',
        is_tea_coffee: false,
        items: Array.from(prepMap.values())
          .filter((it) => it.category === 'SNACKS')
          .sort((a, b) => a.item_name.localeCompare(b.item_name)),
        subtotal: Array.from(prepMap.values())
          .filter((it) => it.category === 'SNACKS')
          .reduce((sum, it) => sum + it.total_quantity, 0),
      },
    ];

    const totalPortions = standardSections.reduce((sum, sec) => sum + sec.subtotal, 0);
    const now = new Date();

    return res.status(200).json({
      report_date: now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      generation_time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      active_orders_count: activeOrders.length,
      total_portions_to_cook: totalPortions,
      tea_coffee_slots: teaCoffeeSlots,
      sections: standardSections,
    });
  } catch (error: any) {
    console.error('Get Kitchen Report Error:', error);
    return res.status(500).json({ message: 'Error generating kitchen report.' });
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

    // Explicitly guarantee zero legacy/default bills or orders exist for this newly created patient
    await Bill.deleteMany({ patient_id: finalPatientId });
    const legacyOrders = await FoodOrder.find({ patient_id: finalPatientId });
    if (legacyOrders.length > 0) {
      const legOrderIds = legacyOrders.map((o) => o.order_id);
      await OrderItem.deleteMany({ order_id: { $in: legOrderIds } });
      await FoodOrder.deleteMany({ patient_id: finalPatientId });
    }

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


import { Response } from 'express';
import { AuthRequest, verifyPatientOwnership } from '../middleware/auth';
import { FoodOrder } from '../models/FoodOrder';
import { OrderItem } from '../models/OrderItem';
import { MenuItem } from '../models/MenuItem';
import { Patient } from '../models/Patient';
import { getNextSequenceValue } from '../models/Counter';
import { emitToAdmin, emitToPatient } from '../services/socketService';
import { getOrderingLockedStatus } from './systemController';

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const isLocked = await getOrderingLockedStatus();
    if (isLocked) {
      return res.status(400).json({ message: 'Ordering is currently closed by the admin.' });
    }

    const patient_id = req.user?.patient_id;
    if (!patient_id) {
      return res.status(403).json({ message: 'Patient identity missing.' });
    }

    const { items, meal_type, meals } = req.body;

    // Normalize into array of meal requests: [{ meal_type, items }]
    let requestedMeals: Array<{ meal_type: string; items: Array<{ menu_id: number; quantity: number }> }> = [];

    if (meals && Array.isArray(meals) && meals.length > 0) {
      requestedMeals = meals.filter((m: any) => m.items && Array.isArray(m.items) && m.items.length > 0);
    } else if (items && Array.isArray(items) && items.length > 0) {
      requestedMeals = [{ meal_type: meal_type || 'General', items }];
    }

    if (requestedMeals.length === 0) {
      return res.status(400).json({ message: 'At least one food item must be selected for order.' });
    }

    // Verify patient exists
    const patient = await Patient.findOne({ patient_id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient record not found.' });
    }

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[new Date().getDay()];

    // First pass: Validate menu items and calculate grand total across all requested meals
    let grandTotalAmount = 0;
    const validatedMealPayloads: Array<{
      meal_type: string;
      total_amount: number;
      snapshots: any[];
    }> = [];

    for (const mealReq of requestedMeals) {
      let mealTotal = 0;
      const snapshots: any[] = [];

      for (const item of mealReq.items) {
        const menuDoc = await MenuItem.findOne({ menu_id: item.menu_id });
        if (!menuDoc) {
          return res.status(400).json({ message: `Menu item #${item.menu_id} not found.` });
        }

        if (!menuDoc.availability || !menuDoc.available_days.includes(currentDay)) {
          return res.status(400).json({
            message: `${menuDoc.item_name} is currently unavailable for order today.`,
          });
        }

        const qty = Number(item.quantity);
        if (qty <= 0) {
          return res.status(400).json({ message: 'Item quantity must be greater than 0.' });
        }

        const subtotal = menuDoc.price * qty;
        mealTotal += subtotal;

        snapshots.push({
          menu_id: menuDoc.menu_id,
          item_name_snapshot: menuDoc.item_name,
          quantity: qty,
          unit_price: menuDoc.price,
          subtotal,
        });
      }

      grandTotalAmount += mealTotal;
      validatedMealPayloads.push({
        meal_type: mealReq.meal_type || 'General',
        total_amount: mealTotal,
        snapshots,
      });
    }

    // CHECK ADVANCE BALANCE BEFORE DEDUCTION
    const currentBalance = patient.advance_balance || 0;
    if (currentBalance < grandTotalAmount) {
      return res.status(400).json({
        message: `Insufficient advance balance! Available balance is ₹${currentBalance}, but order total is ₹${grandTotalAmount}. Please ask Admin to recharge your balance.`,
        available_balance: currentBalance,
        required_amount: grandTotalAmount,
      });
    }

    // DEDUCT BALANCE ATOMICALLY ONCE FOR THE ENTIRE TRANSACTION
    patient.advance_balance = Math.max(0, currentBalance - grandTotalAmount);
    await patient.save();

    // Second pass: Create FoodOrder & OrderItem records for each meal session
    const year = new Date().getFullYear();
    const now = new Date();
    const order_date = now.toLocaleDateString('en-GB');
    const order_time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const createdFullOrders: any[] = [];

    for (const mealData of validatedMealPayloads) {
      const seq = await getNextSequenceValue(`order_id_${year}`);
      const formattedSeq = String(seq).padStart(4, '0');
      const order_id = `ORD${year}${formattedSeq}`;

      const newOrder = await FoodOrder.create({
        order_id,
        patient_id,
        order_date,
        order_time,
        meal_type: mealData.meal_type,
        total_amount: mealData.total_amount,
        order_status: 'ACCEPTED',
        admin_delivery_confirmed: false,
        patient_delivery_confirmed: false,
      });

      for (const itemSnap of mealData.snapshots) {
        const itemSeq = await getNextSequenceValue('order_item_id');
        await OrderItem.create({
          order_item_id: itemSeq,
          order_id: newOrder.order_id,
          ...itemSnap,
        });
      }

      const createdOrderItems = await OrderItem.find({ order_id: newOrder.order_id });
      const fullOrderPayload = {
        ...newOrder.toObject(),
        patient_name: patient.name,
        room_number: patient.room_number,
        patient_advance_balance: patient.advance_balance,
        items: createdOrderItems,
      };

      createdFullOrders.push(fullOrderPayload);
      emitToAdmin('new_order', fullOrderPayload);
    }

    // Broadcast balance update event
    emitToPatient(patient_id, 'patient_balance_updated', {
      patient_id,
      advance_balance: patient.advance_balance,
    });
    emitToAdmin('patient_balance_updated', {
      patient_id,
      advance_balance: patient.advance_balance,
    });

    return res.status(201).json({
      message: 'Order placed successfully! Amount deducted from advance balance.',
      orders: createdFullOrders,
      order: createdFullOrders[0],
      remaining_balance: patient.advance_balance,
      deducted_amount: grandTotalAmount,
    });
  } catch (error: any) {
    console.error('Create Order Error:', error);
    return res.status(500).json({ message: 'Error placing order.', error: error.message });
  }
};

export const getPatientOrders = async (req: AuthRequest, res: Response) => {
  try {
    const patient_id = req.user?.patient_id;
    if (!patient_id) {
      return res.status(403).json({ message: 'Patient identity missing.' });
    }

    const orders = await FoodOrder.find({ patient_id }).sort({ createdAt: -1 });

    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await OrderItem.find({ order_id: order.order_id });
        return {
          ...order.toObject(),
          items,
        };
      })
    );

    return res.status(200).json(ordersWithItems);
  } catch (error: any) {
    console.error('Get Patient Orders Error:', error);
    return res.status(500).json({ message: 'Error fetching patient orders.' });
  }
};

export const getAllOrdersAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await FoodOrder.find().sort({ createdAt: -1 });
    const patients = await Patient.find();
    const patientMap = new Map(patients.map((p) => [p.patient_id, p]));

    const ordersWithDetails = await Promise.all(
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

    return res.status(200).json(ordersWithDetails);
  } catch (error: any) {
    console.error('Get Admin Orders Error:', error);
    return res.status(500).json({ message: 'Error fetching orders for admin.' });
  }
};

export const acceptOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const order = await FoodOrder.findOne({ order_id: orderId });

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (order.order_status === 'CANCELLED') {
      return res.status(400).json({ message: 'Order has already been cancelled' });
    }

    if (order.order_status === 'DELIVERED') {
      return res.status(400).json({ message: 'Order has already been delivered' });
    }

    if (order.order_status !== 'PENDING') {
      return res.status(400).json({ message: `Cannot accept order in ${order.order_status} status.` });
    }

    order.order_status = 'ACCEPTED';
    await order.save();

    const items = await OrderItem.find({ order_id: order.order_id });
    const payload = { ...order.toObject(), items };

    emitToPatient(order.patient_id, 'order_status_updated', payload);
    emitToAdmin('order_status_updated', payload);

    return res.status(200).json({
      message: 'Order accepted successfully',
      order: payload,
    });
  } catch (error: any) {
    console.error('Accept Order Error:', error);
    return res.status(500).json({ message: 'Error accepting order.' });
  }
};

export const cancelOrder = async (req: AuthRequest, res: Response) => {
  try {
    // Only Admin can call this endpoint
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await FoodOrder.findOne({ order_id: orderId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (order.order_status === 'DELIVERED') {
      return res.status(400).json({ message: 'Order has already been delivered' });
    }

    if (order.order_status === 'CANCELLED') {
      return res.status(400).json({ message: 'Order has already been cancelled' });
    }

    order.order_status = 'CANCELLED';
    order.cancellation_reason = reason || 'Food item unavailable';
    order.cancelled_by = 'Hospital Canteen Admin';
    order.cancelled_at = new Date();

    await order.save();

    const items = await OrderItem.find({ order_id: order.order_id });
    const payload = { ...order.toObject(), items };

    emitToPatient(order.patient_id, 'order_status_updated', payload);
    emitToAdmin('order_status_updated', payload);

    return res.status(200).json({
      message: 'Order cancelled successfully',
      order: payload,
    });
  } catch (error: any) {
    console.error('Cancel Order Error:', error);
    return res.status(500).json({ message: 'Error cancelling order.' });
  }
};

export const adminConfirmDelivery = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const order = await FoodOrder.findOne({ order_id: orderId });

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (order.order_status === 'CANCELLED') {
      return res.status(400).json({ message: 'Cannot confirm delivery for a cancelled order.' });
    }

    order.admin_delivery_confirmed = true;
    order.admin_delivery_confirmed_at = new Date();
    // Directly mark order as DELIVERED once admin confirms delivery
    order.order_status = 'DELIVERED';

    await order.save();

    const items = await OrderItem.find({ order_id: order.order_id });
    const payload = { ...order.toObject(), items };

    emitToPatient(order.patient_id, 'delivery_status_updated', payload);
    emitToAdmin('delivery_status_updated', payload);

    return res.status(200).json({
      message: 'Order marked as DELIVERED successfully',
      order: payload,
    });
  } catch (error: any) {
    console.error('Admin Delivery Confirmation Error:', error);
    return res.status(500).json({ message: 'Error confirming admin delivery.' });
  }
};

export const patientConfirmDelivery = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const patient_id = req.user?.patient_id;

    const order = await FoodOrder.findOne({ order_id: orderId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // Verify patient ownership
    if (order.patient_id !== patient_id) {
      return res.status(403).json({ message: 'You do not have permission to confirm delivery for this order.' });
    }

    if (order.order_status === 'CANCELLED') {
      return res.status(400).json({ message: 'Cannot confirm delivery for a cancelled order.' });
    }

    if (order.order_status === 'PENDING') {
      return res.status(400).json({ message: 'Order cannot be confirmed before order acceptance.' });
    }

    order.patient_delivery_confirmed = true;
    order.patient_delivery_confirmed_at = new Date();

    // Check if admin has also confirmed delivery
    if (order.admin_delivery_confirmed) {
      order.order_status = 'DELIVERED';
    } else {
      order.order_status = 'DELIVERY CONFIRMATION PENDING';
    }

    await order.save();

    const items = await OrderItem.find({ order_id: order.order_id });
    const payload = { ...order.toObject(), items };

    emitToPatient(order.patient_id, 'delivery_status_updated', payload);
    emitToAdmin('delivery_status_updated', payload);

    return res.status(200).json({
      message: 'Delivery confirmed successfully',
      order: payload,
    });
  } catch (error: any) {
    console.error('Patient Delivery Confirmation Error:', error);
    return res.status(500).json({ message: 'Error confirming patient delivery.' });
  }
};

export const submitPatientFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const patient_id = req.user?.patient_id;
    const { rating, feedback_comment } = req.body;

    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ message: 'Rating must be a number between 1 and 5 stars.' });
    }

    const order = await FoodOrder.findOne({ order_id: orderId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (order.patient_id !== patient_id) {
      return res.status(403).json({ message: 'You can only leave feedback for your own orders.' });
    }

    if (order.order_status !== 'DELIVERED') {
      return res.status(400).json({ message: 'Feedback can only be submitted for delivered orders.' });
    }

    order.rating = Number(rating);
    order.feedback_comment = feedback_comment ? String(feedback_comment).trim() : '';
    order.feedback_date = new Date();
    order.has_feedback = true;

    await order.save();

    const items = await OrderItem.find({ order_id: order.order_id });
    const payload = { ...order.toObject(), items };

    emitToPatient(order.patient_id, 'order_status_updated', payload);
    emitToAdmin('order_status_updated', payload);

    return res.status(200).json({
      message: 'Feedback submitted successfully',
      order: payload,
    });
  } catch (error: any) {
    console.error('Submit Feedback Error:', error);
    return res.status(500).json({ message: 'Error submitting feedback.' });
  }
};


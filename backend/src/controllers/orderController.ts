import { Response } from 'express';
import { AuthRequest, verifyPatientOwnership } from '../middleware/auth';
import { FoodOrder } from '../models/FoodOrder';
import { OrderItem } from '../models/OrderItem';
import { MenuItem } from '../models/MenuItem';
import { Patient } from '../models/Patient';
import { getNextSequenceValue } from '../models/Counter';
import { emitToAdmin, emitToPatient } from '../services/socketService';

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const patient_id = req.user?.patient_id;
    if (!patient_id) {
      return res.status(403).json({ message: 'Patient identity missing.' });
    }

    const { items, meal_type } = req.body; // items: [{ menu_id, quantity }]

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one food item must be selected.' });
    }

    // Verify patient exists
    const patient = await Patient.findOne({ patient_id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient record not found.' });
    }

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[new Date().getDay()];

    let total_amount = 0;
    const orderItemSnapshots: any[] = [];

    for (const item of items) {
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
      total_amount += subtotal;

      orderItemSnapshots.push({
        menu_id: menuDoc.menu_id,
        item_name_snapshot: menuDoc.item_name,
        quantity: qty,
        unit_price: menuDoc.price,
        subtotal,
      });
    }

    // Generate Order ID ORD20260001
    const year = new Date().getFullYear();
    const seq = await getNextSequenceValue(`order_id_${year}`);
    const formattedSeq = String(seq).padStart(4, '0');
    const order_id = `ORD${year}${formattedSeq}`;

    const now = new Date();
    const order_date = now.toLocaleDateString('en-GB'); // DD/MM/YYYY or DD-MM-YYYY
    const order_time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const newOrder = await FoodOrder.create({
      order_id,
      patient_id,
      order_date,
      order_time,
      meal_type: meal_type || 'General',
      total_amount,
      order_status: 'PENDING',
      admin_delivery_confirmed: false,
      patient_delivery_confirmed: false,
    });

    // Save order items
    for (let i = 0; i < orderItemSnapshots.length; i++) {
      const itemSeq = await getNextSequenceValue('order_item_id');
      await OrderItem.create({
        order_item_id: itemSeq,
        order_id: newOrder.order_id,
        ...orderItemSnapshots[i],
      });
    }

    const createdOrderItems = await OrderItem.find({ order_id: newOrder.order_id });

    const fullOrderPayload = {
      ...newOrder.toObject(),
      patient_name: patient.name,
      room_number: patient.room_number,
      items: createdOrderItems,
    };

    // Emit Socket.IO event to admin
    emitToAdmin('new_order', fullOrderPayload);

    return res.status(201).json({
      message: 'Order placed successfully',
      order: fullOrderPayload,
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

    if (order.order_status === 'PENDING') {
      return res.status(400).json({ message: 'Order must be accepted before delivery confirmation.' });
    }

    order.admin_delivery_confirmed = true;
    order.admin_delivery_confirmed_at = new Date();

    // Check if patient has also confirmed delivery
    if (order.patient_delivery_confirmed) {
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
      message: 'Admin delivery confirmed successfully',
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

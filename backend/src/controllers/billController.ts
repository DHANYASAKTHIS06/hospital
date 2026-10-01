import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Bill } from '../models/Bill';
import { FoodOrder } from '../models/FoodOrder';
import { OrderItem } from '../models/OrderItem';
import { Patient } from '../models/Patient';
import { getNextSequenceValue } from '../models/Counter';
import { emitToPatient, emitToAdmin } from '../services/socketService';

export const generateBill = async (req: AuthRequest, res: Response) => {
  try {
    const { patient_id, billing_period, advance_amount } = req.body;

    if (!patient_id) {
      return res.status(400).json({ message: 'Patient ID is required.' });
    }

    const patient = await Patient.findOne({ patient_id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' });
    }

    // Find all non-cancelled orders for this patient that are not yet billed
    // Note: includes historical orders regardless of is_cleared_from_active_view flag!
    const existingBills = await Bill.find({ patient_id });
    const billedOrderIds = new Set<string>();
    existingBills.forEach((b) => b.orders_included.forEach((id) => billedOrderIds.add(id)));

    const unbilledOrders = await FoodOrder.find({
      patient_id,
      order_status: { $ne: 'CANCELLED' },
      order_id: { $nin: Array.from(billedOrderIds) },
    }).sort({ createdAt: 1 });

    if (unbilledOrders.length === 0) {
      return res.status(400).json({ message: 'No unbilled orders found for this patient.' });
    }

    // Compute Day-Wise Breakdown
    const dayMap = new Map<string, { day_total: number; orders: any[] }>();

    for (const order of unbilledOrders) {
      const items = await OrderItem.find({ order_id: order.order_id });
      const dateKey = order.order_date || 'Unknown Date';

      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, { day_total: 0, orders: [] });
      }

      const dayObj = dayMap.get(dateKey)!;
      dayObj.day_total += order.total_amount;
      dayObj.orders.push({
        order_id: order.order_id,
        meal_type: order.meal_type,
        order_time: order.order_time,
        total_amount: order.total_amount,
        items,
      });
    }

    const day_wise_breakdown = Array.from(dayMap.entries()).map(([date, data]) => ({
      date,
      day_total: data.day_total,
      orders: data.orders,
    }));

    const total_amount = unbilledOrders.reduce((sum, o) => sum + o.total_amount, 0);
    // Use patient's advance_balance if advance_amount not explicitly passed
    const advance = advance_amount !== undefined && advance_amount !== null
      ? Number(advance_amount)
      : (patient.advance_balance || 0);

    const remaining_amount = Math.max(0, total_amount - advance);

    let payment_status: 'UNPAID' | 'ADVANCE' | 'PAID' = 'UNPAID';
    if (advance >= total_amount && total_amount > 0) {
      payment_status = 'PAID';
    } else if (advance > 0 && advance < total_amount) {
      payment_status = 'ADVANCE';
    }

    const year = new Date().getFullYear();
    const seq = await getNextSequenceValue(`bill_id_${year}`);
    const formattedSeq = String(seq).padStart(4, '0');
    const bill_id = `B${year}${formattedSeq}`;

    const now = new Date();
    const billing_date = now.toLocaleDateString('en-GB');

    // Default due date = 15 days from today
    const due = new Date();
    due.setDate(due.getDate() + 15);
    const due_date = due.toLocaleDateString('en-GB');

    const orders_included = unbilledOrders.map((o) => o.order_id);

    const newBill = await Bill.create({
      bill_id,
      patient_id,
      billing_date,
      billing_period: billing_period || `${now.toLocaleString('default', { month: 'long' })} ${year}`,
      total_amount,
      advance_amount: advance,
      remaining_amount,
      payment_status,
      due_date,
      orders_included,
      day_wise_breakdown,
    });

    emitToPatient(patient_id, 'payment_status_updated', newBill);
    emitToAdmin('payment_status_updated', newBill);

    return res.status(201).json({
      message: 'Bill generated successfully with day-wise breakdown.',
      bill: newBill,
    });
  } catch (error: any) {
    console.error('Generate Bill Error:', error);
    return res.status(500).json({ message: 'Error generating bill.' });
  }
};

export const getPatientBills = async (req: AuthRequest, res: Response) => {
  try {
    const patient_id = req.user?.patient_id;
    if (!patient_id) {
      return res.status(403).json({ message: 'Patient identity missing.' });
    }

    const bills = await Bill.find({ patient_id }).sort({ createdAt: -1 });

    const enrichedBills = await Promise.all(
      bills.map(async (bill) => {
        const orders = await FoodOrder.find({ order_id: { $in: bill.orders_included } });
        const ordersWithItems = await Promise.all(
          orders.map(async (o) => {
            const items = await OrderItem.find({ order_id: o.order_id });
            return { ...o.toObject(), items };
          })
        );

        // If day_wise_breakdown is missing, construct it dynamically
        let breakdown = bill.day_wise_breakdown;
        if (!breakdown || breakdown.length === 0) {
          const dayMap = new Map<string, { day_total: number; orders: any[] }>();
          ordersWithItems.forEach((o) => {
            const dateKey = o.order_date || 'Unknown Date';
            if (!dayMap.has(dateKey)) {
              dayMap.set(dateKey, { day_total: 0, orders: [] });
            }
            const dayObj = dayMap.get(dateKey)!;
            dayObj.day_total += o.total_amount;
            dayObj.orders.push({
              order_id: o.order_id,
              meal_type: o.meal_type,
              order_time: o.order_time,
              total_amount: o.total_amount,
              items: o.items,
            });
          });
          breakdown = Array.from(dayMap.entries()).map(([date, data]) => ({
            date,
            day_total: data.day_total,
            orders: data.orders,
          }));
        }

        return {
          ...bill.toObject(),
          day_wise_breakdown: breakdown,
          orders: ordersWithItems,
        };
      })
    );

    return res.status(200).json(enrichedBills);
  } catch (error: any) {
    console.error('Get Patient Bills Error:', error);
    return res.status(500).json({ message: 'Error fetching bills.' });
  }
};

export const getAllBillsAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const bills = await Bill.find().sort({ createdAt: -1 });
    const patients = await Patient.find();
    const patientMap = new Map(patients.map((p) => [p.patient_id, p]));

    const enrichedBills = await Promise.all(
      bills.map(async (bill) => {
        const patient = patientMap.get(bill.patient_id);
        const orders = await FoodOrder.find({ order_id: { $in: bill.orders_included } });
        const ordersWithItems = await Promise.all(
          orders.map(async (o) => {
            const items = await OrderItem.find({ order_id: o.order_id });
            return { ...o.toObject(), items };
          })
        );

        let breakdown = bill.day_wise_breakdown;
        if (!breakdown || breakdown.length === 0) {
          const dayMap = new Map<string, { day_total: number; orders: any[] }>();
          ordersWithItems.forEach((o) => {
            const dateKey = o.order_date || 'Unknown Date';
            if (!dayMap.has(dateKey)) {
              dayMap.set(dateKey, { day_total: 0, orders: [] });
            }
            const dayObj = dayMap.get(dateKey)!;
            dayObj.day_total += o.total_amount;
            dayObj.orders.push({
              order_id: o.order_id,
              meal_type: o.meal_type,
              order_time: o.order_time,
              total_amount: o.total_amount,
              items: o.items,
            });
          });
          breakdown = Array.from(dayMap.entries()).map(([date, data]) => ({
            date,
            day_total: data.day_total,
            orders: data.orders,
          }));
        }

        return {
          ...bill.toObject(),
          patient_name: patient ? patient.name : 'Unknown',
          room_number: patient ? patient.room_number : 'N/A',
          day_wise_breakdown: breakdown,
          orders: ordersWithItems,
        };
      })
    );

    return res.status(200).json(enrichedBills);
  } catch (error: any) {
    console.error('Get Admin Bills Error:', error);
    return res.status(500).json({ message: 'Error fetching bills for admin.' });
  }
};

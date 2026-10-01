import mongoose, { Schema, Document } from 'mongoose';

export type PaymentStatus = 'UNPAID' | 'ADVANCE' | 'PAID';

export interface IDayWiseBreakdown {
  date: string;
  day_total: number;
  orders: Array<{
    order_id: string;
    meal_type: string;
    order_time: string;
    total_amount: number;
    items?: any[];
  }>;
}

export interface IBill extends Document {
  bill_id: string;
  patient_id: string;
  billing_date: string;
  billing_period: string;
  total_amount: number;
  advance_amount: number;
  remaining_amount: number;
  payment_status: PaymentStatus;
  due_date: string;
  orders_included: string[];
  day_wise_breakdown?: IDayWiseBreakdown[];
  createdAt: Date;
  updatedAt: Date;
}

const BillSchema: Schema = new Schema(
  {
    bill_id: { type: String, required: true, unique: true, index: true },
    patient_id: { type: String, required: true, index: true },
    billing_date: { type: String, required: true },
    billing_period: { type: String, required: true },
    total_amount: { type: Number, required: true, min: 0 },
    advance_amount: { type: Number, default: 0, min: 0 },
    remaining_amount: { type: Number, required: true, min: 0 },
    payment_status: {
      type: String,
      required: true,
      enum: ['UNPAID', 'ADVANCE', 'PAID'],
      default: 'UNPAID',
    },
    due_date: { type: String, required: true },
    orders_included: { type: [String], default: [] },
    day_wise_breakdown: { type: Schema.Types.Mixed, default: [] },
  },
  {
    timestamps: true,
    collection: 'bills',
  }
);

export const Bill = mongoose.model<IBill>('Bill', BillSchema);

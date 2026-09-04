import mongoose, { Schema, Document } from 'mongoose';

export type PaymentStatus = 'UNPAID' | 'ADVANCE' | 'PAID';

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
  },
  {
    timestamps: true,
  }
);

export const Bill = mongoose.model<IBill>('Bill', BillSchema);

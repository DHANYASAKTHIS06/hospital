import mongoose, { Schema, Document } from 'mongoose';

export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'DELIVERY CONFIRMATION PENDING'
  | 'DELIVERED'
  | 'CANCELLED';

export interface IFoodOrder extends Document {
  order_id: string;
  patient_id: string;
  order_date: string;
  order_time: string;
  meal_type: string;
  total_amount: number;
  order_status: OrderStatus;
  cancellation_reason?: string;
  cancelled_by?: string;
  cancelled_at?: Date;
  admin_delivery_confirmed: boolean;
  patient_delivery_confirmed: boolean;
  admin_delivery_confirmed_at?: Date;
  patient_delivery_confirmed_at?: Date;
  rating?: number;
  feedback_comment?: string;
  feedback_date?: Date;
  has_feedback?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FoodOrderSchema: Schema = new Schema(
  {
    order_id: { type: String, required: true, unique: true, index: true },
    patient_id: { type: String, required: true, index: true },
    order_date: { type: String, required: true },
    order_time: { type: String, required: true },
    meal_type: { type: String, required: true },
    total_amount: { type: Number, required: true, min: 0 },
    order_status: {
      type: String,
      required: true,
      enum: ['PENDING', 'ACCEPTED', 'DELIVERY CONFIRMATION PENDING', 'DELIVERED', 'CANCELLED'],
      default: 'PENDING',
    },
    cancellation_reason: { type: String, default: '' },
    cancelled_by: { type: String, default: '' },
    cancelled_at: { type: Date },
    admin_delivery_confirmed: { type: Boolean, default: false },
    patient_delivery_confirmed: { type: Boolean, default: false },
    admin_delivery_confirmed_at: { type: Date },
    patient_delivery_confirmed_at: { type: Date },
    rating: { type: Number, min: 1, max: 5 },
    feedback_comment: { type: String, default: '' },
    feedback_date: { type: Date },
    has_feedback: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: 'foodorders',
  }
);

export const FoodOrder = mongoose.model<IFoodOrder>('FoodOrder', FoodOrderSchema);

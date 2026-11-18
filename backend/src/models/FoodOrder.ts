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
  order_placed_date?: string;
  delivery_date?: string;
  delivery_day?: string;
  order_time: string;
  meal_type: string;
  serving_time?: string;
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
  is_cleared_from_active_view: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FoodOrderSchema: Schema = new Schema(
  {
    order_id: { type: String, required: true, unique: true, index: true },
    patient_id: { type: String, required: true, index: true },
    order_date: { type: String, required: true },
    order_placed_date: { type: String, default: '' },
    delivery_date: { type: String, default: '', index: true },
    delivery_day: { type: String, default: '' },
    order_time: { type: String, required: true },
    meal_type: { type: String, required: true },
    serving_time: { type: String, default: '' },
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
    is_cleared_from_active_view: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: 'foodorders',
  }
);

export const FoodOrder = mongoose.model<IFoodOrder>('FoodOrder', FoodOrderSchema);

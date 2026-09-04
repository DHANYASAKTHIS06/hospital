import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem extends Document {
  order_item_id: number;
  order_id: string;
  menu_id: number;
  item_name_snapshot: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

const OrderItemSchema: Schema = new Schema(
  {
    order_item_id: { type: Number, required: true },
    order_id: { type: String, required: true, index: true },
    menu_id: { type: Number, required: true },
    item_name_snapshot: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unit_price: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  {
    timestamps: true,
  }
);

export const OrderItem = mongoose.model<IOrderItem>('OrderItem', OrderItemSchema);

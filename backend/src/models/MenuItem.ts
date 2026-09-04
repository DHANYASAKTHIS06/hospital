import mongoose, { Schema, Document } from 'mongoose';

export interface IMenuItem extends Document {
  menu_id: number;
  item_name: string;
  category: 'TEA / MILK' | 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACKS';
  description?: string;
  quantity: string;
  price: number;
  availability: boolean;
  available_days: string[];
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema: Schema = new Schema(
  {
    menu_id: { type: Number, required: true, unique: true },
    item_name: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ['TEA / MILK', 'BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS'],
    },
    description: { type: String, default: '' },
    quantity: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    availability: { type: Boolean, default: true },
    available_days: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    },
  },
  {
    timestamps: true,
  }
);

export const MenuItem = mongoose.model<IMenuItem>('MenuItem', MenuItemSchema);

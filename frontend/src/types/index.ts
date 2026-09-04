export type Role = 'ADMIN' | 'PATIENT';

export interface User {
  id: string;
  role: Role;
  patient_id?: string;
  username?: string;
  name?: string;
  age?: number;
  address?: string;
  room_number?: string;
  mobile?: string;
}

export type Category = 'TEA / MILK' | 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACKS';

export interface MenuItem {
  _id: string;
  menu_id: number;
  item_name: string;
  category: Category;
  description?: string;
  quantity: string;
  price: number;
  availability: boolean;
  available_days: string[];
  is_available_today?: boolean;
  current_day?: string;
}

export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'DELIVERY CONFIRMATION PENDING'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItem {
  _id: string;
  order_item_id: number;
  order_id: string;
  menu_id: number;
  item_name_snapshot: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface FoodOrder {
  _id: string;
  order_id: string;
  patient_id: string;
  patient_name?: string;
  room_number?: string;
  order_date: string;
  order_time: string;
  meal_type: string;
  total_amount: number;
  order_status: OrderStatus;
  cancellation_reason?: string;
  cancelled_by?: string;
  cancelled_at?: string;
  admin_delivery_confirmed: boolean;
  patient_delivery_confirmed: boolean;
  admin_delivery_confirmed_at?: string;
  patient_delivery_confirmed_at?: string;
  items?: OrderItem[];
  createdAt: string;
}

export type PaymentStatus = 'UNPAID' | 'ADVANCE' | 'PAID';

export interface Bill {
  _id: string;
  bill_id: string;
  patient_id: string;
  patient_name?: string;
  room_number?: string;
  billing_date: string;
  billing_period: string;
  total_amount: number;
  advance_amount: number;
  remaining_amount: number;
  payment_status: PaymentStatus;
  due_date: string;
  orders_included: string[];
  orders?: FoodOrder[];
  createdAt: string;
}

export interface PatientRecord {
  _id: string;
  patient_id: string;
  name: string;
  age: number;
  address: string;
  room_number: string;
  mobile: string;
  createdAt: string;
}

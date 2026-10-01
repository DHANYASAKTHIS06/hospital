import mongoose, { Schema, Document } from 'mongoose';

export interface IPatient extends Document {
  patient_id: string;
  name: string;
  age: number;
  address: string;
  room_number: string;
  mobile: string;
  password_hash: string;
  advance_balance: number;
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema: Schema = new Schema(
  {
    patient_id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true },
    address: { type: String, required: true },
    room_number: { type: String, required: true },
    mobile: { type: String, required: true },
    password_hash: { type: String, required: true },
    advance_balance: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    collection: 'patients',
  }
);

export const Patient = mongoose.model<IPatient>('Patient', PatientSchema);

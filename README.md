# 🏥 Hospital Canteen Management System

A full-stack, database-driven web application built strictly for managing food/canteen operations of a hospital.

---

## 🌟 Key Features & Business Rules

### 1. Two User Roles
- **PATIENT**: Registered hospital patients who can view the canteen menu, place food orders, track live order status, confirm food delivery, and view bills/payment status.
- **ADMIN**: Hospital Canteen Manager who can manage menu items (CRUD, price, quantity, availability, available days), receive live orders, accept/cancel orders, confirm delivery, generate bills, and manage payment statuses.

### 2. Authentication & Auto Patient ID
- **Patient Signup**: Automatically generates a unique, read-only Patient ID (e.g. `P20260001`).
- **Patient Login**: Uses generated `Patient ID` + Password.
- **Admin Login**: Uses secure seed credentials (`admin` / `Admin@123`). NO public admin signup!

### 3. Strict Cancellation Prohibitions
- **🔴 Patients can NEVER cancel orders**: No cancel button or patient cancellation API exists. Attempts to call cancellation endpoints as a patient are rejected (`403 Forbidden`).
- **🟢 Only Admin can cancel orders**: Admin can cancel PENDING or ACCEPTED orders with a cancellation reason.

### 4. Dual Delivery Confirmation
- Order status becomes `DELIVERED` **only when BOTH Admin AND Patient have confirmed delivery**.
- Admin confirms delivery -> Sets `admin_delivery_confirmed = true`.
- Patient confirms delivery -> Sets `patient_delivery_confirmed = true`.
- When both are `true`, status transitions to `DELIVERED`.

### 5. Admin-Only Payment Control
- **🔴 Patients can NEVER change payment status**: Patients have a read-only view of bill totals, advance paid, remaining balance, and status badges (`UNPAID`, `ADVANCE`, `PAID`).
- **🟢 Only Admin can change payment status & advance amounts**.

### 6. Price Preservation & Snapshot
- Orders save snapshot item names and prices at the moment of order placement. Future menu price updates do not alter historical orders or bills.

### 7. Room-Wise Daily View & Printing
- Admin can filter orders by Date and Room Number to print room-wise food distribution sheets. Dedicated `@media print` CSS rules hide navigation bars and print clean invoice/report pages.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, React Router v6, Socket.IO Client
- **Backend**: Node.js, Express.js, TypeScript, Mongoose, Socket.IO, JWT, bcryptjs
- **Database**: MongoDB Atlas (`sakthis25sk_db_user`)
- **Deployment**: Render for Backend Service (`https://hospital-lakl.onrender.com`) & Vercel for Frontend

---

## ☁️ Deployment Guide

### 🚀 1. Deploy Backend on Render (`https://hospital-lakl.onrender.com`)
1. Go to [render.com](https://render.com) and create a **Web Service**.
2. Connect your repository and configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start` (or `node dist/server.js`)
3. Add Environment Variables in Render:
   - `DATABASE_URL`: `mongodb+srv://sakthis25sk_db_user:qsLWqrnawvzNSNfx@cluster0.eplvm3s.mongodb.net/hospital_canteen?retryWrites=true&w=majority`
   - `MONGODB_URI`: `mongodb+srv://sakthis25sk_db_user:qsLWqrnawvzNSNfx@cluster0.eplvm3s.mongodb.net/hospital_canteen?retryWrites=true&w=majority`
   - `JWT_SECRET`: `super_secret_hospital_canteen_jwt_key_2026`
   - `NODE_ENV`: `production`

---

### 🌐 2. Deploy Frontend on Vercel
1. Go to [vercel.com](https://vercel.com) and import the repository.
2. Under **Project Settings → Build & Development Settings**:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (runs `vite build`)
   - **Output Directory**: `dist`
3. Add Environment Variable in Vercel:
   - `VITE_BACKEND_URL`: `https://hospital-lakl.onrender.com`
4. Click **Deploy**.

---

## 🔑 Default Credentials

- **Admin Login**:
  - **Username**: `admin`
  - **Password**: `Admin@123`

- **Patient Login**:
  - Register via **Patient Signup** to receive your auto-generated Patient ID (e.g. `P20260001`).

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
- **Database**: MongoDB / MongoDB Atlas (with automatic fallback to `mongodb-memory-server` during local dev)
- **Deployment**: Configured for Vercel Serverless deployment (`vercel.json`)

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js (v18+)

### 1. Backend Setup & Startup
```bash
cd backend
npm install
npm run dev
```
*The backend starts on `http://localhost:5000` and automatically connects to MongoDB (or Memory Server fallback) and seeds the default Admin (`admin` / `Admin@123`) and menu items.*

### 2. Frontend Setup & Startup
```bash
cd frontend
npm install
npm run dev
```
*The frontend will run on `http://localhost:5173`.*

---

## ☁️ Deploying to Vercel with MongoDB Atlas

The repository is pre-configured for Vercel monorepo serverless deployment (`vercel.json` and `api/index.js`).

### 1. Connect MongoDB Atlas
1. Create a MongoDB Atlas cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Obtain your connection string: `mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/hospital_canteen?retryWrites=true&w=majority`

### 2. Deploy to Vercel
1. Push this repository to GitHub / GitLab / Bitbucket.
2. Go to [vercel.com](https://vercel.com) and click **Add New Project**.
3. Import your repository.
4. Set Environment Variables in Vercel settings:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A secure secret key (e.g. `super_secret_hospital_jwt_key_2026`)
   - `NODE_ENV`: `production`
5. Click **Deploy**. Vercel will automatically build the Vite frontend and deploy the Express API routes as serverless functions.

---

## 🔑 Default Credentials

- **Admin Login**:
  - **Username**: `admin`
  - **Password**: `Admin@123`

- **Patient Login**:
  - Register via **Patient Signup** to receive your auto-generated Patient ID (e.g. `P20260001`).
"# hospital" 

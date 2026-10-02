import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { FoodOrder, FoodItemToPrepare } from '../types';
import { PrintableReportsModal } from '../components/PrintableReportsModal';
import {
  Users,
  Clock,
  ShoppingBag,
  IndianRupee,
  CreditCard,
  ChefHat,
  Utensils,
  Filter,
  Lock,
  Unlock,
  Printer,
  Truck,
  Building2,
  RotateCcw,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [allOrders, setAllOrders] = useState<FoodOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOrderingLocked, setIsOrderingLocked] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showOnlyRequired, setShowOnlyRequired] = useState<boolean>(false);

  // Clear Active View Modal
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);

  // Print modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState<'ROOM_WISE' | 'ITEMS_TO_PREPARE'>('ROOM_WISE');

  const { socket } = useSocket();

  const fetchStatsAndOrders = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/orders'),
      ]);
      setStats(statsRes.data);
      setIsOrderingLocked(Boolean(statsRes.data?.is_ordering_locked));
      setAllOrders(ordersRes.data || []);
    } catch (err) {
      console.error('Error fetching admin dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsAndOrders();

    if (socket) {
      socket.on('new_order', () => fetchStatsAndOrders());
      socket.on('order_status_updated', () => fetchStatsAndOrders());
      socket.on('delivery_status_updated', () => fetchStatsAndOrders());
      socket.on('payment_status_updated', () => fetchStatsAndOrders());
      socket.on('ordering_status_changed', (data: { is_ordering_locked: boolean }) => {
        setIsOrderingLocked(data.is_ordering_locked);
      });

      return () => {
        socket.off('new_order');
        socket.off('order_status_updated');
        socket.off('delivery_status_updated');
        socket.off('payment_status_updated');
        socket.off('ordering_status_changed');
      };
    }
  }, [socket]);

  const handleToggleLock = async () => {
    try {
      const res = await api.post('/admin/toggle-ordering-lock', {
        is_ordering_locked: !isOrderingLocked,
      });
      setIsOrderingLocked(res.data.is_ordering_locked);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to toggle ordering lock.');
    }
  };

  const handleConfirmClearActiveView = async () => {
    setClearLoading(true);
    try {
      await api.post('/admin/orders/clear-active-view');
      setIsClearModalOpen(false);
      fetchStatsAndOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to clear active view.');
    } finally {
      setClearLoading(false);
    }
  };

  const handleAdminConfirmDelivery = async (orderId: string) => {
    try {
      await api.post(`/admin/orders/${orderId}/confirm-delivery`);
      fetchStatsAndOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to confirm delivery.');
    }
  };

  const openReport = (type: 'ROOM_WISE' | 'ITEMS_TO_PREPARE') => {
    setReportType(type);
    setIsReportModalOpen(true);
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500 text-xs font-semibold">Loading Admin Dashboard...</div>;
  }

  const foodItemsToPrepare: FoodItemToPrepare[] = stats?.foodItemsToPrepare || [];
  const categories: string[] = ['ALL', 'BREAKFAST', 'LUNCH', 'DINNER', 'TEA / MILK', 'SNACKS'];

  const filteredItems = foodItemsToPrepare.filter((item) => {
    const itemCat = (item.category || '').trim().toUpperCase();
    const itemMeal = (item.meal_type || '').trim().toUpperCase();
    const selCat = selectedCategory.trim().toUpperCase();
    const matchesCategory =
      selCat === 'ALL' ||
      itemCat === selCat ||
      itemMeal === selCat ||
      itemCat.replace(/\s+/g, '') === selCat.replace(/\s+/g, '');
    const matchesRequired = !showOnlyRequired || item.total_preparation_quantity > 0;
    return matchesCategory && matchesRequired;
  });

  const totalPreparationQuantity = foodItemsToPrepare.reduce(
    (sum, item) => sum + item.total_preparation_quantity,
    0
  );

  const distinctItemsToPrepareCount = foodItemsToPrepare.filter(
    (item) => item.total_preparation_quantity > 0
  ).length;

  const activeOrdersList: FoodOrder[] = stats?.recentActiveOrders || [];

  return (
    <div className="space-y-6">
      {/* Title & Lock Controls Bar */}
      <div className="bg-procare-900 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-procare-800">
        <div className="flex items-center space-x-3">
          <img
            src="/procare-logo.png"
            alt="ProCare Logo"
            className="h-14 w-auto object-contain shrink-0 bg-white p-1 rounded-xl shadow-xs"
          />
          <div>
            <span className="text-[10px] font-black text-celadon uppercase tracking-wider">
              PROCARE PHYSIOTHERAPY & REHABILITATION CENTRE
            </span>
            <h1 className="text-xl font-black mt-0.5 tracking-tight text-white">ADMIN CANTEEN DASHBOARD</h1>
            <p className="text-xs text-procare-200 font-medium">Live canteen order processing, preparation aggregation, and print reports.</p>
          </div>
        </div>

        {/* Lock / Unlock Control, Refresh Active View & Report Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Lock / Unlock Toggle */}
          <button
            onClick={handleToggleLock}
            className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer ${
              isOrderingLocked
                ? 'bg-rose-600 hover:bg-rose-500 text-white ring-2 ring-rose-400/50'
                : 'bg-celadon hover:bg-procare-400 text-slate-950'
            }`}
          >
            {isOrderingLocked ? (
              <>
                <Lock className="w-4 h-4" />
                <span>ORDERING IS LOCKED (CLOSED)</span>
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4" />
                <span>ORDERING IS OPEN (UNLOCKED)</span>
              </>
            )}
          </button>

          {/* Refresh / Clear Active View Button */}
          <button
            onClick={() => setIsClearModalOpen(true)}
            className="bg-procare-700 hover:bg-procare-600 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer border border-procare-600"
            title="Clear current view for fresh preparation cycle (Historical DB records preserved)"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Clear / Refresh Cycle View</span>
          </button>

          {/* Printable Report Buttons */}
          <button
            onClick={() => openReport('ROOM_WISE')}
            className="bg-procare-800 hover:bg-procare-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer border border-procare-700"
          >
            <Building2 className="w-4 h-4" />
            <span>Print Room-Wise Report</span>
          </button>

          <button
            onClick={() => openReport('ITEMS_TO_PREPARE')}
            className="bg-celadon hover:bg-procare-400 text-slate-950 px-3.5 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Items to Be Prepared</span>
          </button>
        </div>
      </div>

      {/* Ordering Lock Status Notification Banner */}
      {isOrderingLocked && (
        <div className="p-4 bg-rose-50 border-2 border-rose-300 text-rose-900 rounded-xl text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-rose-600 shrink-0" />
            <span>Ordering Control is LOCKED: Patients cannot place new orders right now. Click "ORDERING IS LOCKED" button above to unlock.</span>
          </div>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center text-gray-500 mb-2">
            <span className="text-xs font-semibold">Total Patients</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-gray-900">{stats?.totalPatients || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center text-blue-600 mb-2">
            <span className="text-xs font-semibold text-gray-500">Active Cycle Orders</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-blue-700">{stats?.activeOrdersCount || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center text-gray-500 mb-2">
            <span className="text-xs font-semibold">Today's Orders</span>
            <ShoppingBag className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold text-gray-900">{stats?.todayOrdersCount || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center text-emerald-700 mb-2">
            <span className="text-xs font-semibold text-gray-500">Today's Revenue</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-800">₹{stats?.todaysRevenue || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center text-rose-600 mb-2">
            <span className="text-xs font-semibold text-gray-500">Pending Payments</span>
            <CreditCard className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold text-rose-700">{stats?.pendingPaymentsCount || 0}</div>
        </div>
      </div>

      {/* FOOD ITEMS TO PREPARE SECTION */}
      <div className="bg-white rounded-xl border border-emerald-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-emerald-100 bg-emerald-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-base font-bold text-emerald-950 flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-emerald-700" />
              FOOD ITEMS TO PREPARE (COOKING DEPARTMENT REPORT)
            </h2>
            <p className="text-xs text-emerald-800 mt-0.5">
              Aggregated total quantities from active cycle orders. Clear active view after preparing report for a fresh cycle.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => openReport('ITEMS_TO_PREPARE')}
              className="bg-emerald-800 hover:bg-emerald-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Kitchen Report</span>
            </button>
            <div className="bg-emerald-100 border border-emerald-300 text-emerald-950 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2">
              <span>Portions to Cook:</span>
              <span className="bg-emerald-700 text-white px-2 py-0.5 rounded-md font-mono text-sm">
                {totalPreparationQuantity}
              </span>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-gray-500" /> Category:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-celadon text-slate-950 font-black shadow-xs border border-procare-400'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-procare-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <label className="inline-flex items-center cursor-pointer text-xs font-semibold text-slate-700 bg-white border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50">
            <input
              type="checkbox"
              checked={showOnlyRequired}
              onChange={(e) => setShowOnlyRequired(e.target.checked)}
              className="rounded border-slate-300 text-procare-700 focus:ring-procare-500 mr-2"
            />
            Show Only Items Needing Preparation ({distinctItemsToPrepareCount})
          </label>
        </div>

        {/* Preparation Items Grid */}
        <div className="p-6">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No food items match the selected filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredItems.map((item) => {
                const isRequired = item.total_preparation_quantity > 0;
                return (
                  <div
                    key={`${item.menu_id}-${item.meal_type || item.category}`}
                    className={`p-4 rounded-xl border transition-all flex justify-between items-center ${
                      isRequired
                        ? 'bg-procare-50/90 border-procare-400 shadow-xs ring-1 ring-procare-400/50'
                        : 'bg-white border-slate-200 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="space-y-1 pr-2">
                      <div className="flex items-center gap-1.5">
                        <Utensils className={`w-3.5 h-3.5 ${isRequired ? 'text-procare-800' : 'text-slate-400'}`} />
                        <span className={`text-xs font-bold ${isRequired ? 'text-procare-950' : 'text-slate-700'}`}>
                          {item.item_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-procare-800 bg-procare-100 px-2 py-0.5 rounded">
                          {item.category}
                        </span>
                        <span className="text-[10px] text-slate-500">{item.portion_size}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`text-lg font-black font-mono px-3 py-1 rounded-lg flex items-center justify-center min-w-[3rem] ${
                          isRequired
                            ? 'bg-celadon text-slate-950 shadow-xs'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        {item.total_preparation_quantity}
                      </div>
                      <span className="text-[9px] font-bold text-slate-500 block mt-0.5">
                        {isRequired ? 'REQUIRED' : 'NONE'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ACTIVE PATIENT ORDERS SECTION */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-procare-800 bg-procare-950 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-celadon" />
            <h2 className="text-sm font-black uppercase tracking-wide">
              ACTIVE CYCLE PATIENT ORDERS
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsClearModalOpen(true)}
              className="bg-procare-700 hover:bg-procare-600 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear / Refresh View</span>
            </button>
            <button
              onClick={() => openReport('ROOM_WISE')}
              className="bg-celadon hover:bg-procare-400 text-slate-950 px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-950" />
              <span>Print Room-Wise Report</span>
            </button>
            <span className="text-xs font-black bg-celadon/30 text-celadon-light px-2.5 py-0.5 rounded-full border border-celadon/40">
              {activeOrdersList.length} Active Orders
            </span>
          </div>
        </div>

        {activeOrdersList.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-xs">
            No active cycle orders currently displayed. (New patient orders will appear here automatically).
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {activeOrdersList.map((order: FoodOrder) => (
              <div key={order._id} className="p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-base font-bold text-blue-700">{order.order_id}</span>
                    <span className="text-xs font-bold text-gray-900 bg-blue-50 text-blue-900 border border-blue-200 px-2.5 py-0.5 rounded">
                      Patient: {order.patient_name} ({order.patient_id})
                    </span>
                    <span className="text-xs font-extrabold text-slate-900 bg-slate-100 border border-slate-300 px-2.5 py-0.5 rounded">
                      Room #{order.room_number || 'N/A'}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      {order.order_date} • {order.order_time} ({order.meal_type})
                    </span>
                  </div>

                  {/* Food Items Summary */}
                  <div className="text-xs text-gray-700 font-medium">
                    {order.items?.map((it) => (
                      <span key={it._id} className="inline-block bg-white border border-gray-200 px-2.5 py-1 rounded mr-2 my-0.5">
                        <strong>{it.item_name_snapshot}</strong> × {it.quantity} (₹{it.subtotal})
                      </span>
                    ))}
                  </div>

                  <div className="text-xs font-extrabold text-slate-900">
                    Total Amount: ₹{order.total_amount}
                  </div>
                </div>

                {/* Admin Delivery Button */}
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => handleAdminConfirmDelivery(order.order_id)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Truck className="w-4 h-4" />
                    <span>MARK ORDER AS DELIVERED</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: Clear Active Orders View Confirmation */}
      {isClearModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 text-purple-700">
              <div className="p-3 rounded-2xl bg-purple-100 shrink-0 text-purple-700">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Clear Active Cycle View?</h3>
                <p className="text-xs text-slate-500 font-medium">Start a fresh order preparation cycle</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed bg-purple-50/70 p-4 rounded-xl border border-purple-200/80">
              This will clear the current orders from the active dashboard view so you can prepare a fresh cycle of reports.
              <br /><br />
              <strong className="text-slate-900 font-bold">Important:</strong> Historical order records in MongoDB database and final patient discharge bills will <strong className="text-purple-900 underline">NOT</strong> be deleted.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearActiveView}
                disabled={clearLoading}
                className="flex-1 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {clearLoading ? 'Clearing View...' : 'Confirm Clear View'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Reports Modal Component */}
      <PrintableReportsModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        reportType={reportType}
        orders={allOrders}
        foodItemsToPrepare={foodItemsToPrepare}
      />
    </div>
  );
};

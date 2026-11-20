import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useLanguage } from '../context/LanguageContext';
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
  Coffee,
  Megaphone,
  Send,
  XCircle,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [allOrders, setAllOrders] = useState<FoodOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOrderingLocked, setIsOrderingLocked] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showOnlyRequired, setShowOnlyRequired] = useState<boolean>(true);

  // Clear Active View Modal
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);

  // Print modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState<'ROOM_WISE' | 'ITEMS_TO_PREPARE'>('ROOM_WISE');

  // Announcement state
  const [announcementText, setAnnouncementText] = useState<string>('');
  const [activeAnnouncement, setActiveAnnouncement] = useState<{ is_active: boolean; text: string; published_at: string | null } | null>(null);
  const [announceLoading, setAnnounceLoading] = useState(false);
  const [announceError, setAnnounceError] = useState('');

  const { socket } = useSocket();
  const { t, language, translateFood, translateCategory, translateSlot } = useLanguage();

  const isTa = language === 'ta';

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

  const fetchAnnouncement = async () => {
    try {
      const res = await api.get('/admin/announcement');
      setActiveAnnouncement(res.data);
      // Pre-fill text area with current announcement for easy editing
      if (res.data?.is_active && res.data?.text) {
        setAnnouncementText(res.data.text);
      }
    } catch (err) {
      console.error('Error fetching announcement:', err);
    }
  };

  useEffect(() => {
    fetchStatsAndOrders();
    fetchAnnouncement();

    if (socket) {
      const handleRefresh = () => fetchStatsAndOrders();
      const handleLockChange = (data: { is_ordering_locked: boolean }) => {
        setIsOrderingLocked(data.is_ordering_locked);
      };
      const handleAnnouncementUpdate = (data: any) => {
        setActiveAnnouncement(data);
      };

      socket.on('new_order', handleRefresh);
      socket.on('order_status_updated', handleRefresh);
      socket.on('delivery_status_updated', handleRefresh);
      socket.on('payment_status_updated', handleRefresh);
      socket.on('ordering_status_changed', handleLockChange);
      socket.on('announcement_updated', handleAnnouncementUpdate);

      return () => {
        socket.off('new_order', handleRefresh);
        socket.off('order_status_updated', handleRefresh);
        socket.off('delivery_status_updated', handleRefresh);
        socket.off('payment_status_updated', handleRefresh);
        socket.off('ordering_status_changed', handleLockChange);
        socket.off('announcement_updated', handleAnnouncementUpdate);
      };
    }
  }, [socket]);

  const handlePublishAnnouncement = async () => {
    if (!announcementText.trim()) {
      setAnnounceError(isTa ? 'அறிவிப்பு உரை காலியாக உள்ளது.' : 'Announcement text cannot be empty.');
      return;
    }
    setAnnounceError('');
    setAnnounceLoading(true);
    try {
      const res = await api.post('/admin/announcement/publish', { text: announcementText.trim() });
      setActiveAnnouncement(res.data.announcement);
    } catch (err: any) {
      setAnnounceError(err.response?.data?.message || (isTa ? 'அறிவிப்பை வெளியிடுவதில் தோல்வி.' : 'Failed to publish announcement.'));
    } finally {
      setAnnounceLoading(false);
    }
  };

  const handleEndAnnouncement = async () => {
    setAnnounceLoading(true);
    try {
      const res = await api.post('/admin/announcement/end');
      setActiveAnnouncement(res.data.announcement);
      setAnnouncementText('');
      setAnnounceError('');
    } catch (err: any) {
      setAnnounceError(err.response?.data?.message || (isTa ? 'அறிவிப்பை நிறுத்துவதில் தோல்வி.' : 'Failed to end announcement.'));
    } finally {
      setAnnounceLoading(false);
    }
  };

  const handleToggleLock = async () => {
    try {
      const res = await api.post('/admin/toggle-ordering-lock', {
        is_ordering_locked: !isOrderingLocked,
      });
      setIsOrderingLocked(res.data.is_ordering_locked);
    } catch (err: any) {
      alert(err.response?.data?.message || (isTa ? 'ஆர்டர் பூட்டு நிலையை மாற்றுவதில் தோல்வி.' : 'Failed to toggle ordering lock.'));
    }
  };

  const handleConfirmClearActiveView = async () => {
    setClearLoading(true);
    try {
      await api.post('/admin/orders/clear-active-view');
      setIsClearModalOpen(false);
      fetchStatsAndOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || (isTa ? 'பார்வையை மீட்டமைப்பதில் தோல்வி.' : 'Failed to clear active view.'));
    } finally {
      setClearLoading(false);
    }
  };

  const handleAdminConfirmDelivery = async (orderId: string) => {
    try {
      await api.post(`/admin/orders/${orderId}/confirm-delivery`);
      fetchStatsAndOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || (isTa ? 'டெலிவரியை உறுதிப்படுத்துவதில் தோல்வி.' : 'Failed to confirm delivery.'));
    }
  };

  const openReport = (type: 'ROOM_WISE' | 'ITEMS_TO_PREPARE') => {
    setReportType(type);
    setIsReportModalOpen(true);
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500 text-xs font-semibold">
        {isTa ? 'நிர்வாக முகப்புப்பலகை ஏற்றப்படுகிறது...' : 'Loading Admin Dashboard...'}
      </div>
    );
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
              {t('appName')} • {t('clinicName')}
            </span>
            <h1 className="text-xl font-black mt-0.5 tracking-tight text-white">
              {isTa ? 'நிர்வாக கேன்டீன் முகப்புப்பலகை' : 'ADMIN CANTEEN DASHBOARD'}
            </h1>
            <p className="text-xs text-procare-200 font-medium">
              {isTa
                ? 'நேரலை கேன்டீன் ஆர்டர் செயலாக்கம், தயாரிப்பு ஒருங்கிணைப்பு மற்றும் அச்சு அறிக்கைகள்.'
                : 'Live canteen order processing, preparation aggregation, and print reports.'}
            </p>
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
                <span>{isTa ? 'ஆர்டர் முடக்கப்பட்டுள்ளது (மூடப்பட்டது)' : 'ORDERING IS LOCKED (CLOSED)'}</span>
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4" />
                <span>{isTa ? 'ஆர்டர் திறக்கப்பட்டுள்ளது (செயலில்)' : 'ORDERING IS OPEN (UNLOCKED)'}</span>
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
            <span>{isTa ? 'பார்வையை மீட்டமை' : 'Clear / Refresh Cycle View'}</span>
          </button>

          {/* Printable Report Buttons */}
          <button
            onClick={() => openReport('ROOM_WISE')}
            className="bg-procare-800 hover:bg-procare-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer border border-procare-700"
          >
            <Building2 className="w-4 h-4" />
            <span>{isTa ? 'அறை வாரியான அறிக்கை அச்சிடு' : 'Print Room-Wise Report'}</span>
          </button>

          <button
            onClick={() => openReport('ITEMS_TO_PREPARE')}
            className="bg-celadon hover:bg-procare-400 text-slate-950 px-3.5 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{isTa ? 'தயாரிப்புப் பட்டியல் அச்சிடு' : 'Print Items to Be Prepared'}</span>
          </button>
        </div>
      </div>

      {/* Ordering Lock Status Notification Banner */}
      {isOrderingLocked && (
        <div className="p-4 bg-rose-50 border-2 border-rose-300 text-rose-900 rounded-xl text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-rose-600 shrink-0" />
            <span>
              {isTa
                ? 'ஆர்டர் முடக்கப்பட்டுள்ளது: நோயாளிகள் இப்போது புதிய உணவுகளை ஆர்டர் செய்ய முடியாது. திறக்க மேலே உள்ள பொத்தானைக் கிளிக் செய்யவும்.'
                : 'Ordering Control is LOCKED: Patients cannot place new orders right now. Click "ORDERING IS LOCKED" button above to unlock.'}
            </span>
          </div>
        </div>
      )}

      {/* ─── ANNOUNCEMENTS SECTION ─── */}
      <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-amber-100 bg-amber-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-600 text-white rounded-lg">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-amber-950 uppercase tracking-wide">
                {isTa ? 'அறிவிப்புகள்' : 'Announcements'}
              </h2>
              <p className="text-[10px] text-amber-800 font-medium">
                {isTa ? 'அனைத்து நோயாளிகளுக்கும் ஒரு நேரடி அறிவிப்பை அனுப்பவும்.' : 'Send a live announcement visible to all patients.'}
              </p>
            </div>
          </div>
          {activeAnnouncement?.is_active && (
            <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full">
              {isTa ? 'நேரடி' : 'LIVE'}
            </span>
          )}
        </div>

        <div className="p-5 space-y-3">
          {/* Currently Active Announcement Display */}
          {activeAnnouncement?.is_active && activeAnnouncement?.text && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3">
              <Megaphone className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider block mb-1">
                  {isTa ? 'தற்போது செயலில் உள்ள அறிவிப்பு' : 'Currently Active Announcement'}
                </span>
                <p className="text-sm font-bold text-amber-950 whitespace-pre-wrap break-words">{activeAnnouncement.text}</p>
                {activeAnnouncement.published_at && (
                  <span className="text-[10px] text-amber-600 font-medium mt-1 block">
                    {isTa ? 'வெளியிடப்பட்டது:' : 'Published:'} {new Date(activeAnnouncement.published_at).toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              <button
                onClick={handleEndAnnouncement}
                disabled={announceLoading}
                className="shrink-0 bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title={isTa ? 'அறிவிப்பை நிறுத்து' : 'End Announcement'}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>{isTa ? 'அறிவிப்பை நிறுத்து' : 'End Announcement'}</span>
              </button>
            </div>
          )}

          {/* Compose / Update Announcement */}
          <div className="space-y-2">
            <textarea
              value={announcementText}
              onChange={(e) => { setAnnouncementText(e.target.value); setAnnounceError(''); }}
              placeholder={isTa ? 'இங்கே அறிவிப்பை தட்டச்சு செய்யவும்...' : 'Type your announcement here...'}
              rows={3}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 resize-none"
            />
            {announceError && (
              <p className="text-xs font-bold text-rose-600">{announceError}</p>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePublishAnnouncement}
                disabled={announceLoading || !announcementText.trim()}
                className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{announceLoading ? (isTa ? 'அனுப்புகிறது...' : 'Publishing...') : activeAnnouncement?.is_active ? (isTa ? 'அறிவிப்பை புதுப்பி' : 'Update Announcement') : (isTa ? 'அறிவிப்பை வெளியிடு' : 'Publish Announcement')}</span>
              </button>
              {activeAnnouncement?.is_active && (
                <span className="text-[10px] text-slate-500 font-medium">
                  {isTa ? 'புதிய அறிவிப்பை வெளியிடுவதற்கு முன், தற்போதைய அறிவிப்பை நிறுத்தவும் அல்லது உரையை மாற்றி புதுப்பி பொத்தானை அழுத்தவும்.' : 'End the current announcement first, or update its text and click Update.'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center text-gray-500 mb-2">
            <span className="text-xs font-semibold">{t('totalPatients')}</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-gray-900">{stats?.totalPatients || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center text-blue-600 mb-2">
            <span className="text-xs font-semibold text-gray-500">
              {isTa ? 'செயலில் உள்ள ஆர்டர்கள்' : 'Active Cycle Orders'}
            </span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-blue-700">{stats?.activeOrdersCount || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center text-gray-500 mb-2">
            <span className="text-xs font-semibold">{isTa ? 'இன்றைய ஆர்டர்கள்' : "Today's Orders"}</span>
            <ShoppingBag className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold text-gray-900">{stats?.todayOrdersCount || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center text-emerald-700 mb-2">
            <span className="text-xs font-semibold text-gray-500">{isTa ? 'இன்றைய வருவாய்' : "Today's Revenue"}</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-800">₹{stats?.todaysRevenue || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center text-rose-600 mb-2">
            <span className="text-xs font-semibold text-gray-500">{t('pendingPayments')}</span>
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
              {isTa
                ? 'தயாரிக்க வேண்டிய உணவுகள் (சமையல் துறை அறிக்கை)'
                : 'FOOD ITEMS TO PREPARE (COOKING DEPARTMENT REPORT)'}
            </h2>
            <p className="text-xs text-emerald-800 mt-0.5">
              {isTa
                ? 'செயலில் உள்ள ஆர்டர்களில் இருந்து கணக்கிடப்பட்ட மொத்த அளவுகள்.'
                : 'Aggregated total quantities from active cycle orders. Clear active view after preparing report for a fresh cycle.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => openReport('ITEMS_TO_PREPARE')}
              className="bg-emerald-800 hover:bg-emerald-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t('printKitchenReport')}</span>
            </button>
            <div className="bg-emerald-100 border border-emerald-300 text-emerald-950 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2">
              <span>{isTa ? 'சமைக்க வேண்டிய அளவுகள்:' : 'Portions to Cook:'}</span>
              <span className="bg-emerald-700 text-white px-2 py-0.5 rounded-md font-mono text-sm">
                {totalPreparationQuantity}
              </span>
            </div>
          </div>
        </div>

        {/* DEDICATED TEA/MILK AND COFFEE PREPARATION TABLE (GROUPED BY 4 SERVING TIMES) */}
        <div className="border-b border-emerald-100 bg-amber-50/50 p-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-600 text-white rounded-lg">
                <Coffee className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-amber-950 uppercase tracking-wide">
                  {t('beveragePrepTitle')}
                </h3>
                <p className="text-[11px] text-amber-800 font-medium">
                  {t('beveragePrepSub')}
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-amber-200 bg-white shadow-2xs">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-amber-100 text-amber-950 font-black border-b border-amber-200 uppercase text-[11px]">
                  <th className="p-2.5 w-36 border-r border-amber-200">{isTa ? 'வழங்கும் நேரம்' : 'Serving Time'}</th>
                  <th className="p-2.5 border-r border-amber-200">{isTa ? 'உணவு' : 'Item'}</th>
                  <th className="p-2.5 text-center w-36 bg-amber-200/60 font-black">{isTa ? 'மொத்த அளவு' : 'Total Quantity'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100 text-slate-800 font-medium">
                {(stats?.teaCoffeeSlots || [
                  { serving_time: '7:00 AM', items: [], subtotal: 0 },
                  { serving_time: '11:00 AM', items: [], subtotal: 0 },
                  { serving_time: '4:00 PM', items: [], subtotal: 0 },
                  { serving_time: '7:00 PM', items: [], subtotal: 0 },
                ]).map((slotGroup: any) => {
                  const itemsToDisplay = (slotGroup.items || []).filter((it: any) => it.total_quantity > 0);
                  if (itemsToDisplay.length === 0) {
                    return (
                      <tr key={slotGroup.serving_time} className="hover:bg-amber-50/40">
                        <td className="p-2.5 border-r border-amber-100 font-black text-amber-900 bg-amber-50/30">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-700" />
                            <span>{translateSlot(slotGroup.serving_time)}</span>
                          </div>
                        </td>
                        <td className="p-2.5 border-r border-amber-100 text-slate-400 italic">
                          {isTa ? 'ஆர்டர்கள் எதுவும் இல்லை' : 'No orders scheduled'}
                        </td>
                        <td className="p-2.5 text-center font-bold text-slate-400">0 {isTa ? 'எண்ணிக்கை' : 'Nos'}</td>
                      </tr>
                    );
                  }
                  return itemsToDisplay.map((item: any, idx: number) => (
                    <tr key={`${slotGroup.serving_time}-${item.item_name}`} className="hover:bg-amber-50/40">
                      {idx === 0 && (
                        <td
                          rowSpan={itemsToDisplay.length}
                          className="p-2.5 border-r border-amber-100 font-black text-amber-900 bg-amber-50/50 align-top"
                        >
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-700" />
                            <span>{translateSlot(slotGroup.serving_time)}</span>
                          </div>
                          <span className="text-[10px] text-amber-700 block font-normal mt-0.5">
                            {isTa ? 'பிரிவு மொத்தம்:' : 'Slot Total:'}{' '}
                            <strong>{slotGroup.subtotal} {isTa ? 'எண்ணிக்கை' : 'Nos'}</strong>
                          </span>
                        </td>
                      )}
                      <td className="p-2.5 border-r border-amber-100 font-bold text-slate-900">
                        {translateFood(item.item_name)}
                      </td>
                      <td className="p-2.5 text-center font-black text-sm font-mono text-amber-950 bg-amber-50/60">
                        {item.total_quantity} {isTa ? 'எண்ணிக்கை' : 'Nos'}
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Filters */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-gray-500" /> {t('category')}:
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
                {translateCategory(cat)}
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
            {isTa
              ? `தயாரிக்க வேண்டிய உணவுகளை மட்டும் காட்டு (${distinctItemsToPrepareCount})`
              : `Show Only Items Needing Preparation (${distinctItemsToPrepareCount})`}
          </label>
        </div>

        {/* Preparation Items Grid */}
        <div className="p-6">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              {isTa ? 'தேர்ந்தெடுக்கப்பட்ட வடிகட்டலுக்கு உணவுகள் எதுவும் பொருந்தவில்லை.' : 'No food items match the selected filter.'}
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
                          {translateFood(item.item_name)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-procare-800 bg-procare-100 px-2 py-0.5 rounded">
                          {translateCategory(item.category)}
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
                        {isRequired ? (isTa ? 'தேவை' : 'REQUIRED') : (isTa ? 'இல்லை' : 'NONE')}
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
              {isTa ? 'செயலில் உள்ள நோயாளி ஆர்டர்கள்' : 'ACTIVE CYCLE PATIENT ORDERS'}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsClearModalOpen(true)}
              className="bg-procare-700 hover:bg-procare-600 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isTa ? 'பார்வையை மீட்டமை' : 'Clear / Refresh View'}</span>
            </button>
            <button
              onClick={() => openReport('ROOM_WISE')}
              className="bg-celadon hover:bg-procare-400 text-slate-950 px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-950" />
              <span>{isTa ? 'அறை அறிக்கை' : 'Print Room-Wise Report'}</span>
            </button>
            <span className="text-xs font-black bg-celadon/30 text-celadon-light px-2.5 py-0.5 rounded-full border border-celadon/40">
              {activeOrdersList.length} {isTa ? 'ஆர்டர்கள்' : 'Active Orders'}
            </span>
          </div>
        </div>

        {activeOrdersList.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-xs">
            {isTa
              ? 'செயலில் உள்ள ஆர்டர்கள் எதுவும் இல்லை. (புதிய நோயாளி ஆர்டர்கள் தானாகவே இங்கே தோன்றும்).'
              : 'No active cycle orders currently displayed. (New patient orders will appear here automatically).'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {activeOrdersList.map((order: FoodOrder) => (
              <div key={order._id} className="p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-base font-bold text-blue-700">{order.order_id}</span>
                    <span className="text-xs font-bold text-gray-900 bg-blue-50 text-blue-900 border border-blue-200 px-2.5 py-0.5 rounded">
                      {isTa ? 'நோயாளி:' : 'Patient:'} {order.patient_name} ({order.patient_id})
                    </span>
                    <span className="text-xs font-extrabold text-slate-900 bg-slate-100 border border-slate-300 px-2.5 py-0.5 rounded">
                      {isTa ? 'அறை' : 'Room'} #{order.room_number || 'N/A'}
                    </span>
                    <span className="text-xs bg-emerald-100 text-emerald-950 border border-emerald-300 font-extrabold px-2.5 py-0.5 rounded">
                      {isTa ? 'டெலிவரி:' : 'Delivery:'} {order.delivery_date || order.order_date}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      {isTa ? 'ஆர்டர்:' : 'Placed:'} {order.order_placed_date || order.order_date} • {order.order_time} ({translateCategory(order.meal_type)})
                    </span>
                    {order.serving_time && (
                      <span className="text-xs bg-amber-50 border border-amber-300 text-amber-900 font-bold px-2 py-0.5 rounded inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-700" />
                        {isTa ? 'வழங்கும் நேரம்:' : 'Serving Time:'} {translateSlot(order.serving_time)}
                      </span>
                    )}
                  </div>

                  {/* Food Items Summary */}
                  <div className="text-xs text-gray-700 font-medium">
                    {order.items?.map((it) => (
                      <span key={it._id} className="inline-block bg-white border border-gray-200 px-2.5 py-1 rounded mr-2 my-0.5">
                        <strong>{translateFood(it.item_name_snapshot)}</strong> × {it.quantity} (₹{it.subtotal})
                        {it.serving_time && (
                          <span className="ml-1 text-[10px] text-amber-800 font-bold">
                            ({translateSlot(it.serving_time)})
                          </span>
                        )}
                      </span>
                    ))}
                  </div>

                  <div className="text-xs font-extrabold text-slate-900">
                    {isTa ? 'மொத்தத் தொகை:' : 'Total Amount:'} ₹{order.total_amount}
                  </div>
                </div>

                {/* Admin Delivery Button */}
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => handleAdminConfirmDelivery(order.order_id)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Truck className="w-4 h-4" />
                    <span>{isTa ? 'டெலிவரி செய்யப்பட்டதாக குறி' : 'MARK ORDER AS DELIVERED'}</span>
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
                <h3 className="text-base font-extrabold text-slate-900">
                  {isTa ? 'செயலில் உள்ள பார்வையை அழிக்கவா?' : 'Clear Active Cycle View?'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {isTa ? 'புதிய தயாரிப்பு சுழற்சியைத் தொடங்கு' : 'Start a fresh order preparation cycle'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed bg-purple-50/70 p-4 rounded-xl border border-purple-200/80">
              {isTa
                ? 'இது தற்போதைய ஆர்டர்களை செயலில் உள்ள பார்வையில் இருந்து அழிக்கும், இதனால் புதிய சுழற்சியை நீங்கள் தொடங்கலாம். தரவுத்தளத்தில் உள்ள வரலாற்று பதிவுகளோ அல்லது பில்களோ நீக்கப்படாது.'
                : 'This will clear the current orders from the active dashboard view so you can prepare a fresh cycle of reports. Historical order records in database will NOT be deleted.'}
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmClearActiveView}
                disabled={clearLoading}
                className="flex-1 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {clearLoading ? (isTa ? 'அழிக்கப்படுகிறது...' : 'Clearing View...') : (isTa ? 'பார்வையை அழி' : 'Confirm Clear View')}
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

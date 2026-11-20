import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { FoodOrder, Bill } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Link } from 'react-router-dom';
import {
  Utensils,
  ShoppingBag,
  CreditCard,
  Clock,
  FileText,
  ArrowRight,
  UserCheck,
  Phone,
  Bed,
  History,
  User,
  Megaphone,
} from 'lucide-react';
import { translateToTamil } from '../utils/translate';

export const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { t, language, translateFood } = useLanguage();

  const [activeOrders, setActiveOrders] = useState<FoodOrder[]>([]);
  const [latestBill, setLatestBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [announcement, setAnnouncement] = useState<{ is_active: boolean; text: string; text_en?: string; text_ta?: string; published_at: string | null } | null>(null);
  const [translatedTaText, setTranslatedTaText] = useState<string>('');

  const isTa = language === 'ta';

  // Auto-translate announcement to Tamil on client side when text_ta is missing
  useEffect(() => {
    if (announcement?.is_active && !announcement.text_ta && (announcement.text_en || announcement.text)) {
      translateToTamil(announcement.text_en || announcement.text || '').then((t) => {
        setTranslatedTaText(t);
      });
    } else {
      setTranslatedTaText('');
    }
  }, [announcement]);

  const fetchData = async () => {
    try {
      const [ordersRes, billsRes, announcementRes] = await Promise.all([
        api.get('/patient/orders'),
        api.get('/patient/bills'),
        api.get('/patient/announcement').catch(() => ({ data: null })),
      ]);

      const active = ordersRes.data.filter(
        (o: FoodOrder) => o.order_status !== 'DELIVERED' && o.order_status !== 'CANCELLED'
      );
      setActiveOrders(active);

      if (billsRes.data && billsRes.data.length > 0) {
        setLatestBill(billsRes.data[0]);
      } else {
        setLatestBill(null);
      }

      if (announcementRes.data?.is_active) {
        setAnnouncement(announcementRes.data);
      } else {
        setAnnouncement(null);
      }
    } catch (err) {
      console.error('Error loading patient dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (socket) {
      const handleDataRefresh = () => fetchData();
      const handleAnnouncementUpdate = (data: any) => {
        if (data?.is_active) {
          setAnnouncement(data);
        } else {
          setAnnouncement(null);
        }
      };
      socket.on('order_status_updated', handleDataRefresh);
      socket.on('delivery_status_updated', handleDataRefresh);
      socket.on('payment_status_updated', handleDataRefresh);
      socket.on('announcement_updated', handleAnnouncementUpdate);

      return () => {
        socket.off('order_status_updated', handleDataRefresh);
        socket.off('delivery_status_updated', handleDataRefresh);
        socket.off('payment_status_updated', handleDataRefresh);
        socket.off('announcement_updated', handleAnnouncementUpdate);
      };
    }
  }, [socket]);

  const quickNavTabs = [
    {
      title: isTa ? 'உணவு மெனு' : 'Meal Menu',
      path: '/patient/menu',
      icon: Utensils,
      desc: isTa ? 'புதிய காலை, மதிய & இரவு உணவை ஆர்டர் செய்க' : 'Order fresh breakfast, lunch & dinner',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      title: t('navOrders'),
      path: '/patient/orders',
      icon: ShoppingBag,
      desc: isTa ? 'நேரலை ஆர்டர் நிலை மற்றும் கருத்து சமர்ப்பிக்கவும்' : 'Track live order status & submit feedback',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      title: t('navFoodHistory'),
      path: '/patient/food-history',
      icon: History,
      desc: isTa ? 'முந்தைய உணவு ஆர்டர்கள் மற்றும் தேதிகளைப் பார்க்கவும்' : 'View past ordered meals & dates',
      color: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      title: t('navBills'),
      path: '/patient/bills',
      icon: FileText,
      desc: isTa ? 'தினசரி ரசீதுகளைப் பார்த்து அச்சிடவும்' : 'View day-wise bills & print receipts',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      title: t('navPaymentStatus'),
      path: '/patient/payment-status',
      icon: CreditCard,
      desc: isTa ? 'முன்பண இருப்பு மற்றும் கட்டண சுருக்கம்' : 'Check advance balance & billing summary',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      title: isTa ? 'சுயவிவர விவரங்கள்' : 'Profile Details',
      path: '/patient/profile',
      icon: User,
      desc: isTa ? 'சுயவிவரம் மற்றும் அறை விவரங்களை நிர்வகிக்கவும்' : 'Manage your patient profile & room details',
      color: 'bg-rose-50 text-rose-700 border-rose-200',
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Patient Welcome Header Card */}
      <div className="bg-procare-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm border border-procare-800 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-celadon/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3">
            <img
              src="/procare-logo.png"
              alt="ProCare Logo"
              className="h-16 w-auto object-contain shrink-0 bg-white p-1 rounded-xl shadow-xs"
            />
            <div className="space-y-1">
              <span className="inline-flex items-center text-[10px] font-black uppercase tracking-wider bg-celadon text-slate-950 px-2.5 py-0.5 rounded-full border border-celadon">
                {isTa ? 'ப்ரோகேர் கேன்டீன் நோயாளி போர்டல்' : 'PROCARE CANTEEN PATIENT PORTAL'}
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
                {isTa ? `நல்வரவு, ${user?.name || 'நோயாளி'}` : `Welcome, ${user?.name || 'Patient'}`}
              </h1>

              {/* Quick Details Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div className="inline-flex items-center gap-1.5 bg-procare-800/80 text-white text-xs font-semibold px-2.5 py-1 rounded-lg border border-procare-700">
                  <UserCheck className="w-3.5 h-3.5 text-celadon" />
                  <span>
                    {isTa ? 'அடையாள எண்' : 'ID'}:{' '}
                    <strong className="font-mono text-white">{user?.patient_id || 'N/A'}</strong>
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-procare-800/80 text-white text-xs font-semibold px-2.5 py-1 rounded-lg border border-procare-700">
                  <Bed className="w-3.5 h-3.5 text-celadon" />
                  <span>
                    {isTa ? 'அறை' : 'Room'}:{' '}
                    <strong className="text-white">#{user?.room_number || 'N/A'}</strong>
                  </span>
                </div>
                {user?.mobile && (
                  <div className="inline-flex items-center gap-1.5 bg-procare-800/80 text-white text-xs font-semibold px-2.5 py-1 rounded-lg border border-procare-700">
                    <Phone className="w-3.5 h-3.5 text-celadon" />
                    <span>
                      {isTa ? 'கைபேசி' : 'Mob'}:{' '}
                      <strong className="text-white">{user.mobile}</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Link
            to="/patient/menu"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-celadon hover:bg-procare-400 text-slate-950 font-black text-xs sm:text-sm px-5 py-3 rounded-xl shadow-xs transition-all transform active:scale-95 shrink-0 cursor-pointer"
          >
            <Utensils className="w-4 h-4 text-slate-950" />
            <span>{isTa ? 'மெனுவைப் பார்த்து ஆர்டர் செய்க' : 'View Menu & Order'}</span>
          </Link>
        </div>
      </div>

      {/* ─── ANNOUNCEMENT BANNER (shown only when active) ─── */}
      {announcement?.is_active && (announcement?.text_en || announcement?.text_ta || announcement?.text) && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-600 text-white rounded-xl shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-black text-amber-800 uppercase tracking-wider mb-1">
                {isTa ? 'அறிவிப்பு' : 'Announcement'}
              </h3>
              <p className="text-sm font-bold text-amber-950 whitespace-pre-wrap break-words leading-relaxed">
                {isTa ? (announcement.text_ta || translatedTaText || announcement.text_en || announcement.text) : (announcement.text_en || announcement.text)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Access Navigation Tabs Grid */}
      <div className="space-y-2">
        <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-1">
          {isTa ? 'நோயாளி போர்டல் வழிசெலுத்தல்' : 'Patient Portal Navigation Tabs'}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickNavTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className="bg-white border border-slate-200/80 hover:border-procare-400 p-3.5 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-2 group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-xl border ${tab.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-procare-900 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 group-hover:text-procare-950">{tab.title}</h3>
                  <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">{tab.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* Active Orders Widget */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                {t('activeFoodOrders')}
              </h2>
              <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100">
                {activeOrders.length} {isTa ? 'செயலில்' : 'Active'}
              </span>
            </div>

            {loading ? (
              <div className="text-xs text-slate-400 py-6 text-center animate-pulse">
                {isTa ? 'செயலில் உள்ள ஆர்டர்கள் ஏற்றப்படுகின்றன...' : 'Loading active orders...'}
              </div>
            ) : activeOrders.length === 0 ? (
              <div className="text-center py-8 text-slate-500 space-y-2">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-300">
                  <Clock className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-700">{t('noActiveOrders')}</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  {t('noActiveOrdersSub')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeOrders.map((order) => (
                  <div key={order._id} className="border border-slate-200/80 rounded-xl p-3.5 bg-slate-50/50 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="font-mono text-xs font-bold text-blue-700">{order.order_id}</span>
                        <div className="text-[11px] text-slate-500 font-medium">
                          <span className="font-bold text-emerald-800">
                            {isTa ? 'டெலிவரி:' : 'Delivery:'} {order.delivery_date || order.order_date}
                          </span>{' '}
                          • {order.order_time}
                        </div>
                      </div>
                      <StatusBadge status={order.order_status} />
                    </div>

                    <div className="text-xs text-slate-700 font-medium">
                      {order.items?.map((item) => (
                        <span
                          key={item._id}
                          className="inline-block bg-white border border-slate-200 px-2 py-0.5 rounded-md mr-1.5 mb-1 text-[11px]"
                        >
                          {translateFood(item.item_name_snapshot)} × <strong>{item.quantity}</strong>
                        </span>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-900">
                        {isTa ? 'மொத்தம்' : 'Total'}: ₹{order.total_amount}
                      </span>
                      <Link
                        to="/patient/orders"
                        className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1 text-xs"
                      >
                        <span>{t('trackOrder')}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 text-right">
            <Link
              to="/patient/orders"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              <span>{t('viewFullHistory')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Current Bill & Payment Status Widget */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <CreditCard className="w-4 h-4" />
                </div>
                {t('billPaymentStatus')}
              </h2>
              {latestBill && <StatusBadge status={latestBill.payment_status} type="payment" />}
            </div>

            {loading ? (
              <div className="text-xs text-slate-400 py-6 text-center animate-pulse">
                {isTa ? 'ரசீது விவரங்கள் ஏற்றப்படுகின்றன...' : 'Loading billing details...'}
              </div>
            ) : !latestBill ? (
              <div className="text-center py-8 text-slate-500 space-y-2">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-300">
                  <FileText className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-700">{t('noBillsGenerated')}</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  {t('noBillsGeneratedSub')}
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">{isTa ? 'ரசீது எண்:' : 'Bill ID:'}</span>
                    <span className="font-bold text-slate-900 font-mono">{latestBill.bill_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">{isTa ? 'காலம்:' : 'Period:'}</span>
                    <span className="text-slate-800 font-medium">{latestBill.billing_period}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">{isTa ? 'கடைசி தேதி:' : 'Due Date:'}</span>
                    <span className="text-slate-800 font-medium">{latestBill.due_date}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t('totalBill')}</div>
                    <div className="text-sm font-black text-slate-900 mt-0.5">₹{latestBill.total_amount}</div>
                  </div>
                  <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200/60">
                    <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">{t('advancePaid')}</div>
                    <div className="text-sm font-black text-emerald-700 mt-0.5">₹{latestBill.advance_amount}</div>
                  </div>
                  <div className="bg-rose-50/60 p-2.5 rounded-xl border border-rose-200/60">
                    <div className="text-[10px] text-rose-700 font-bold uppercase tracking-wider">{t('remaining')}</div>
                    <div className="text-sm font-black text-rose-700 mt-0.5">₹{latestBill.remaining_amount}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 text-right">
            <Link
              to="/patient/payment-status"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              <span>{isTa ? 'விரிவான கட்டண விவரங்களைப் பார்க்கவும்' : 'View Detailed Payment Breakdown'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

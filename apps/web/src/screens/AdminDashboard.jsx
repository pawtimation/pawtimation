import React, { useEffect, useState } from "react";
import { adminApi } from "../lib/auth";
import { useDataRefresh } from "../contexts/DataRefreshContext";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from '../components/LazyCharts';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { BetaStatusBanner } from "../components/BetaStatusBanner";
import { PaymentFailureBanner } from "../components/PaymentFailureBanner";
import { MasqueradeBanner } from "../components/MasqueradeBanner";
import { AdminOnboardingWizard } from "../components/AdminOnboardingWizard";

// Official Pawtimation brand color palette
const COLORS = {
  teal: '#3F9C9B',
  graphite: '#2A2D34',
  cloud: '#F5F7FA',
  mint: '#A8E6CF',
  error: '#E63946',
  success: '#4CAF50',
  amber: '#F59E0B',
  slate: '#1C1E21',
  tealLight: '#66B2B2',
  tealDark: '#006666',
  mintDark: '#7FCF9F'
};

const CHART_PALETTE = [COLORS.teal, COLORS.tealLight, COLORS.mint, COLORS.mintDark, COLORS.tealDark, COLORS.success];

export function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todayJobs: { total: 0, completed: 0, upcoming: 0 },
    weekJobs: { total: 0, change: 0, lastWeek: 0 },
    activeClients: 0,
    newClientsThisMonth: 0,
    activeStaff: { active: 0, total: 0 },
    revenue7Days: { totalCents: 0, change: 0 },
    unpaidInvoices: { totalCents: 0, count: 0 },
    overdueInvoices: { totalCents: 0, count: 0 },
    paidThisMonth: { totalCents: 0, count: 0 }
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [pendingActions, setPendingActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState(null);
  const [user, setUser] = useState(null);
  const [chartData, setChartData] = useState({
    jobsOverTime: [],
    serviceBreakdown: [],
    revenueTrend: []
  });
  const [chartError, setChartError] = useState(false);
  const [chartPeriod, setChartPeriod] = useState('30d');
  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);
  const { scopedTriggers } = useDataRefresh();
  
  // Load business and user data
  const loadBusiness = async () => {
    try {
      const [businessRes, userRes] = await Promise.all([
        adminApi('/business/settings'),
        adminApi('/me')
      ]);
      
      if (businessRes.ok) {
        const data = await businessRes.json();
        setBusiness(data);
        
        const wizardDismissed = data.onboardingSteps?.wizardDismissed || false;
        if (!wizardDismissed) {
          setShowOnboardingWizard(true);
        }
      }
      
      if (userRes.ok) {
        const data = await userRes.json();
        setUser(data);
      }
    } catch (err) {
      console.error("Failed to load business data:", err);
    }
  };

  const loadStats = async () => {
    try {
      const [
        todayRes,
        weekRes,
        clientsRes,
        newClientsRes,
        staffRes,
        revenue7DaysRes,
        unpaidRes,
        paidMonthRes
      ] = await Promise.all([
        adminApi("/stats/bookings/today-count"),
        adminApi("/stats/bookings/week-count"),
        adminApi("/stats/clients/count"),
        adminApi("/stats/clients/new-this-month"),
        adminApi("/stats/staff/active-count"),
        adminApi("/stats/invoices/revenue-7days"),
        adminApi("/finance/unpaid-summary"),
        adminApi("/stats/invoices/paid-this-month")
      ]);

      const [today, week, clients, newClients, staff, revenue7Days, unpaid, paidMonth] = await Promise.all([
        todayRes.json(),
        weekRes.json(),
        clientsRes.json(),
        newClientsRes.json(),
        staffRes.json(),
        revenue7DaysRes.json(),
        unpaidRes.json(),
        paidMonthRes.json()
      ]);

      setStats({
        todayJobs: today,
        weekJobs: week,
        activeClients: clients.count || 0,
        newClientsThisMonth: newClients.count || 0,
        activeStaff: staff,
        revenue7Days,
        unpaidInvoices: unpaid.unpaid || { totalCents: 0, count: 0 },
        overdueInvoices: unpaid.overdue || { totalCents: 0, count: 0 },
        paidThisMonth: paidMonth
      });
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadActivityAndActions = async () => {
    try {
      const [activityRes, actionsRes] = await Promise.all([
        adminApi("/stats/activity/recent?limit=5"),
        adminApi("/stats/actions/pending")
      ]);

      if (activityRes.ok) {
        const data = await activityRes.json();
        setRecentActivity(data);
      }

      if (actionsRes.ok) {
        const data = await actionsRes.json();
        setPendingActions(data);
      }
    } catch (err) {
      console.error("Failed to load activity/actions:", err);
    }
  };

  const loadChartData = async () => {
    try {
      const days = chartPeriod === '7d' ? 7 : chartPeriod === '30d' ? 30 : 90;
      
      const [jobsRes, breakdownsRes, overviewRes] = await Promise.all([
        adminApi("/bookings/list"),
        adminApi("/finance/breakdowns"),
        adminApi("/finance/overview")
      ]);

      if (!jobsRes.ok || !breakdownsRes.ok || !overviewRes.ok) {
        console.error("Failed to load chart data - API error");
        setChartError(true);
        setChartData({
          jobsOverTime: [],
          serviceBreakdown: [],
          revenueTrend: []
        });
        return;
      }

      const [jobs, breakdowns, overview] = await Promise.all([
        jobsRes.json(),
        breakdownsRes.json(),
        overviewRes.json()
      ]);

      // Comprehensive data validation
      if (!Array.isArray(jobs)) {
        console.error("Invalid jobs data - expected array, got:", typeof jobs);
        setChartError(true);
        setChartData({
          jobsOverTime: [],
          serviceBreakdown: [],
          revenueTrend: []
        });
        return;
      }

      if (!breakdowns || typeof breakdowns !== 'object') {
        console.error("Invalid breakdowns data - expected object, got:", typeof breakdowns);
        setChartError(true);
        setChartData({
          jobsOverTime: [],
          serviceBreakdown: [],
          revenueTrend: []
        });
        return;
      }

      if (!overview || typeof overview !== 'object') {
        console.error("Invalid overview data - expected object, got:", typeof overview);
        setChartError(true);
        setChartData({
          jobsOverTime: [],
          serviceBreakdown: [],
          revenueTrend: []
        });
        return;
      }

      const dateRange = Array.from({ length: days }, (_, i) => {
        const date = dayjs().subtract(days - 1 - i, 'day');
        return {
          date: date.format('YYYY-MM-DD'),
          label: days === 7 ? date.format('ddd') : date.format('MMM D'),
          count: 0
        };
      });

      jobs.forEach(job => {
        if (job && job.start) {
          const jobDate = dayjs(job.start).format('YYYY-MM-DD');
          const dayData = dateRange.find(d => d.date === jobDate);
          if (dayData) {
            dayData.count++;
          }
        }
      });

      const serviceData = Array.isArray(breakdowns?.byService) 
        ? breakdowns.byService.map((s, idx) => ({
            name: s?.serviceName || 'Unknown',
            value: s?.bookingCount || 0,
            color: CHART_PALETTE[idx % CHART_PALETTE.length]
          }))
        : [];

      const revenueData = Array.isArray(overview?.monthlyTrend) 
        ? overview.monthlyTrend.slice(-6).map(m => ({
            month: m?.month || (m?.monthKey ? dayjs(m.monthKey).format('MMM') : 'Unknown'),
            revenue: (m?.revenueCents || 0) / 100
          }))
        : [];

      setChartError(false);
      setChartData({
        jobsOverTime: dateRange,
        serviceBreakdown: serviceData.slice(0, 6),
        revenueTrend: revenueData
      });
    } catch (err) {
      console.error("Failed to load chart data:", err);
      setChartError(true);
      setChartData({
        jobsOverTime: [],
        serviceBreakdown: [],
        revenueTrend: []
      });
    }
  };

  useEffect(() => {
    loadBusiness();
    loadStats();
    loadActivityAndActions();
    loadChartData();
  }, []);

  useEffect(() => {
    loadStats();
    loadActivityAndActions();
    loadChartData();
  }, [scopedTriggers.bookings, scopedTriggers.invoices, scopedTriggers.stats]);

  useEffect(() => {
    loadChartData();
  }, [chartPeriod]);

  const formatCurrency = (cents) => `£${((cents || 0) / 100).toFixed(2)}`;
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const EmptyChartState = ({ message }) => (
    <div className="h-64 flex flex-col items-center justify-center">
      <svg width="100" height="100" viewBox="0 0 140 140" className="mb-4 opacity-30">
        <circle cx="70" cy="70" r="50" fill={COLORS.cloud}/>
        <path d="M45 85 Q70 60 95 85" stroke={COLORS.teal} strokeWidth="3" strokeLinecap="round" fill="none"/>
      </svg>
      <p className="text-sm font-medium text-gray-500">{message}</p>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <MasqueradeBanner />
      
      {showOnboardingWizard && (
        <AdminOnboardingWizard onClose={() => setShowOnboardingWizard(false)} />
      )}
      
      <div className="px-4 md:px-10 py-4 md:py-6 space-y-4 md:space-y-6">
        <PaymentFailureBanner business={business} />
        <BetaStatusBanner business={business} />
        
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">Overview of your bookings, clients and revenue.</p>
          <p className="text-xs md:text-sm text-teal-600 mt-2">{getGreeting()}, {user?.name?.split(' ')[0] || 'there'} — here's what's happening today.</p>
        </div>

        {/* Row 1 - Workload Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          
          {/* Today's Jobs */}
          <div 
            onClick={() => navigate('/admin/bookings')}
            className="relative rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all text-white overflow-hidden cursor-pointer" 
            style={{background: 'linear-gradient(to bottom right, #3F9C9B, #66B2B2, #A8E6CF)'}}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-1 md:mb-2">
                <p className="text-xs md:text-sm font-medium text-white/90 leading-tight">Today's Jobs</p>
                <svg className="w-5 h-5 md:w-10 md:h-10 text-white/30 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                </svg>
              </div>
              <p className="text-mobile-stat md:text-desktop-stat font-bold mb-2 leading-tight">{stats.todayJobs.total}</p>
              <p className="text-xs text-white/80 leading-snug truncate"><span className="sm:hidden">{stats.todayJobs.completed} done · {stats.todayJobs.upcoming} upcoming</span><span className="hidden sm:inline">{stats.todayJobs.completed} completed · {stats.todayJobs.upcoming} upcoming</span></p>
            </div>
          </div>

          {/* This Week's Jobs */}
          <div className="relative bg-white border border-gray-200 rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-1 md:mb-2">
              <p className="text-xs md:text-sm font-medium text-gray-600 leading-tight">This Week's Jobs</p>
              <svg className="w-5 h-5 md:w-10 md:h-10 opacity-40 flex-shrink-0" style={{color: COLORS.teal}} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
              </svg>
            </div>
            <p className="text-mobile-stat md:text-desktop-stat font-bold text-gray-900 mb-2 leading-tight">{stats.weekJobs.total}</p>
            <p className="text-xs leading-snug" style={{color: stats.weekJobs.change >= 0 ? COLORS.success : COLORS.error}}>
              <span className="sm:hidden">{stats.weekJobs.change >= 0 ? '+' : ''}{stats.weekJobs.change} vs last wk</span><span className="hidden sm:inline">{stats.weekJobs.change >= 0 ? '+' : ''}{stats.weekJobs.change} vs last week</span>
            </p>
          </div>

          {/* Active Clients */}
          <div className="relative bg-white border border-gray-200 rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-1 md:mb-2">
              <p className="text-xs md:text-sm font-medium text-gray-600 leading-tight">Active Clients</p>
              <svg className="w-5 h-5 md:w-10 md:h-10 opacity-40 flex-shrink-0" style={{color: COLORS.mint}} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
              </svg>
            </div>
            <p className="text-mobile-stat md:text-desktop-stat font-bold text-gray-900 mb-2 leading-tight">{stats.activeClients}</p>
            <p className="text-xs text-gray-500 leading-snug"><span className="sm:hidden">{stats.newClientsThisMonth} new this mo</span><span className="hidden sm:inline">{stats.newClientsThisMonth} new this month</span></p>
          </div>

          {/* Active Staff */}
          <div className="relative bg-white border border-gray-200 rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-1 md:mb-2">
              <p className="text-xs md:text-sm font-medium text-gray-600 leading-tight">Active Staff</p>
              <svg className="w-5 h-5 md:w-10 md:h-10 opacity-40 flex-shrink-0" style={{color: COLORS.tealLight}} fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
              </svg>
            </div>
            <p className="text-mobile-stat md:text-desktop-stat font-bold text-gray-900 mb-2 leading-tight">{stats.activeStaff.active}</p>
            <p className="text-xs text-gray-500 leading-snug"><span className="sm:hidden">{stats.activeStaff.total} total</span><span className="hidden sm:inline">{stats.activeStaff.total} total staff</span></p>
          </div>

        </div>

        {/* Row 2 - Finance Snapshot */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          
          {/* Revenue Last 7 Days */}
          <div 
            onClick={() => navigate('/admin/invoices?tab=overview')}
            className="relative bg-white border border-gray-200 rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1 md:mb-2">
              <p className="text-xs md:text-sm font-medium text-gray-600 leading-tight">Revenue<span className="hidden sm:inline"> (Last 7 Days)</span></p>
              <svg className="w-5 h-5 md:w-10 md:h-10 opacity-40 flex-shrink-0" style={{color: COLORS.success}} fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
              </svg>
            </div>
            <p className="text-mobile-stat md:text-desktop-stat font-bold text-gray-900 mb-2 leading-tight">{formatCurrency(stats.revenue7Days.totalCents)}</p>
            <p className="text-xs leading-snug" style={{color: stats.revenue7Days.change >= 0 ? COLORS.success : COLORS.error}}>
              <span className="sm:hidden">{stats.revenue7Days.change >= 0 ? '+' : ''}{formatCurrency(stats.revenue7Days.change)} vs prev 7d</span><span className="hidden sm:inline">{stats.revenue7Days.change >= 0 ? '+' : ''}{formatCurrency(stats.revenue7Days.change)} vs previous 7 days</span>
            </p>
          </div>

          {/* Unpaid Invoices */}
          <div className="relative rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all text-white" style={{background: `linear-gradient(to bottom right, ${COLORS.amber}, #FCD34D)`}}>
            <div className="flex items-center justify-between mb-1 md:mb-2">
              <p className="text-xs md:text-sm font-medium text-white/90 leading-tight">Unpaid<span className="hidden sm:inline"> Invoices</span></p>
              <svg className="w-5 h-5 md:w-10 md:h-10 text-white/30 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
              </svg>
            </div>
            <p className="text-mobile-stat md:text-desktop-stat font-bold mb-2 leading-tight">{formatCurrency(stats.unpaidInvoices.totalCents)}</p>
            <p className="text-xs text-white/80 leading-snug">{stats.unpaidInvoices.count} invoice{stats.unpaidInvoices.count !== 1 ? 's' : ''}</p>
          </div>

          {/* Overdue Invoices */}
          <div className="relative rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all text-white" style={{
            background: stats.overdueInvoices.count > 0 
              ? `linear-gradient(to bottom right, ${COLORS.error}, #FF6B6B)` 
              : `linear-gradient(to bottom right, ${COLORS.success}, ${COLORS.mint})`
          }}>
            <div className="flex items-center justify-between mb-1 md:mb-2">
              <p className="text-xs md:text-sm font-medium text-white/90 leading-tight">Overdue<span className="hidden sm:inline"> Invoices</span></p>
              {stats.overdueInvoices.count > 0 ? (
                <svg className="w-5 h-5 md:w-10 md:h-10 text-white/30 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
              ) : (
                <svg className="w-5 h-5 md:w-10 md:h-10 text-white/30 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              )}
            </div>
            <p className="text-mobile-stat md:text-desktop-stat font-bold mb-2 leading-tight">{formatCurrency(stats.overdueInvoices.totalCents)}</p>
            {stats.overdueInvoices.count > 0 ? (
              <p className="text-xs text-white/80 leading-snug">{stats.overdueInvoices.count} invoice{stats.overdueInvoices.count !== 1 ? 's' : ''}</p>
            ) : (
              <p className="text-xs text-white/80 leading-snug">All clear</p>
            )}
          </div>

          {/* Paid This Month */}
          <div className="relative bg-white border border-gray-200 rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-1 md:mb-2">
              <p className="text-xs md:text-sm font-medium text-gray-600 leading-tight">Paid<span className="hidden sm:inline"> This Month</span></p>
              <svg className="w-5 h-5 md:w-10 md:h-10 opacity-40 flex-shrink-0" style={{color: COLORS.success}} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
            </div>
            <p className="text-mobile-stat md:text-desktop-stat font-bold text-gray-900 mb-2 leading-tight">{formatCurrency(stats.paidThisMonth.totalCents)}</p>
            <p className="text-xs text-gray-500 leading-snug">{stats.paidThisMonth.count} invoice{stats.paidThisMonth.count !== 1 ? 's' : ''}</p>
          </div>

        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          
          {/* Jobs Over Time - Full Width */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-4 md:p-8 shadow-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-gray-800">Jobs over time</h3>
                <p className="text-xs md:text-sm text-gray-500 mt-1">
                  {chartPeriod === '7d' ? 'Last 7 days' : chartPeriod === '30d' ? 'Last 30 days' : 'Last 90 days'}
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setChartPeriod('7d')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    chartPeriod === '7d' 
                      ? 'bg-teal-100 text-teal-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  7d
                </button>
                <button 
                  onClick={() => setChartPeriod('30d')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    chartPeriod === '30d' 
                      ? 'bg-teal-100 text-teal-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  30d
                </button>
                <button 
                  onClick={() => setChartPeriod('90d')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    chartPeriod === '90d' 
                      ? 'bg-teal-100 text-teal-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  90d
                </button>
              </div>
            </div>
            {!chartError && chartData.jobsOverTime.length > 0 && chartData.jobsOverTime.some(d => d.count > 0) ? (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={chartData.jobsOverTime}>
                  <defs>
                    <linearGradient id="jobsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.teal} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={COLORS.teal} stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                    interval={chartPeriod === '7d' ? 0 : chartPeriod === '30d' ? 5 : 15}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      fontSize: 13,
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      padding: '12px'
                    }}
                    formatter={(value) => [value, 'Jobs']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke={COLORS.teal}
                    strokeWidth={3}
                    fill="url(#jobsGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState message="No booking activity yet" />
            )}
          </div>

          {/* Service Breakdown */}
          <div className="bg-white rounded-2xl p-4 md:p-8 shadow-sm border border-gray-200">
            <div>
              <h3 className="text-lg md:text-xl font-bold text-gray-800">Service breakdown</h3>
              <p className="text-xs md:text-sm text-gray-500 mt-1">Share of bookings by service type</p>
            </div>
            {!chartError && chartData.serviceBreakdown.length > 0 ? (
              <div className="flex flex-col items-center mt-6">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={chartData.serviceBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {chartData.serviceBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        fontSize: 13,
                        backgroundColor: '#ffffff',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        padding: '12px'
                      }}
                      formatter={(value, name, props) => [value, props.payload.name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-full grid grid-cols-2 gap-2 mt-4">
                  {chartData.serviceBreakdown.map((entry, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded flex-shrink-0" style={{ backgroundColor: entry.color }}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 truncate">{entry.name}</p>
                        <p className="text-xs text-gray-500">{entry.value} bookings</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyChartState message="No service data yet" />
            )}
          </div>

          {/* Revenue Trend */}
          <div className="bg-white rounded-2xl p-4 md:p-8 shadow-sm border border-gray-200">
            <div>
              <h3 className="text-lg md:text-xl font-bold text-gray-800">Revenue trend</h3>
              <p className="text-xs md:text-sm text-gray-500 mt-1">Last 6 months</p>
            </div>
            {!chartError && chartData.revenueTrend.length > 0 && chartData.revenueTrend.some(d => d.revenue > 0) ? (
              <ResponsiveContainer width="100%" height={240} className="mt-6">
                <BarChart data={chartData.revenueTrend}>
                  <defs>
                    <linearGradient id="revenueBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.success} />
                      <stop offset="100%" stopColor={COLORS.teal} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                    tickFormatter={(value) => `£${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      fontSize: 13,
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      padding: '12px'
                    }}
                    formatter={(value) => [`£${value.toFixed(2)}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="url(#revenueBarGradient)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState message="No revenue data yet" />
            )}
          </div>

        </div>

        {/* Action & Activity Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          
          {/* Action Centre */}
          <div className="bg-white rounded-2xl p-4 md:p-8 shadow-sm border border-gray-200">
            <div className="mb-4 md:mb-6">
              <h3 className="text-lg md:text-xl font-bold text-gray-800">Action centre</h3>
              <p className="text-xs md:text-sm text-gray-500 mt-1">Things that need your attention</p>
            </div>
            {pendingActions.length > 0 ? (
              <div className="space-y-3">
                {pendingActions.map((action, idx) => (
                  <div 
                    key={idx}
                    onClick={() => action.link && navigate(action.link)}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-teal-300 hover:bg-teal-50 transition-all cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        action.type === 'overdue_invoices' ? 'bg-red-500' :
                        action.type === 'pending_bookings' ? 'bg-amber-500' :
                        'bg-blue-500'
                      }`}></div>
                      <p className="text-sm font-medium text-gray-900">{action.message}</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-16 h-16 mx-auto text-green-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-gray-600">All caught up</p>
                <p className="text-xs text-gray-500 mt-1">Nothing requires your attention right now</p>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl p-4 md:p-8 shadow-sm border border-gray-200">
            <div className="mb-4 md:mb-6">
              <h3 className="text-lg md:text-xl font-bold text-gray-800">Recent activity</h3>
              <p className="text-xs md:text-sm text-gray-500 mt-1">Latest changes across your business</p>
            </div>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity, idx) => (
                  <div key={idx} className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      activity.type === 'booking' ? 'bg-blue-100 text-blue-600' :
                      activity.type === 'payment' ? 'bg-green-100 text-green-600' :
                      activity.type === 'client' ? 'bg-purple-100 text-purple-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {activity.type === 'booking' && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                        </svg>
                      )}
                      {activity.type === 'payment' && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                        </svg>
                      )}
                      {activity.type === 'client' && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                      {activity.details && <p className="text-xs text-gray-500 mt-1">{activity.details}</p>}
                      <p className="text-xs text-gray-400 mt-1">{dayjs(activity.timestamp).fromNow()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-gray-500">No recent activity</p>
                <p className="text-xs text-gray-400 mt-1">Activity will appear here as your business grows</p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

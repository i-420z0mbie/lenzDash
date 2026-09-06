import React, { useState, useEffect } from 'react';
import api from '../api';
import StatsGrid from '../components/dashboard/StatsGrid';
import RecentPayments from '../components/dashboard/RecentPayments';
import OutstandingStudents from '../components/dashboard/OutstandingStudents';
import ClassSummary from '../components/dashboard/ClassSummary';
import QuickActions from '../components/dashboard/QuickActions';
import ActiveFeeStructures from '../components/dashboard/ActiveFeeStructures';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentPayments, setRecentPayments] = useState([]);
  const [outstandingStudents, setOutstandingStudents] = useState([]);
  const [classOverview, setClassOverview] = useState([]);   // ← used for charts (per class)
  const [activeFeeStructures, setActiveFeeStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const [overviewRes, paymentsRes, studentsRes, classOverviewRes, feeStructuresRes] = await Promise.all([
        api.get('/main/dashboard/overview/'),
        api.get('/main/dashboard/recent-payments-grouped/'),
        api.get('/main/dashboard/outstanding-students/'),
        api.get('/main/class-overview/'),           // ✅ correct endpoint – per class totals
        api.get('/main/fee_structure/')
      ]);

      setStats(overviewRes.data);
      setRecentPayments(paymentsRes.data);
      setOutstandingStudents(studentsRes.data);
      setClassOverview(classOverviewRes.data);      // already aggregated per class
      setActiveFeeStructures(feeStructuresRes.data.filter(s => s.is_active && s.school_class));
    } catch (err) {
      if (err.response?.status !== 403) setError('Failed to load dashboard data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data from classOverview (per class, correct totals)
  const revenueChartData = classOverview.map(c => ({ name: c.name, revenue: c.total_paid }));
  const collectionChartData = classOverview.map(c => ({ name: c.name, rate: c.collection_rate || 0 }));
  const paymentStatusData = stats ? [
    { name: 'Fully paid', value: stats.fully_paid_count || 0, color: '#047857' },
    { name: 'Partial', value: stats.partial_count || 0, color: '#d97706' },
    { name: 'Unpaid', value: stats.unpaid_count || 0, color: '#991b1b' },
  ].filter(d => d.value > 0) : [];

  const totalRevenue = classOverview.reduce((sum, c) => sum + (c.total_paid || 0), 0);
  const totalOutstanding = classOverview.reduce((sum, c) => sum + (c.total_balance || 0), 0);
  const totalStudents = classOverview.reduce((sum, c) => sum + (c.total_students || 0), 0);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorRetry error={error} onRetry={fetchDashboardData} />;

  return (
    <div className="min-h-screen bg-stone-50 ledger-root">
      <div className="max-w-[1400px] mx-auto px-5 md:px-8 py-8 space-y-6">

        {/* ---------- Statement header ---------- */}
        <div className="border-b border-stone-300 pb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="ledger-display text-3xl text-stone-900 tracking-tight">Dashboard</h1>
              <p className="text-sm text-stone-500 mt-1">A running view of enrollment, collections and what's still outstanding.</p>
            </div>
            <button
              onClick={fetchDashboardData}
              className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Refresh
            </button>
          </div>

          {/* Big total + inline stat strip */}
          {classOverview.length > 0 && (
            <div className="mt-6 flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
              <div>
                <p className="text-xs text-stone-500">Total collected</p>
                <p className="ledger-display ledger-mono text-4xl md:text-5xl text-emerald-900 mt-1 tabular-nums">
                  GH₵{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="flex flex-wrap items-center divide-x divide-stone-300">
                <div className="px-4 first:pl-0">
                  <p className="ledger-mono text-lg text-stone-800 tabular-nums">{classOverview.length}</p>
                  <p className="text-xs text-stone-500">Classes</p>
                </div>
                <div className="px-4">
                  <p className="ledger-mono text-lg text-stone-800 tabular-nums">{totalStudents}</p>
                  <p className="text-xs text-stone-500">Students</p>
                </div>
                <div className="px-4">
                  <p className="ledger-mono text-lg text-amber-800 tabular-nums">GH₵{totalOutstanding.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  <p className="text-xs text-stone-500">Outstanding</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <QuickActions />
        {stats && <StatsGrid stats={stats} />}

        {/* ---------- Charts: Revenue + Collection rate ---------- */}
        {classOverview.length > 0 && (
          <div className="grid lg:grid-cols-2 gap-8 border-b border-stone-200 pb-6">
            <div>
              <div className="flex items-baseline justify-between mb-3">
                <h3 className="text-sm font-medium text-stone-700">Revenue by class</h3>
                <span className="text-xs text-stone-400">GH₵</span>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={revenueChartData} margin={{ top: 6, right: 6, left: -6, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#e7e5e4" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#78716c' }} axisLine={{ stroke: '#d6d3d1' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#78716c' }} tickFormatter={v => `GH₵${v.toLocaleString()}`} axisLine={false} tickLine={false} width={56} />
                  <Tooltip formatter={v => `GH₵${v.toLocaleString()}`} contentStyle={{ fontSize: '11px', border: '1px solid #e7e5e4', borderRadius: 0, boxShadow: 'none' }} cursor={{ fill: '#f5f5f4' }} />
                  <Bar dataKey="revenue" fill="#047857" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-3">
                <h3 className="text-sm font-medium text-stone-700">Collection rate by class</h3>
                <span className="text-xs text-stone-400">%</span>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={collectionChartData} margin={{ top: 6, right: 6, left: -6, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#047857" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#047857" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#e7e5e4" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#78716c' }} axisLine={{ stroke: '#d6d3d1' }} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#78716c' }} unit="%" axisLine={false} tickLine={false} width={34} />
                  <Tooltip formatter={v => `${v.toFixed(1)}%`} contentStyle={{ fontSize: '11px', border: '1px solid #e7e5e4', borderRadius: 0, boxShadow: 'none' }} />
                  <Area type="monotone" dataKey="rate" stroke="#047857" fill="url(#rateGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ---------- Payment status distribution ---------- */}
        {paymentStatusData.length > 0 && (
          <div className="border-b border-stone-200 pb-6">
            <h3 className="text-sm font-medium text-stone-700 mb-3">Payment status distribution</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={paymentStatusData} dataKey="value" cx="50%" cy="50%"
                  innerRadius={54} outerRadius={86} paddingAngle={2} stroke="none"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#a8a29e', strokeWidth: 1 }}
                >
                  {paymentStatusData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={v => [`${v} students`, 'Count']} contentStyle={{ fontSize: '11px', border: '1px solid #e7e5e4', borderRadius: 0, boxShadow: 'none' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ---------- Main grid ---------- */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <ClassSummary data={classOverview} />
            {activeFeeStructures.length > 0 && <ActiveFeeStructures structures={activeFeeStructures} />}
          </div>
          <div className="space-y-6">
            {recentPayments.length > 0 && <RecentPayments payments={recentPayments} />}
            {outstandingStudents.length > 0 && <OutstandingStudents students={outstandingStudents} />}
          </div>
        </div>

        {(!stats || !classOverview.length) && !recentPayments.length && !outstandingStudents.length && (
          <div className="text-center py-16 border border-stone-200">
            <p className="ledger-display text-lg text-stone-700">Nothing to show yet</p>
            <p className="text-sm text-stone-500 mt-1">Add classes and students to start seeing insights here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[60vh] bg-stone-50">
    <div className="text-center">
      <div className="w-6 h-6 border-2 border-stone-300 border-t-emerald-800 rounded-full animate-spin mx-auto" />
      <p className="mt-3 text-xs text-stone-400 ledger-mono">Opening the register…</p>
    </div>
  </div>
);

const ErrorRetry = ({ error, onRetry }) => (
  <div className="flex items-center justify-center min-h-[60vh] bg-stone-50">
    <div className="text-center border border-stone-200 px-8 py-8">
      <p className="text-sm text-red-800 mb-4">{error}</p>
      <button onClick={onRetry} className="px-4 py-2 bg-stone-900 text-stone-50 text-sm hover:bg-emerald-900 transition-colors">Retry</button>
    </div>
  </div>
);

// Inject fonts + base ledger styling (only once, shared with other ledger pages)
if (typeof document !== 'undefined' && !document.getElementById('dashboard-ledger-styles')) {
  const style = document.createElement('style');
  style.id = 'dashboard-ledger-styles';
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
    .ledger-root { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; animation: ledgerFadeIn 0.35s ease-out; }
    .ledger-display { font-family: 'Fraunces', serif; font-weight: 500; }
    .ledger-mono { font-family: 'IBM Plex Mono', ui-monospace, monospace; }
    @keyframes ledgerFadeIn { from { opacity: 0; } to { opacity: 1; } }
  `;
  document.head.appendChild(style);
}

export default Dashboard;
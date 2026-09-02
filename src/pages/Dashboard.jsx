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
    { name: 'Fully Paid', value: stats.fully_paid_count || 0, color: '#10b981' },
    { name: 'Partial', value: stats.partial_count || 0, color: '#f59e0b' },
    { name: 'Unpaid', value: stats.unpaid_count || 0, color: '#ef4444' },
  ].filter(d => d.value > 0) : [];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorRetry error={error} onRetry={fetchDashboardData} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-4 md:p-5 max-w-[1600px] mx-auto space-y-5">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-white/70 backdrop-blur-sm border border-white/30 shadow-lg p-4 animate-fadeInUp">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-indigo-100/40 to-transparent rounded-full blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">📊 School Intelligence Dashboard</h1>
            <p className="text-[11px] text-slate-500 mt-0.5">Real‑time financial & student performance analytics</p>
          </div>
          <button onClick={fetchDashboardData} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium bg-indigo-600 text-white rounded-lg shadow-md hover:shadow-indigo-200 transition-all hover:-translate-y-0.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <QuickActions />
      {stats && <StatsGrid stats={stats} />}

      {/* Charts Section – using correct, un‑scaled data */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Revenue by Class */}
        <div className="glass-card rounded-xl p-4 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-slate-600">💵 Revenue by Class</h3>
            <span className="text-[10px] text-slate-400">actual GH₵</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={revenueChartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `GH₵${v.toLocaleString()}`} />
              <Tooltip formatter={v => `GH₵${v.toLocaleString()}`} contentStyle={{ fontSize: 10, borderRadius: 8 }} />
              <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Collection Rate by Class */}
        <div className="glass-card rounded-xl p-4 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-slate-600">📈 Collection Rate by Class</h3>
            <span className="text-[10px] text-slate-400">%</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={collectionChartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <defs><linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.7}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} unit="%" />
              <Tooltip formatter={v => `${v.toFixed(1)}%`} contentStyle={{ fontSize: 10 }} />
              <Area type="monotone" dataKey="rate" stroke="#8b5cf6" fill="url(#rateGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payment Status Distribution (Pie) */}
      {paymentStatusData.length > 0 && (
        <div className="glass-card rounded-xl p-4 transition-all hover:shadow-md">
          <h3 className="text-xs font-semibold text-slate-600 mb-2">🍩 Payment Status Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={paymentStatusData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: "#94a3b8", strokeWidth: 1 }}>
                {paymentStatusData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={v => [`${v} students`, "Count"]} contentStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Main Grid: Class Summary (uses correct data) + Active Fee Structures (left) / Recent Payments + Outstanding (right) */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <ClassSummary data={classOverview} />  {/* now uses correct per‑class data */}
          {activeFeeStructures.length > 0 && <ActiveFeeStructures structures={activeFeeStructures} />}
        </div>
        <div className="space-y-5">
          {recentPayments.length > 0 && <RecentPayments payments={recentPayments} />}
          {outstandingStudents.length > 0 && <OutstandingStudents students={outstandingStudents} />}
        </div>
      </div>

      {(!stats || !classOverview.length) && !recentPayments.length && !outstandingStudents.length && (
        <div className="text-center py-12 glass-card rounded-xl">
          <p className="text-sm text-slate-500">No data available yet. Add classes and students to see insights.</p>
        </div>
      )}
    </div>
  );
};

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="relative">
      <div className="w-10 h-10 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      <p className="mt-3 text-[11px] text-slate-400 animate-pulse">Loading intelligence...</p>
    </div>
  </div>
);

const ErrorRetry = ({ error, onRetry }) => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="glass-card rounded-xl p-6 text-center">
      <p className="text-rose-500 text-sm mb-3">{error}</p>
      <button onClick={onRetry} className="px-4 py-1.5 bg-indigo-600 text-white text-xs rounded-lg shadow">Retry</button>
    </div>
  </div>
);

// Global animations (injected once)
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    .animate-fadeInUp{animation:fadeInUp 0.25s ease-out forwards}
    .glass-card{background:rgba(255,255,255,0.6);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.5)}
    .text-xxs{font-size:0.65rem;line-height:1rem}
  `;
  document.head.appendChild(style);
}

export default Dashboard;
// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Area,
  ComposedChart,
} from 'recharts';

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  // Demo data for charts (illustrative)
  const paymentStatusData = [
    { name: 'Successful', value: 187, color: '#10b981' },
    { name: 'Pending', value: 42, color: '#f59e0b' },
    { name: 'Failed', value: 12, color: '#ef4444' },
  ];

  const monthlyCollectionData = [
    { month: 'Jan', amount: 12500 },
    { month: 'Feb', amount: 14200 },
    { month: 'Mar', amount: 16800 },
    { month: 'Apr', amount: 15200 },
    { month: 'May', amount: 18900 },
    { month: 'Jun', amount: 20500 },
  ];

  const collectionRateData = [
    { class: 'Primary 1', rate: 92 },
    { class: 'Primary 2', rate: 88 },
    { class: 'Primary 3', rate: 95 },
    { class: 'JHS 1', rate: 78 },
    { class: 'JHS 2', rate: 82 },
    { class: 'SHS 1', rate: 86 },
  ];

  // Animated counters for KPI stats
  const [kpis, setKpis] = useState({ collected: 0, students: 0, successRate: 0 });

  useEffect(() => {
    const targets = { collected: 87650, students: 1240, successRate: 99 };
    const duration = 1500;
    const stepTime = 20;
    const steps = duration / stepTime;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      setKpis({
        collected: Math.min(targets.collected, Math.floor((step / steps) * targets.collected)),
        students: Math.min(targets.students, Math.floor((step / steps) * targets.students)),
        successRate: Math.min(targets.successRate, Math.floor((step / steps) * targets.successRate)),
      });

      if (step >= steps) clearInterval(interval);
    }, stepTime);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!credentials.username.trim() || !credentials.password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);
    try {
      const result = await login(credentials);
      if (result?.success) {
        navigate('/');
      } else {
        setError(result?.error || 'Invalid username or password');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Inject custom animations once
  useEffect(() => {
    if (!document.getElementById('login-animations')) {
      const style = document.createElement('style');
      style.id = 'login-animations';
      style.textContent = `
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 12s ease infinite;
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 10s ease-in-out infinite 2s;
        }
        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in-left {
          animation: fadeInLeft 0.8s ease-out forwards;
        }
        .animate-fade-in-right {
          animation: fadeInRight 0.8s ease-out forwards;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
        .text-xxs {
          font-size: 0.65rem;
          line-height: 1rem;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const svgBackground = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2000 1500'%3E%3Cdefs%3E%3ClinearGradient id='a' gradientTransform='rotate(45)'%3E%3Cstop offset='0' stop-color='%234f46e5' stop-opacity='0.3'/%3E%3Cstop offset='1' stop-color='%238b5cf6' stop-opacity='0.1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23a)' width='2000' height='1500'/%3E%3C/svg%3E")`;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 animate-gradient" />
      <div
        className="absolute top-0 left-0 w-full h-full opacity-30"
        style={{ backgroundImage: svgBackground }}
      />

      {/* Floating orbs */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-indigo-500/30 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-float-delayed" />

      <div className="relative z-10 w-full max-w-7xl grid lg:grid-cols-2 gap-8 items-center">
        {/* LEFT: LOGIN FORM */}
        <div className="backdrop-blur-2xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8 animate-fade-in-left">
          <div className="text-center">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-600 rounded-2xl blur-xl opacity-60" />
              <div className="relative mx-auto w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30">
                <img src="/lenz-icon.png" alt="LenzPay Logo" className="w-12 h-12 object-contain" />
              </div>
            </div>

            <h2 className="mt-5 text-3xl font-extrabold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
              LenzPay
            </h2>
            <p className="mt-2 text-sm text-indigo-100 font-medium tracking-wide">
              Premium School Fee Management System
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="bg-red-500/20 backdrop-blur-md border border-red-400/30 rounded-xl p-3 animate-shake">
                <p className="text-sm text-red-100 text-center">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-indigo-100 mb-1">Username</label>
              <input
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                className="mt-1 block w-full px-4 py-3 border border-white/30 rounded-xl bg-white/10 text-white placeholder-indigo-200/70 focus:ring-2 focus:ring-indigo-400 focus:border-transparent backdrop-blur-md outline-none transition"
                placeholder="Enter your username"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-indigo-100 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  className="block w-full px-4 py-3 pr-12 border border-white/30 rounded-xl bg-white/10 text-white placeholder-indigo-200/70 focus:ring-2 focus:ring-indigo-400 focus:border-transparent backdrop-blur-md outline-none"
                  placeholder="Enter your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-indigo-200 hover:text-white transition" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-indigo-200 hover:text-white transition" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 disabled:opacity-50 transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-indigo-200 text-xs font-medium tracking-wider">
              © {currentYear} LenzPay • Secure School Management
            </p>
            <p className="text-[11px] text-indigo-300/80 mt-1">
              Powered by{' '}
              <span className="font-semibold bg-gradient-to-r from-indigo-200 to-white bg-clip-text text-transparent hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] transition">
                BinaryLenz
              </span>
            </p>
          </div>
        </div>

        {/* RIGHT: CHARTS & STATS (Demo) */}
        <div className="space-y-6 animate-fade-in-right">
          {/* 3 KPI Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="backdrop-blur-md bg-white/10 rounded-2xl p-4 border border-white/20 text-center hover:scale-105 transition transform">
              <p className="text-indigo-200 text-xxs uppercase tracking-wide">Total Collected</p>
              <p className="text-2xl font-bold text-white">GH₵{kpis.collected.toLocaleString()}</p>
            </div>
            <div className="backdrop-blur-md bg-white/10 rounded-2xl p-4 border border-white/20 text-center hover:scale-105 transition">
              <p className="text-indigo-200 text-xxs uppercase tracking-wide">Active Students</p>
              <p className="text-2xl font-bold text-white">{kpis.students}</p>
            </div>
            <div className="backdrop-blur-md bg-white/10 rounded-2xl p-4 border border-white/20 text-center hover:scale-105 transition">
              <p className="text-indigo-200 text-xxs uppercase tracking-wide">Success Rate</p>
              <p className="text-2xl font-bold text-white">{kpis.successRate}%</p>
            </div>
          </div>

          {/* Pie Chart + Bar Chart row */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="backdrop-blur-md bg-white/10 rounded-2xl p-4 border border-white/20">
              <h3 className="text-sm font-semibold text-white mb-2">📊 Payment Status</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={paymentStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {paymentStatusData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e1e2f',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '10px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '9px', color: '#cbd5e1' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="backdrop-blur-md bg-white/10 rounded-2xl p-4 border border-white/20">
              <h3 className="text-sm font-semibold text-white mb-2">📈 Monthly Collection (GH₵)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyCollectionData}>
                  <XAxis dataKey="month" tick={{ fill: '#cbd5e1', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#cbd5e1', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e1e2f',
                      borderRadius: '8px',
                      fontSize: '10px',
                    }}
                  />
                  <Bar dataKey="amount" fill="#818cf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Collection Rate by Class */}
          <div className="backdrop-blur-md bg-white/10 rounded-2xl p-4 border border-white/20">
            <h3 className="text-sm font-semibold text-white mb-2">🏆 Collection Rate by Class (%)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={collectionRateData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="class" tick={{ fill: '#cbd5e1', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#cbd5e1', fontSize: 9 }} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e1e2f',
                    borderRadius: '8px',
                    fontSize: '10px',
                  }}
                />
                <Area type="monotone" dataKey="rate" fill="url(#gradientRate)" stroke="none" />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#a78bfa"
                  strokeWidth={3}
                  dot={{ stroke: '#b5fdf8', fill: '#8b5cf6' }}
                />
                <defs>
                  <linearGradient id="gradientRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Footer note */}
          <p className="text-center text-[10px] text-indigo-300/70 mt-2 animate-pulse">
            powered by BinaryLenz
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
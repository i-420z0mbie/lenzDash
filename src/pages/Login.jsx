// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { EyeIcon, EyeSlashIcon, ArrowRightIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const particles = [
    { id: 1, left: 8, size: 4, duration: 14, delay: 0 },
    { id: 2, left: 18, size: 3, duration: 18, delay: 3 },
    { id: 3, left: 32, size: 5, duration: 16, delay: 6 },
    { id: 4, left: 47, size: 3, duration: 20, delay: 1 },
    { id: 5, left: 61, size: 4, duration: 15, delay: 8 },
    { id: 6, left: 74, size: 3, duration: 19, delay: 4 },
    { id: 7, left: 85, size: 5, duration: 17, delay: 10 },
    { id: 8, left: 93, size: 3, duration: 21, delay: 2 },
  ];

  // Demo data (illustrative — swap for live API data)
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

  // Animated counters
  const [kpis, setKpis] = useState({ collected: 0, students: 0, successRate: 0 });

  useEffect(() => {
    const targets = { collected: 87650, students: 1240, successRate: 99 };
    const duration = 1400;
    const stepTime = 20;
    const steps = duration / stepTime;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      const p = Math.min(1, step / steps);
      setKpis({
        collected: Math.floor(p * targets.collected),
        students: Math.floor(p * targets.students),
        successRate: Math.floor(p * targets.successRate),
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

  // Inject fonts + one-time animation keyframes
  useEffect(() => {
    if (!document.getElementById('login-style')) {
      const style = document.createElement('style');
      style.id = 'login-style';
      style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');

        .lp-display { font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif; }
        .lp-body { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; }

        @keyframes lpRise {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .lp-rise-1 { animation: lpRise 0.7s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .lp-rise-2 { animation: lpRise 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.12s both; }

        @keyframes lpShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .lp-shake { animation: lpShake 0.28s ease-in-out; }

        .lp-bar-fill {
          animation: lpGrow 1s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes lpGrow {
          from { width: 0%; }
        }

        @keyframes lpDrift {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(-40px, 30px) scale(1.08); }
          100% { transform: translate(0, 0) scale(1); }
        }
        .lp-glow {
          animation: lpDrift 16s ease-in-out infinite;
        }

        @keyframes lpParticle {
          0%   { transform: translateY(0); opacity: 0; }
          10%  { opacity: 0.7; }
          90%  { opacity: 0.5; }
          100% { transform: translateY(-620px); opacity: 0; }
        }
        .lp-particle {
          animation: lpParticle linear infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .lp-rise-1, .lp-rise-2, .lp-shake, .lp-bar-fill, .lp-glow, .lp-particle { animation: none !important; }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div className="lp-body min-h-screen relative overflow-hidden bg-[#081428] flex items-center justify-center p-4 sm:p-6">
      {/* Base texture: fine dot grid, like ledger paper */}
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(143,193,255,0.10) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
        }}
      />
      {/* Single soft glow, top right — the one deliberate accent shape, now drifting slowly */}
      <div className="lp-glow absolute -top-40 -right-40 w-[560px] h-[560px] rounded-full bg-[#1E5FD8]/25 blur-[120px]" />

      {/* Faint particles rising through the grid — payments streaming into the ledger */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        {particles.map((p) => (
          <span
            key={p.id}
            className="lp-particle absolute rounded-full bg-[#8FC1FF]"
            style={{
              left: `${p.left}%`,
              bottom: '-20px',
              width: p.size,
              height: p.size,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              boxShadow: '0 0 6px rgba(143,193,255,0.6)',
            }}
          />
        ))}
      </div>
      <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-[#081428] to-transparent" />

      <div className="relative z-10 w-full max-w-4xl grid lg:grid-cols-[340px_1fr] gap-5 lg:gap-6 lg:items-center">
        {/* LOGIN CARD — styled like an admit / ID card with a torn, perforated edge */}
        <div className="lp-rise-1 flex order-1">
          <div
            className="hidden sm:block w-3 shrink-0 rounded-l-2xl"
            style={{
              backgroundColor: '#FFFFFF',
              backgroundImage:
                'radial-gradient(circle at 6px 0, #081428 3.5px, transparent 4px)',
              backgroundSize: '12px 18px',
              backgroundRepeat: 'repeat-y',
            }}
            aria-hidden="true"
          />
          <div className="flex-1 bg-white rounded-2xl sm:rounded-l-none sm:rounded-r-2xl shadow-[0_30px_60px_-15px_rgba(3,10,25,0.6)] p-6 sm:p-7">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#0D2444] flex items-center justify-center shrink-0">
                <img src="/lenz-icon.png" alt="LenzPay logo" className="w-7 h-7 object-contain" />
              </div>
              <div>
                <h1 className="lp-display text-xl font-bold text-[#0B1E3B] tracking-tight">LenzPay</h1>
                <p className="text-xs text-slate-500">School fee management, made visible</p>
              </div>
            </div>

            <form className="mt-6 space-y-3.5" onSubmit={handleSubmit} noValidate>
              {error && (
                <div className="lp-shake bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="lp-username" className="block text-sm font-medium text-[#0B1E3B] mb-1.5">
                  Username
                </label>
                <input
                  id="lp-username"
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  className="block w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-[#F7F9FC] text-[#0B1E3B] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E5FD8] focus:border-transparent transition"
                  placeholder="Enter your username"
                  disabled={loading}
                  autoComplete="username"
                />
              </div>

              <div>
                <label htmlFor="lp-password" className="block text-sm font-medium text-[#0B1E3B] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="lp-password"
                    type={showPassword ? 'text' : 'password'}
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    className="block w-full px-3.5 py-2.5 pr-11 rounded-lg border border-slate-200 bg-[#F7F9FC] text-[#0B1E3B] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E5FD8] focus:border-transparent transition"
                    placeholder="Enter your password"
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-[#0B1E3B] transition"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group w-full mt-2 flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-[#1E5FD8] hover:bg-[#184DB0] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E5FD8] disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign in
                    <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>

              <div className="pt-3 flex items-center gap-1.5 text-xs text-slate-400">
                <ShieldCheckIcon className="w-4 h-4 text-[#34B37A]" />
                Your data is encrypted end to end
              </div>
            </form>
          </div>
        </div>

        {/* LEDGER PANEL — live collections, styled like a printed statement */}
        <div className="lp-rise-2 order-2 bg-[#0D2444] rounded-2xl border border-white/10 p-6">
          <div>
            <h2 className="lp-display text-xl sm:text-2xl leading-tight font-semibold text-white">
              Every cedi, accounted for.
            </h2>
            <p className="mt-1 text-sm text-[#8DA3C4]">A live look at collections across the school.</p>
          </div>

          <div className="mt-5 flex flex-wrap items-end gap-x-8 gap-y-3">
            <div>
              <p className="text-xs text-[#8DA3C4] mb-1">Collected this term</p>
              <p className="lp-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
                GH₵{kpis.collected.toLocaleString()}
              </p>
            </div>
            <div className="flex gap-8 pb-1">
              <div>
                <p className="text-xs text-[#8DA3C4] mb-1">Students paying</p>
                <p className="lp-display text-xl font-semibold text-[#8FC1FF]">{kpis.students.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-[#8DA3C4] mb-1">Success rate</p>
                <p className="lp-display text-xl font-semibold text-[#8FC1FF]">{kpis.successRate}%</p>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-5 border-t border-white/10">
            <p className="text-xs text-[#8DA3C4] mb-2">Collections trend</p>
            <ResponsiveContainer width="100%" height={110}>
              <AreaChart data={monthlyCollectionData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="lpTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8FC1FF" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#8FC1FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#5B739A', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide domain={['dataMin - 2000', 'dataMax + 2000']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#081428',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                  labelStyle={{ color: '#8DA3C4' }}
                  itemStyle={{ color: '#8FC1FF' }}
                  formatter={(value) => [`GH₵${value.toLocaleString()}`, 'Collected']}
                />
                <Area type="monotone" dataKey="amount" stroke="#8FC1FF" strokeWidth={2} fill="url(#lpTrend)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-5 pt-5 border-t border-white/10">
            <p className="text-xs text-[#8DA3C4] mb-2.5">Collection rate by class</p>
            <div className="space-y-2">
              {collectionRateData.map((row, i) => (
                <div key={row.class} className="flex items-center gap-3">
                  <span className="text-xs text-[#B9C7E0] w-16 shrink-0">{row.class}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="lp-bar-fill h-full rounded-full bg-gradient-to-r from-[#1E5FD8] to-[#8FC1FF]"
                      style={{ width: `${row.rate}%`, animationDelay: `${i * 60}ms` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-white w-8 text-right">{row.rate}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[11px] text-[#5B739A] z-10">
        © {currentYear} LenzPay · Built by BinaryLenz
      </p>
    </div>
  );
};

export default Login;
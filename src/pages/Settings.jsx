// src/pages/Settings.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Users,
  BookOpen,
  Shield,
  ExternalLink,
  TrendingUp,
  DollarSign,
  PieChart,
  RefreshCw,
  Download,
  ChevronRight,
} from "lucide-react";
import api from "../api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
} from "recharts";

// ---------- Utility ----------
const formatGHS = (value = 0) =>
  `GH₵${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const formatPercent = (value = 0) => `${Math.round(Number(value || 0))}%`;

const cloneUser = (user) =>
  user
    ? { ...user, school: user.school ? { ...user.school } : null }
    : null;

const cloneClasses = (classes = []) => classes.map((c) => ({ ...c }));

// Muted, ledger-consistent palette for categorical chart data (distinct classes)
const CHART_PALETTE = ["#065f46", "#92400e", "#374151", "#059669", "#b45309", "#57534e"];
const paletteColor = (idx) => CHART_PALETTE[idx % CHART_PALETTE.length];

// ---------- Animated Counter ----------
const AnimatedCounter = ({ value, prefix = "", suffix = "", duration = 600 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const end = Number(value) || 0;
    let frameId;
    const startTime = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(end * eased);
      if (progress < 1) frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);
  return (
    <span className="tabular-nums">
      {prefix}
      {Number.isFinite(count) ? Math.round(count).toLocaleString() : 0}
      {suffix}
    </span>
  );
};

// ---------- Stat Card ----------
const StatCard = ({ icon: Icon, label, value, loading = false, prefix = "", suffix = "" }) => (
  <div className="border border-stone-200 bg-white p-3">
    <div className="flex items-start justify-between gap-2">
      <div>
        <p className="text-xs text-stone-500">{label}</p>
        <p className="ledger-mono text-lg text-stone-800 mt-1 tabular-nums">
          {loading ? (
            <span className="inline-block h-5 w-14 animate-pulse bg-stone-100" />
          ) : (
            <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
          )}
        </p>
      </div>
      <div className="bg-stone-100 p-1.5">
        <Icon size={14} className="text-emerald-800" />
      </div>
    </div>
  </div>
);

// ---------- Chart Card ----------
const ChartCard = ({ title, icon: Icon, children, action }) => (
  <div className="border border-stone-200 bg-white">
    <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200">
      <div className="flex items-center gap-1.5">
        <Icon size={14} className="text-stone-400" />
        <h3 className="text-sm text-stone-700">{title}</h3>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-0.5 text-xs text-emerald-800 hover:text-emerald-900 transition-colors"
        >
          {action.label}
          <ChevronRight size={12} />
        </button>
      )}
    </div>
    <div className="p-3">{children}</div>
  </div>
);

const CustomTooltip = ({ active, payload, label, mode = "currency" }) => {
  if (active && payload?.length)
    return (
      <div className="border border-stone-200 bg-white p-2 text-xs">
        <p className="text-stone-700 mb-0.5">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: {mode === "currency" ? formatGHS(p.value) : formatPercent(p.value)}
          </p>
        ))}
      </div>
    );
  return null;
};

// ---------- PDF Report (offscreen, for export) ----------
const PDFReport = React.forwardRef(function PDFReport({ data }, ref) {
  const classes = data?.classes || [];
  const generatedAt = data?.generatedAt || new Date().toISOString();
  const serif = { fontFamily: "'Fraunces', serif" };
  const mono = { fontFamily: "'IBM Plex Mono', ui-monospace, monospace" };

  const stats = useMemo(() => {
    const totalClasses = classes.length;
    const totalStudents = classes.reduce((sum, cls) => sum + (cls.total_students || 0), 0);
    const totalDue = classes.reduce((sum, cls) => sum + (cls.total_due || 0), 0);
    const totalPaid = classes.reduce((sum, cls) => sum + (cls.total_paid || 0), 0);
    const collectionRate = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;
    const averagePerClass = totalClasses > 0 ? totalPaid / totalClasses : 0;
    return { totalClasses, totalStudents, collectionRate: Math.round(collectionRate), totalRevenue: totalPaid, averagePerClass: Math.round(averagePerClass) };
  }, [classes]);

  const revenueByClass = classes.map((cls) => ({ name: cls.name || "Unnamed", revenue: cls.total_paid || 0 }));
  const collectionRateByClass = classes.map((cls) => ({ name: cls.name || "Unnamed", rate: Math.min(100, cls.collection_rate || 0) }));
  const studentDistribution = classes
    .map((cls, idx) => ({ name: cls.name || "Unnamed", value: cls.total_students || 0, color: paletteColor(idx) }))
    .filter((d) => d.value > 0);

  return (
    <div ref={ref} style={{ position: "absolute", left: "-10000px", top: 0, width: "1120px", background: "#fff", color: "#1c1917" }} aria-hidden="true">
      <div className="min-h-screen bg-white p-6">
        <div className="mb-5 border-b border-stone-300 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 style={serif} className="text-2xl text-stone-900">Settings &amp; analytics report</h1>
              <p className="text-sm text-stone-500">Snapshot exported on {new Date(generatedAt).toLocaleString()}</p>
            </div>
            <div className="border border-stone-300 px-4 py-2 text-right">
              <p className="text-xs text-stone-500">Collection rate</p>
              <p style={mono} className="text-2xl text-emerald-900">{stats.collectionRate}%</p>
            </div>
          </div>
        </div>
        <div className="mb-5 grid grid-cols-4 gap-3">
          <div className="border border-stone-200 p-3"><p className="text-xs text-stone-500">Total classes</p><p style={mono} className="text-xl text-stone-800">{stats.totalClasses}</p></div>
          <div className="border border-stone-200 p-3"><p className="text-xs text-stone-500">Total students</p><p style={mono} className="text-xl text-stone-800">{stats.totalStudents}</p></div>
          <div className="border border-stone-200 p-3"><p className="text-xs text-stone-500">Total revenue</p><p style={mono} className="text-xl text-stone-800">{formatGHS(stats.totalRevenue)}</p></div>
          <div className="border border-stone-200 p-3"><p className="text-xs text-stone-500">Avg per class</p><p style={mono} className="text-xl text-stone-800">{formatGHS(stats.averagePerClass)}</p></div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="border border-stone-200 p-3">
            <h2 style={serif} className="text-sm text-stone-800 mb-2">Revenue by class</h2>
            <div style={{ height: 280 }}><ResponsiveContainer><BarChart data={revenueByClass} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" /><XAxis type="number" tickFormatter={v => `GH₵${Math.round(v / 1000)}k`} /><YAxis type="category" dataKey="name" width={80} fontSize={10} /><Tooltip formatter={v => formatGHS(v)} /><Bar dataKey="revenue" fill="#065f46" radius={[0, 2, 2, 0]} /></BarChart></ResponsiveContainer></div>
          </div>
          <div className="border border-stone-200 p-3">
            <h2 style={serif} className="text-sm text-stone-800 mb-2">Collection rate</h2>
            <div style={{ height: 280 }}><ResponsiveContainer><BarChart data={collectionRateByClass} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" /><XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} /><YAxis type="category" dataKey="name" width={80} fontSize={10} /><Tooltip formatter={v => formatPercent(v)} /><Bar dataKey="rate" fill="#92400e" radius={[0, 2, 2, 0]} /></BarChart></ResponsiveContainer></div>
          </div>
        </div>
        <div className="border border-stone-200 p-3 mb-5">
          <h2 style={serif} className="text-sm text-stone-800 mb-2">Student distribution</h2>
          <div style={{ height: 300 }}>
            <ResponsiveContainer>
              <RePieChart>
                <Pie data={studentDistribution} innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                  {studentDistribution.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-emerald-950 p-4 text-white">
          <p style={serif} className="text-sm">Performance summary</p>
          <p className="text-xs text-emerald-100 mt-1">
            {stats.collectionRate >= 80 ? "Collections are strong this term." : stats.collectionRate >= 60 ? "Collections are on track. Keep following up on balances." : "Collection rate needs attention — review outstanding balances."}
          </p>
        </div>
      </div>
    </div>
  );
});

// ---------- Main Settings Component ----------
const Settings = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSnapshot, setExportSnapshot] = useState(null);
  const reportRef = useRef(null);
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const totalClasses = classes.length;
    const totalStudents = classes.reduce((sum, cls) => sum + (cls.total_students || 0), 0);
    const totalDue = classes.reduce((sum, cls) => sum + (cls.total_due || 0), 0);
    const totalPaid = classes.reduce((sum, cls) => sum + (cls.total_paid || 0), 0);
    const collectionRate = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;
    const averagePerClass = totalClasses > 0 ? totalPaid / totalClasses : 0;
    return { totalClasses, totalStudents, collectionRate: Math.round(collectionRate), totalRevenue: totalPaid, averagePerClass: Math.round(averagePerClass) };
  }, [classes]);

  const revenueByClass = classes.map((cls) => ({ name: cls.name || "Unnamed", revenue: cls.total_paid || 0 }));
  const collectionRateByClass = classes.map((cls) => ({ name: cls.name || "Unnamed", rate: Math.min(100, cls.collection_rate || 0) }));
  const studentDistribution = classes
    .map((cls, idx) => ({ name: cls.name || "Unnamed", value: cls.total_students || 0, color: paletteColor(idx) }))
    .filter((d) => d.value > 0);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classesRes, userRes] = await Promise.all([api.get("/main/class-overview/"), api.get("/auth/user/").catch(() => ({ data: null }))]);
      setClasses(classesRes.data || []);
      setUser(userRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleLogout = () => { localStorage.removeItem("access_token"); localStorage.removeItem("refresh_token"); window.location.href = "/login"; };
  const handleRefresh = async () => { setRefreshing(true); await fetchData(); };
  const handleQuickAction = (route) => navigate(route);

  const handleDownloadReport = async () => {
    if (!reportRef.current) return;
    const snapshot = { classes: cloneClasses(classes), user: cloneUser(user), generatedAt: new Date().toISOString() };
    setExportSnapshot(snapshot);
    setIsExporting(true);
    try {
      await new Promise(r => setTimeout(r, 200));
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: "#fff", windowWidth: reportRef.current.scrollWidth });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }
      pdf.save(`settings-report-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
      setExportSnapshot(null);
    }
  };

  const reportData = exportSnapshot || { classes, user, generatedAt: new Date().toISOString() };

  const quickActions = [
    { label: "Class reports", route: "/classes", icon: BookOpen, desc: "Monitor performance" },
    { label: "Manage students", route: "/students", icon: Users, desc: "Add or update records" },
    { label: "Financial overview", route: "/payments", icon: TrendingUp, desc: "Track revenue" },
  ];

  const performanceMessage =
    stats.collectionRate >= 80 ? "Collections are strong this term." :
    stats.collectionRate >= 60 ? "Collections are on track. Keep following up on balances." :
    "Collection rate needs attention — review outstanding balances.";

  return (
    <div className="min-h-screen bg-stone-50">
      <PDFReport ref={reportRef} data={reportData} />

      <div className="max-w-6xl mx-auto px-5 md:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-stone-300 pb-6">
          <div>
            <h1 className="ledger-display text-3xl text-stone-900 tracking-tight">Settings &amp; analytics</h1>
            <p className="text-sm text-stone-500 mt-1">Monitor school performance and manage your account.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 transition-colors"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh
            </button>
            <button
              onClick={handleDownloadReport}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-emerald-800 hover:bg-emerald-900 transition-colors disabled:opacity-50"
            >
              <Download size={14} />{isExporting ? "Exporting…" : "Export PDF"}
            </button>
          </div>
        </div>

        {/* User card */}
        {user && (
          <div className="mb-6 border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-emerald-900 flex items-center justify-center flex-shrink-0">
                  <img src="/lenz-icon.png" alt="" className="h-5 w-5 object-contain brightness-0 invert" />
                </div>
                <div>
                  <h2 className="text-sm text-stone-900">{user.first_name} {user.last_name}</h2>
                  <p className="text-xs text-stone-500">{user.email}</p>
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-800 mt-1">
                    <Shield size={11} />{user.school?.name || "Admin"}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-700 border border-rose-200 hover:bg-rose-50 transition-colors"
              >
                <LogOut size={13} /> Sign out
              </button>
            </div>
          </div>
        )}

        {/* Key metrics */}
        <div className="mb-6">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-sm text-stone-700">Key metrics</h2>
            <span className="text-xs text-emerald-700">Live</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={BookOpen} label="Classes" value={stats.totalClasses} loading={loading} />
            <StatCard icon={Users} label="Students" value={stats.totalStudents} loading={loading} />
            <StatCard icon={TrendingUp} label="Collection rate" value={stats.collectionRate} suffix="%" loading={loading} />
            <StatCard icon={DollarSign} label="Revenue" value={stats.totalRevenue} prefix="GH₵" loading={loading} />
          </div>
        </div>

        {/* Charts */}
        <div className="mb-6">
          <h2 className="text-sm text-stone-700 mb-3">Class analytics</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Revenue by class" icon={DollarSign} action={{ label: "View classes", onClick: () => navigate("/classes") }}>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  {revenueByClass.length ? (
                    <BarChart data={revenueByClass} layout="vertical" margin={{ left: 60, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" horizontal={false} />
                      <XAxis type="number" tickFormatter={v => `GH₵${Math.round(v / 1000)}k`} tick={{ fontSize: 9, fill: '#78716c' }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 9, fill: '#78716c' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip mode="currency" />} cursor={{ fill: '#f5f5f4' }} />
                      <Bar dataKey="revenue" fill="#065f46" radius={[0, 2, 2, 0]} />
                    </BarChart>
                  ) : <div className="flex h-full items-center justify-center text-stone-400 text-xs">No data yet</div>}
                </ResponsiveContainer>
              </div>
            </ChartCard>
            <ChartCard title="Collection rate by class" icon={TrendingUp} action={{ label: "Improve", onClick: () => navigate("/payments") }}>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  {collectionRateByClass.length ? (
                    <BarChart data={collectionRateByClass} layout="vertical" margin={{ left: 60, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 9, fill: '#78716c' }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 9, fill: '#78716c' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip mode="percent" />} cursor={{ fill: '#f5f5f4' }} />
                      <Bar dataKey="rate" fill="#92400e" radius={[0, 2, 2, 0]} />
                    </BarChart>
                  ) : <div className="flex h-full items-center justify-center text-stone-400 text-xs">No data yet</div>}
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
          <div className="mt-4">
            <ChartCard title="Student distribution by class" icon={PieChart}>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  {studentDistribution.length ? (
                    <RePieChart>
                      <Pie data={studentDistribution} innerRadius={50} outerRadius={90} dataKey="value" paddingAngle={2} stroke="none" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: '#a8a29e', strokeWidth: 1 }}>
                        {studentDistribution.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip formatter={val => [`${val} students`, "Enrollment"]} contentStyle={{ fontSize: '11px', border: '1px solid #e7e5e4', borderRadius: 0, boxShadow: 'none' }} />
                    </RePieChart>
                  ) : <div className="flex h-full items-center justify-center text-stone-400 text-xs">No students yet</div>}
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
        </div>

        {/* Performance banner — the one bold accent on the page */}
        <div className="mb-6 bg-emerald-950 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4 text-white">
            <div>
              <h3 className="ledger-display text-lg">Performance</h3>
              <p className="text-xs text-emerald-100 mt-1">{performanceMessage}</p>
            </div>
            <div className="text-right">
              <p className="ledger-mono text-2xl tabular-nums">{stats.collectionRate}%</p>
              <p className="text-xs text-emerald-200">Collection rate</p>
            </div>
          </div>
        </div>

        {/* Account & Quick actions */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="border border-stone-200 bg-white p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm text-stone-800">Account</h3>
                <p className="text-xs text-stone-500">Session and security</p>
              </div>
              <Shield size={14} className="text-stone-400" />
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-stone-100 pb-1.5">
                <span className="text-stone-500">Last login</span>
                <span className="ledger-mono text-stone-700">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between border-b border-stone-100 pb-1.5">
                <span className="text-stone-500">Role</span>
                <span className="text-stone-700">Admin</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Active since</span>
                <span className="ledger-mono text-stone-700">{new Date().getFullYear()}</span>
              </div>
            </div>
          </div>

          <div className="border border-stone-200 bg-white p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm text-stone-800">Quick actions</h3>
                <p className="text-xs text-stone-500">Jump to sections</p>
              </div>
              <ExternalLink size={14} className="text-stone-400" />
            </div>
            <div>
              {quickActions.map((a) => (
                <button
                  key={a.route}
                  onClick={() => handleQuickAction(a.route)}
                  className="group flex w-full items-center justify-between py-2 -mx-1 px-1 hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <a.icon size={14} className="text-stone-400 group-hover:text-emerald-800 transition-colors" />
                    <div className="text-left">
                      <p className="text-xs text-stone-700">{a.label}</p>
                      <p className="text-[10px] text-stone-400">{a.desc}</p>
                    </div>
                  </div>
                  <ChevronRight size={13} className="text-stone-300 group-hover:text-emerald-700 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-stone-200 pt-4 text-center">
          <p className="text-xs text-stone-400">LenzPay school management system, v2.0.</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
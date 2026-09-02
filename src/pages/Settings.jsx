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
  BarChart3,
  PieChart,
  RefreshCw,
  Download,
  Settings as SettingsIcon,
  Sparkles,
  Activity,
  ChevronRight,
  FileText,
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

// ---------- Animated Counter (compact) ----------
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

// ---------- Compact Stat Card ----------
const StatCard = ({ icon: Icon, label, value, color, loading = false, prefix = "", suffix = "" }) => {
  const colorSchemes = {
    primary: { bg: "from-blue-50/60 to-blue-100/30", iconBg: "bg-blue-500", text: "text-blue-700" },
    green: { bg: "from-emerald-50/60 to-emerald-100/30", iconBg: "bg-emerald-500", text: "text-emerald-700" },
    purple: { bg: "from-violet-50/60 to-violet-100/30", iconBg: "bg-violet-500", text: "text-violet-700" },
    orange: { bg: "from-amber-50/60 to-amber-100/30", iconBg: "bg-amber-500", text: "text-amber-700" },
  };
  const scheme = colorSchemes[color] || colorSchemes.primary;
  return (
    <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br backdrop-blur-sm border border-white/40 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 animate-fadeInUp" style={{ background: `linear-gradient(135deg, ${scheme.bg})` }}>
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/20 blur-xl group-hover:scale-150 transition-transform duration-500" />
      <div className="relative p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{label}</p>
            <p className="text-lg font-bold text-gray-800">
              {loading ? <span className="inline-block h-5 w-12 animate-pulse rounded bg-gray-200" /> :
                <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />}
            </p>
          </div>
          <div className={`rounded-xl p-1.5 ${scheme.iconBg} bg-opacity-15 shadow-md transition-transform group-hover:scale-110`}>
            <Icon size={14} className={`${scheme.text} drop-shadow-sm`} />
          </div>
        </div>
        <div className="mt-2 h-0.5 w-full overflow-hidden rounded-full bg-gray-200/50">
          <div className={`h-full w-3/4 rounded-full ${scheme.iconBg} bg-opacity-60`} />
        </div>
      </div>
    </div>
  );
};

// ---------- Chart Card (compact) ----------
const ChartCard = ({ title, icon: Icon, children, action }) => (
  <div className="overflow-hidden rounded-xl border border-white/40 bg-white/60 backdrop-blur-sm shadow-sm transition-all duration-300 hover:shadow-md animate-fadeInUp">
    <div className="flex items-center justify-between border-b border-gray-100/80 px-4 pb-2 pt-3">
      <div className="flex items-center gap-1.5">
        <div className="rounded-lg bg-indigo-50 p-1"><Icon size={14} className="text-indigo-600" /></div>
        <h3 className="text-xs font-semibold text-gray-700">{title}</h3>
      </div>
      {action && (
        <button onClick={action.onClick} className="flex items-center gap-0.5 text-[10px] text-indigo-600 hover:text-indigo-800 transition">
          {action.label}<ChevronRight size={12} />
        </button>
      )}
    </div>
    <div className="p-3">{children}</div>
  </div>
);

// ---------- PDF Report (compact style for export, still readable) ----------
const PDFReport = React.forwardRef(function PDFReport({ data }, ref) {
  const classes = data?.classes || [];
  const user = data?.user || null;
  const generatedAt = data?.generatedAt || new Date().toISOString();

  const stats = useMemo(() => {
    const totalClasses = classes.length;
    const totalStudents = classes.reduce((sum, cls) => sum + (cls.total_students || 0), 0);
    const totalDue = classes.reduce((sum, cls) => sum + (cls.total_due || 0), 0);
    const totalPaid = classes.reduce((sum, cls) => sum + (cls.total_paid || 0), 0);
    const collectionRate = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;
    const averagePerClass = totalClasses > 0 ? totalPaid / totalClasses : 0;
    return { totalClasses, totalStudents, collectionRate: Math.round(collectionRate), totalRevenue: totalPaid, averagePerClass: Math.round(averagePerClass) };
  }, [classes]);

  const revenueByClass = classes.map((cls) => ({ name: cls.name || "Unnamed", revenue: cls.total_paid || 0, collectionRate: cls.collection_rate || 0, students: cls.total_students || 0 }));
  const collectionRateByClass = classes.map((cls) => ({ name: cls.name || "Unnamed", rate: Math.min(100, cls.collection_rate || 0) }));
  const studentDistribution = classes.map((cls, idx) => ({ name: cls.name || "Unnamed", value: cls.total_students || 0, color: `hsl(${(idx * 45) % 360}, 70%, 60%)` })).filter(d => d.value > 0);

  return (
    <div ref={ref} style={{ position: "absolute", left: "-10000px", top: 0, width: "1120px", background: "#fff", color: "#0f172a" }} aria-hidden="true">
      <div className="min-h-screen bg-white p-6">
        <div className="mb-5 border-b pb-4">
          <div className="flex items-center justify-between">
            <div><h1 className="text-2xl font-bold">Settings & Analytics Report</h1><p className="text-sm text-slate-500">Snapshot exported on {new Date(generatedAt).toLocaleString()}</p></div>
            <div className="rounded-xl border px-4 py-2 text-right"><p className="text-xs uppercase">Collection Rate</p><p className="text-2xl font-bold text-indigo-700">{stats.collectionRate}%</p></div>
          </div>
        </div>
        <div className="mb-5 grid grid-cols-4 gap-3">
          <div className="rounded-xl border p-3"><p className="text-xs uppercase">Total Classes</p><p className="text-xl font-bold">{stats.totalClasses}</p></div>
          <div className="rounded-xl border p-3"><p className="text-xs uppercase">Total Students</p><p className="text-xl font-bold">{stats.totalStudents}</p></div>
          <div className="rounded-xl border p-3"><p className="text-xs uppercase">Total Revenue</p><p className="text-xl font-bold">{formatGHS(stats.totalRevenue)}</p></div>
          <div className="rounded-xl border p-3"><p className="text-xs uppercase">Avg per Class</p><p className="text-xl font-bold">{formatGHS(stats.averagePerClass)}</p></div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="border rounded-xl p-3"><h2 className="text-sm font-semibold mb-2">Revenue by Class</h2><div style={{ height: 280 }}><ResponsiveContainer><BarChart data={revenueByClass} layout="vertical"><CartesianGrid strokeDasharray="3 3"/><XAxis type="number" tickFormatter={v=>`GH₵${Math.round(v/1000)}k`}/><YAxis type="category" dataKey="name" width={80} fontSize={10}/><Tooltip formatter={v=>formatGHS(v)}/><Bar dataKey="revenue" fill="#6366f1" radius={[0,6,6,0]}/></BarChart></ResponsiveContainer></div></div>
          <div className="border rounded-xl p-3"><h2 className="text-sm font-semibold mb-2">Collection Rate</h2><div style={{ height: 280 }}><ResponsiveContainer><BarChart data={collectionRateByClass} layout="vertical"><CartesianGrid strokeDasharray="3 3"/><XAxis type="number" domain={[0,100]} tickFormatter={v=>`${v}%`}/><YAxis type="category" dataKey="name" width={80} fontSize={10}/><Tooltip formatter={v=>formatPercent(v)}/><Bar dataKey="rate" fill="#8b5cf6" radius={[0,6,6,0]}/></BarChart></ResponsiveContainer></div></div>
        </div>
        <div className="border rounded-xl p-3 mb-5"><h2 className="text-sm font-semibold mb-2">Student Distribution</h2><div style={{ height: 300 }}><ResponsiveContainer><RePieChart><Pie data={studentDistribution} innerRadius={60} outerRadius={100} dataKey="value" label={({name,percent})=>`${name}: ${(percent*100).toFixed(0)}%`}><Cell fill="#6366f1"/></Pie><Tooltip/></RePieChart></ResponsiveContainer></div></div>
        <div className="rounded-xl bg-slate-900 p-4 text-white"><p className="text-sm font-semibold">Performance Summary</p><p className="text-xs text-slate-200 mt-1">{stats.collectionRate >= 80 ? "Excellent. Keep up the great work." : stats.collectionRate >= 60 ? "Good progress. Maintain momentum." : "Collection rate needs attention. Review outstanding balances."}</p></div>
      </div>
    </div>
  );
});

// ---------- Main Settings Component (Elite Compact) ----------
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
  const studentDistribution = classes.map((cls, idx) => ({ name: cls.name || "Unnamed", value: cls.total_students || 0, color: `hsl(${(idx * 45) % 360}, 70%, 60%)` })).filter(d => d.value > 0);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classesRes, userRes] = await Promise.all([api.get("/main/class-overview/"), api.get("/auth/user/").catch(() => ({ data: null }))]);
      setClasses(classesRes.data || []);
      setUser(userRes.data);
    } catch (error) { console.error(error); } finally { setLoading(false); setRefreshing(false); }
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
      pdf.save(`settings-report-${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (err) { console.error(err); } finally { setIsExporting(false); setExportSnapshot(null); }
  };

  const reportData = exportSnapshot || { classes, user, generatedAt: new Date().toISOString() };
  const CustomTooltip = ({ active, payload, label, mode = "currency" }) => {
    if (active && payload?.length) return (<div className="rounded-lg border bg-white/95 p-2 text-xs shadow-md"><p className="font-semibold text-gray-700">{label}</p>{payload.map((p,i)=> <p key={i} style={{color:p.color}}>{p.name}: {mode==="currency"?formatGHS(p.value):formatPercent(p.value)}</p>)}</div>);
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <PDFReport ref={reportRef} data={reportData} />
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-indigo-200/30 blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -left-20 h-48 w-48 rounded-full bg-emerald-200/20 blur-3xl animate-pulse delay-700" />
        <div className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-amber-200/20 blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative mx-auto max-w-6xl p-4 lg:p-6">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 p-1.5 shadow"><SettingsIcon size={18} className="text-white" /></div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-slate-800 to-indigo-800 bg-clip-text text-transparent">Settings & Analytics</h1>
            </div>
            <p className="text-[11px] text-gray-500 ml-1">Monitor school performance and manage your account</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white/60 px-3 py-1.5 text-[11px] text-gray-600 backdrop-blur-sm transition hover:border-indigo-200 hover:text-indigo-600"><RefreshCw size={12} className={refreshing ? "animate-spin" : ""}/> Refresh</button>
            <button onClick={handleDownloadReport} disabled={isExporting} className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-3 py-1.5 text-[11px] text-white shadow-md transition hover:-translate-y-0.5"><Download size={12}/>{isExporting ? "Exporting..." : "Export PDF"}</button>
          </div>
        </div>

        {/* User Card */}
        {user && (
          <div className="group relative mb-6 rounded-xl border border-white/50 bg-white/70 p-3 backdrop-blur-md shadow-sm transition-all hover:shadow-md animate-fadeInUp">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative"><div className="absolute inset-0 rounded-full bg-indigo-400/40 blur-md group-hover:blur-lg transition"/><div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 shadow"><img src="/lenz-icon.png" alt="avatar" className="h-6 w-6 object-contain brightness-0 invert" /></div></div>
                <div><h2 className="text-sm font-bold text-gray-800">{user.first_name} {user.last_name}</h2><p className="text-[11px] text-gray-500">{user.email}</p><div className="mt-1 inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700"><Shield size={10}/>{user.school?.name || "Admin"}</div></div>
              </div>
              <button onClick={handleLogout} className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-500/10 px-3 py-1.5 text-[11px] font-medium text-red-600 transition hover:bg-red-500 hover:text-white"><LogOut size={12}/> Sign Out</button>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-1.5"><div className="rounded-lg bg-indigo-100 p-1"><BarChart3 size={14} className="text-indigo-600"/></div><h2 className="text-sm font-semibold text-gray-700">Key Metrics</h2><span className="text-[10px] text-gray-400">Live</span></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={BookOpen} label="Classes" value={stats.totalClasses} color="primary" loading={loading} />
            <StatCard icon={Users} label="Students" value={stats.totalStudents} color="green" loading={loading} />
            <StatCard icon={TrendingUp} label="Collection Rate" value={stats.collectionRate} suffix="%" color="purple" loading={loading} />
            <StatCard icon={DollarSign} label="Revenue" value={stats.totalRevenue} prefix="GH₵" color="orange" loading={loading} />
          </div>
        </div>

        {/* Charts */}
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-1.5"><div className="rounded-lg bg-indigo-100 p-1"><Activity size={14} className="text-indigo-600"/></div><h2 className="text-sm font-semibold text-gray-700">Class Analytics</h2></div>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Revenue by Class" icon={DollarSign} action={{ label: "View Classes", onClick: () => navigate("/classes") }}>
              <div className="h-64"><ResponsiveContainer width="100%" height="100%">{revenueByClass.length ? <BarChart data={revenueByClass} layout="vertical" margin={{ left: 60, right: 10 }}><CartesianGrid strokeDasharray="3 3"/><XAxis type="number" tickFormatter={v=>`GH₵${Math.round(v/1000)}k`} tick={{fontSize:9}}/><YAxis type="category" dataKey="name" width={70} tick={{fontSize:9}}/><Tooltip content={<CustomTooltip mode="currency"/>}/><Bar dataKey="revenue" fill="#6366f1" radius={[0,6,6,0]}/></BarChart> : <div className="flex h-full items-center justify-center text-gray-400 text-xs">No data</div>}</ResponsiveContainer></div>
            </ChartCard>
            <ChartCard title="Collection Rate by Class" icon={TrendingUp} action={{ label: "Improve", onClick: () => navigate("/payments") }}>
              <div className="h-64"><ResponsiveContainer>{collectionRateByClass.length ? <BarChart data={collectionRateByClass} layout="vertical" margin={{ left: 60, right: 10 }}><CartesianGrid strokeDasharray="3 3"/><XAxis type="number" domain={[0,100]} tickFormatter={v=>`${v}%`} tick={{fontSize:9}}/><YAxis type="category" dataKey="name" width={70} tick={{fontSize:9}}/><Tooltip content={<CustomTooltip mode="percent"/>}/><Bar dataKey="rate" fill="#8b5cf6" radius={[0,6,6,0]}/></BarChart> : <div className="flex h-full items-center justify-center text-gray-400 text-xs">No data</div>}</ResponsiveContainer></div>
            </ChartCard>
          </div>
          <div className="mt-4">
            <ChartCard title="Student Distribution by Class" icon={PieChart}>
              <div className="h-72"><ResponsiveContainer>{studentDistribution.length ? <RePieChart><Pie data={studentDistribution} innerRadius={50} outerRadius={90} dataKey="value" label={({name,percent})=>`${name}: ${(percent*100).toFixed(0)}%`} labelLine={{stroke:"#94a3b8"}}><Cell fill="#6366f1"/></Pie><Tooltip formatter={val=>[`${val} students`,"Enrollment"]}/></RePieChart> : <div className="flex h-full items-center justify-center text-gray-400 text-xs">No students</div>}</ResponsiveContainer></div>
            </ChartCard>
          </div>
        </div>

        {/* Performance Banner */}
        <div className="relative mb-6 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-800 p-4 shadow-md">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl animate-pulse" />
          <div className="relative flex flex-wrap items-center justify-between gap-3 text-white">
            <div><h3 className="flex items-center gap-1 text-sm font-bold">Performance Dashboard <Sparkles size={12} className="text-yellow-300"/></h3><p className="text-[11px] text-indigo-100">{stats.collectionRate>=80?"Excellent collection rate! 🎉 Keep it up.":stats.collectionRate>=60?"Good progress! 📈 Maintain momentum.":"Let's improve collections together. 💪"}</p></div>
            <div className="rounded-lg bg-white/20 px-3 py-1.5 text-center backdrop-blur-sm"><div className="text-xl font-bold">{stats.collectionRate}%</div><div className="text-[10px] text-indigo-100">Collection Rate</div></div>
          </div>
        </div>

        {/* Account & Quick Actions */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-100 bg-white/60 p-4 backdrop-blur-sm shadow-sm transition hover:shadow-md">
            <div className="flex items-start justify-between"><div><h3 className="text-xs font-semibold text-gray-800">Account</h3><p className="text-[10px] text-gray-500">Session & security</p></div><div className="rounded-lg bg-indigo-50 p-1"><Shield size={14} className="text-indigo-600"/></div></div>
            <div className="mt-3 space-y-2 text-[11px]"><div className="flex justify-between border-b pb-1"><span className="text-gray-500">Last login</span><span className="font-medium">{new Date().toLocaleDateString()}</span></div><div className="flex justify-between border-b pb-1"><span className="text-gray-500">Role</span><span className="font-medium">Admin</span></div><div className="flex justify-between"><span className="text-gray-500">Active since</span><span className="font-medium">{new Date().getFullYear()}</span></div></div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white/60 p-4 backdrop-blur-sm shadow-sm transition hover:shadow-md">
            <div className="flex items-start justify-between"><div><h3 className="text-xs font-semibold text-gray-800">Quick Actions</h3><p className="text-[10px] text-gray-500">Jump to sections</p></div><div className="rounded-lg bg-indigo-50 p-1"><ExternalLink size={14} className="text-indigo-600"/></div></div>
            <div className="mt-2 space-y-1.5">
              {[ {label:"Class reports", route:"/classes", icon:BookOpen, desc:"Monitor performance"}, {label:"Manage students", route:"/students", icon:Users, desc:"Add or update records"}, {label:"Financial overview", route:"/payments", icon:TrendingUp, desc:"Track revenue"} ].map((a)=>(
                <button key={a.route} onClick={()=>handleQuickAction(a.route)} className="group flex w-full items-center justify-between rounded-lg p-2 transition-all hover:bg-indigo-50">
                  <div className="flex items-center gap-2"><div className="rounded-md bg-gray-100 p-1 group-hover:bg-indigo-100"><a.icon size={12} className="text-gray-500 group-hover:text-indigo-600"/></div><div className="text-left"><p className="text-[11px] font-medium text-gray-700 group-hover:text-indigo-700">{a.label}</p><p className="text-[9px] text-gray-400">{a.desc}</p></div></div><ChevronRight size={12} className="text-gray-300 group-hover:text-indigo-500"/>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 border-t border-gray-200/50 pt-3 text-center"><p className="text-[10px] text-gray-400">School Management System v2.0 • {new Date().getFullYear()} LenzPay • Real-time Analytics</p></div>
      </div>
      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.96); } to { opacity:1; transform:scale(1); } }
        .animate-fadeInUp { animation: fadeInUp 0.25s ease-out forwards; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default Settings;
// src/pages/Settings.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Users, BookOpen, School, User, TrendingUp, Calendar, Shield, ExternalLink } from "lucide-react";
import api from '../api';

const Settings = () => {
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    collectionRate: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardStats();
    fetchUserInfo();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/main/class-overview/');
      const classData = response.data;
      
      const totalClasses = classData.length;
      const totalStudents = classData.reduce((sum, cls) => sum + (cls.total_students || 0), 0);
      const totalDue = classData.reduce((sum, cls) => sum + parseFloat(cls.total_due || 0), 0);
      const totalPaid = classData.reduce((sum, cls) => sum + parseFloat(cls.total_paid || 0), 0);
      const collectionRate = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;

      setStats({
        totalClasses,
        totalStudents,
        collectionRate: Math.round(collectionRate),
        totalRevenue: totalPaid
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserInfo = async () => {
    try {
      const response = await api.get('/auth/user/');
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  };

  const handleQuickAction = (route) => {
    navigate(route);
  };

  const StatCard = ({ icon: Icon, label, value, color = "primary", gradient = false }) => {
    const colorMap = {
      primary: "from-primary-500 to-primary-600",
      green: "from-emerald-500 to-teal-600",
      purple: "from-violet-500 to-purple-600",
      orange: "from-orange-500 to-amber-600"
    };

    const bgMap = {
      primary: "bg-primary-50",
      green: "bg-emerald-50",
      purple: "bg-violet-50",
      orange: "bg-orange-50"
    };

    const textMap = {
      primary: "text-primary-600",
      green: "text-emerald-600",
      purple: "text-violet-600",
      orange: "text-orange-600"
    };

    return (
      <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-800">
              {loading ? <span className="animate-pulse">...</span> : value}
            </p>
          </div>
          <div className={`p-3 rounded-xl ${bgMap[color]} group-hover:scale-110 transition-transform duration-200`}>
            <Icon size={22} className={textMap[color]} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30 p-6 lg:p-8">
      <div className="max-w-6xl mx-auto animate-fade-in-up">
        {/* Header with gradient accent */}
        <div className="mb-8 relative">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary-200/30 rounded-full blur-3xl"></div>
          <div className="relative">
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-800 to-primary-800 bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-gray-500 mt-2">Manage your account and view school overview</p>
          </div>
        </div>

        {/* User Profile Card - Glassmorphic with icon */}
        {user && (
          <div className="relative group mb-8 bg-white/70 backdrop-blur-md rounded-2xl shadow-md border border-white/50 p-6 transition-all duration-300 hover:shadow-xl">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full blur-md opacity-60 group-hover:opacity-100 transition"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center shadow-lg">
                  <img 
                    src="/lenz-icon.png" 
                    alt="User Avatar" 
                    className="w-10 h-10 object-contain brightness-0 invert"
                  />
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-xl font-bold text-gray-800">
                  {user.first_name} {user.last_name}
                </h2>
                <p className="text-gray-500">{user.email}</p>
                <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-primary-50 rounded-full text-xs font-medium text-primary-700">
                  <Shield size={12} />
                  {user.school?.name || 'School Administrator'}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 backdrop-blur-sm text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-all duration-200 font-medium border border-red-200/50"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* School Overview Section */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-5">
            <School size={22} className="text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-800">School Overview</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard icon={BookOpen} label="Total Classes" value={stats.totalClasses} color="primary" />
            <StatCard icon={Users} label="Total Students" value={stats.totalStudents} color="green" />
            <StatCard icon={TrendingUp} label="Collection Rate" value={`${stats.collectionRate}%`} color="purple" />
            <StatCard icon={School} label="Total Revenue" value={`GH₵${stats.totalRevenue.toLocaleString()}`} color="orange" />
          </div>
        </div>

        {/* Performance Banner - Gradient with glass */}
        <div className="relative mb-10 overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 to-primary-800 p-6 shadow-lg">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-white">
            <div>
              <h3 className="text-xl font-bold mb-1">School Performance</h3>
              <p className="text-primary-100">
                {stats.collectionRate >= 80 ? "Excellent collection rate! 🎉 Keep up the great work." :
                 stats.collectionRate >= 60 ? "Good progress, keep it up! 📈" :
                 "Let's work on improving collections 💪"}
              </p>
            </div>
            <div className="text-center bg-white/20 backdrop-blur-sm rounded-xl px-5 py-2">
              <div className="text-3xl font-bold">{stats.collectionRate}%</div>
              <div className="text-sm text-primary-100">Collection Rate</div>
            </div>
          </div>
        </div>

        {/* Account & System Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Account Management Card */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Account Management</h3>
                <p className="text-gray-500 text-sm mt-1">Manage your session and security</p>
              </div>
              <div className="p-2 bg-primary-50 rounded-xl">
                <Shield size={20} className="text-primary-600" />
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                <span className="text-gray-600">Last login</span>
                <span className="font-medium text-gray-800">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                <span className="text-gray-600">Role</span>
                <span className="font-medium text-gray-800">School Administrator</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Active since</span>
                <span className="font-medium text-gray-800">{new Date().getFullYear()}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Quick Actions</h3>
                <p className="text-gray-500 text-sm mt-1">Jump to important sections</p>
              </div>
              <div className="p-2 bg-primary-50 rounded-xl">
                <ExternalLink size={20} className="text-primary-600" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {[
                { label: "View class reports", route: "/classes", icon: BookOpen },
                { label: "Manage students", route: "/students", icon: Users },
                { label: "Financial overview", route: "/payments", icon: TrendingUp }
              ].map((action) => (
                <button
                  key={action.route}
                  onClick={() => handleQuickAction(action.route)}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-primary-50 transition group"
                >
                  <span className="flex items-center gap-3 text-gray-700 group-hover:text-primary-700">
                    <action.icon size={18} className="text-gray-400 group-hover:text-primary-500" />
                    {action.label}
                  </span>
                  <ExternalLink size={14} className="text-gray-300 group-hover:text-primary-500" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-gray-200/50">
          <p className="text-gray-400 text-sm">
            School Management System v1.0 • {new Date().getFullYear()} LenzPay
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
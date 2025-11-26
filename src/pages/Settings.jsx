import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Users, BookOpen, School, User } from "lucide-react";
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

  const StatCard = ({ icon: Icon, label, value, color = "blue" }) => {
    const colorClasses = {
      blue: "bg-blue-50 text-blue-600",
      green: "bg-green-50 text-green-600", 
      purple: "bg-purple-50 text-purple-600",
      orange: "bg-orange-50 text-orange-600"
    };

    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900">
              {loading ? "..." : value}
            </p>
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon size={24} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account and view school overview</p>
        </div>

        {/* User Profile Card */}
        {user && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <User size={28} className="text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900">
                  {user.first_name} {user.last_name}
                </h2>
                <p className="text-gray-600">{user.email}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {user.school?.name || 'School Administrator'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* School Overview */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">School Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              icon={BookOpen} 
              label="Total Classes" 
              value={stats.totalClasses}
              color="blue"
            />
            <StatCard 
              icon={Users} 
              label="Total Students" 
              value={stats.totalStudents}
              color="green"
            />
            <StatCard 
              icon={School} 
              label="Collection Rate" 
              value={`${stats.collectionRate}%`}
              color="purple"
            />
            <StatCard 
              icon={LogOut} 
              label="Total Revenue" 
              value={`GH₵${stats.totalRevenue.toLocaleString()}`}
              color="orange"
            />
          </div>
        </div>

        {/* Performance Banner */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">School Performance</h3>
              <p className="text-blue-100">
                {stats.collectionRate >= 80 ? "Excellent collection rate! 🎉" :
                 stats.collectionRate >= 60 ? "Good progress, keep it up! 📈" :
                 "Let's work on improving collections 💪"}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{stats.collectionRate}%</div>
              <div className="text-blue-200 text-sm">Collection Rate</div>
            </div>
          </div>
        </div>

        {/* Account Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Account Management</h2>
              <p className="text-gray-600 text-sm mt-1">
                Manage your account session and security
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center gap-3 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
            >
              <LogOut size={20} />
              Sign Out
            </button>
          </div>
          
          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">System Information</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• Last login: {new Date().toLocaleDateString()}</li>
                  <li>• Role: School Administrator</li>
                  <li>• Active since: {new Date().getFullYear()}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Quick Actions</h4>
                <ul className="space-y-1">
                  <li 
                    onClick={() => handleQuickAction('/classes')}
                    className="text-blue-600 hover:text-blue-700 cursor-pointer hover:underline"
                  >
                    • View class reports
                  </li>
                  <li 
                    onClick={() => handleQuickAction('/students')}
                    className="text-blue-600 hover:text-blue-700 cursor-pointer hover:underline"
                  >
                    • Manage students
                  </li>
                  <li 
                    onClick={() => handleQuickAction('/payments')}
                    className="text-blue-600 hover:text-blue-700 cursor-pointer hover:underline"
                  >
                    • Financial overview
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            School Management System v1.0 • {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
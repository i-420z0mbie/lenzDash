import React, { useState, useEffect } from "react";
import { Database, Download, LogOut, RefreshCcw } from "lucide-react";

const Settings = () => {
  const [themeColor, setThemeColor] = useState(
    localStorage.getItem("themeColor") || "#2563eb"
  );

  useEffect(() => {
    document.documentElement.style.setProperty("--theme-color", themeColor);
    localStorage.setItem("themeColor", themeColor);
  }, [themeColor]);

  const handleBackup = () => alert("Backing up school data...");
  const handleExport = () => alert("Exporting school records...");
  const handleLogout = () => alert("Logged out successfully!");
  const handleReset = () => alert("System cache cleared!");

  return (
    <div className="p-6 space-y-8 animate-fade-in transition-colors duration-300">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          ⚙️ School Settings
        </h1>
        <p className="text-gray-600">
          Manage your system preferences and configurations.
        </p>
      </div>

      {/* 🎨 Appearance */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-all">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          🎨 Appearance
        </h2>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <label className="text-gray-700 font-medium">Theme Color:</label>
            <input
              type="color"
              value={themeColor}
              onChange={(e) => setThemeColor(e.target.value)}
              className="w-10 h-10 border border-gray-300 rounded-full cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 🏫 School Info */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-all">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          🏫 School Information
        </h2>
        <div className="space-y-3">
          <p className="text-gray-700">
            <span className="font-medium">School Name:</span> Bright Future Academy
          </p>
          <p className="text-gray-700">
            <span className="font-medium">Location:</span> Tema, Accra, Ghana
          </p>
          <p className="text-gray-700">
            <span className="font-medium">Established:</span> 2010
          </p>
        </div>
      </div>

      {/* 🔔 Notifications & Privacy */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-all">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          🔔 Notifications & Privacy
        </h2>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3 text-gray-700">
            <input type="checkbox" defaultChecked className="w-5 h-5" />
            Enable Email Notifications
          </label>
          <label className="flex items-center gap-3 text-gray-700">
            <input type="checkbox" className="w-5 h-5" />
            Allow Data Collection for Analytics
          </label>
          <label className="flex items-center gap-3 text-gray-700">
            <input type="checkbox" defaultChecked className="w-5 h-5" />
            Auto Backup Every Week
          </label>
        </div>
      </div>

      {/* 👥 User Management */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-all">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          👥 User Management
        </h2>
        <div className="space-y-3">
          <p className="text-gray-700">
            Total Users: <span className="font-semibold">45</span>
          </p>
          <p className="text-gray-700">
            Active Teachers: <span className="font-semibold">10</span>
          </p>
          <p className="text-gray-700">
            Registered Students: <span className="font-semibold">400+</span>
          </p>
        </div>
      </div>

      {/* 🧩 System Settings */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-all">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          🧩 System Maintenance
        </h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-gray-700">Backup School Data</p>
            <button
              onClick={handleBackup}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Database size={18} />
              Backup
            </button>
          </div>

          <div className="flex justify-between items-center">
            <p className="text-gray-700">Export Records</p>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Download size={18} />
              Export
            </button>
          </div>

          <div className="flex justify-between items-center">
            <p className="text-gray-700">Clear Cache</p>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2"
            >
              <RefreshCcw size={18} />
              Clear
            </button>
          </div>

          <div className="flex justify-between items-center">
            <p className="text-gray-700">System Version</p>
            <span className="text-sm text-gray-500">v1.2.0 (Stable)</span>
          </div>
        </div>
      </div>

      {/* 👤 Admin Account */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-all">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">👤 Admin Account</h2>
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium text-gray-800">Admin: John Doe</p>
            <p className="text-gray-500 text-sm">admin@school.com</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;

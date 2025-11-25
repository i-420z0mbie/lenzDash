import React, { useState, useEffect } from "react";
import { LogOut, Palette } from "lucide-react";

const Settings = () => {
  const [themeColor, setThemeColor] = useState(
    localStorage.getItem("themeColor") || "#2563eb"
  );

  useEffect(() => {
    document.documentElement.style.setProperty("--theme-color", themeColor);
    localStorage.setItem("themeColor", themeColor);
  }, [themeColor]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your preferences</p>
        </div>

        {/* Appearance Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Palette size={20} className="text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Appearance</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme Color
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
                />
                <div className="flex gap-2">
                  {["#2563eb", "#7c3aed", "#dc2626", "#059669", "#d97706"].map((color) => (
                    <button
                      key={color}
                      onClick={() => setThemeColor(color)}
                      className={`w-8 h-8 rounded border-2 ${
                        themeColor === color ? "border-gray-900" : "border-gray-300"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Logout Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Account</h2>
              <p className="text-gray-600 text-sm">Manage your account session</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 transition-colors"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
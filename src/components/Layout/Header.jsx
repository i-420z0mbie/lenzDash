// src/components/Layout/Header.jsx
import React, { useState } from 'react';
import { 
  Bars3Icon, 
  BellIcon, 
  ArrowRightOnRectangleIcon,
  XMarkIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api';

const Header = ({ setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const [isNotificationModalOpen, setNotificationModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: ''
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNotificationForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await api.post('/main/notifications/', notificationForm);
      setSuccessMessage('Notification sent successfully!');
      setNotificationForm({ title: '', message: '' });
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      let errorMsg = 'Failed to send notification. Please try again.';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMsg = error.response.data;
        } else if (error.response.data.detail) {
          errorMsg = error.response.data.detail;
        } else if (error.response.data.message) {
          errorMsg = error.response.data.message;
        } else if (typeof error.response.data === 'object') {
          const fieldErrors = Object.entries(error.response.data)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('; ');
          errorMsg = fieldErrors || errorMsg;
        }
      }
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setNotificationForm({ title: '', message: '' });
    setErrorMessage('');
    setSuccessMessage('');
    setNotificationModalOpen(false);
  };

  return (
    <>
      {/* Modern Header with glass effect */}
      <header className="sticky top-0 z-30 flex-shrink-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm shadow-primary-50/20 flex items-center justify-between px-4 lg:px-6 transition-all duration-200">
        {/* Mobile menu button - elegant ring effect */}
        <button
          className="lg:hidden p-2 -ml-2 rounded-xl text-primary-600 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200"
          onClick={() => setSidebarOpen(true)}
        >
          <Bars3Icon className="h-5 w-5" />
        </button>

        {/* Right section - notifications & user */}
        <div className="flex-1 flex justify-end items-center gap-3 lg:gap-4">
          {/* Notifications Button with subtle glow */}
          <button 
            onClick={() => setNotificationModalOpen(true)}
            className="relative p-2 rounded-full text-gray-500 hover:text-primary-600 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 group"
          >
            <BellIcon className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full ring-2 ring-white group-hover:ring-primary-50"></span>
          </button>

          {/* User profile card with gradient border */}
          <div className="flex items-center gap-3 pl-2 border-l border-gray-100">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 blur-sm opacity-60"></div>
                <div className="relative w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-semibold">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-800 leading-tight">{user?.username}</p>
                <p className="text-xs font-medium text-primary-600 capitalize">{user?.role}</p>
              </div>
            </div>

            {/* Logout button - gradient outline style */}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200/50 shadow-sm transition-all duration-200 hover:shadow hover:-translate-y-0.5"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Modern Notification Modal - Glass morphism + animations */}
      {isNotificationModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 animate-fade-in">
          {/* Backdrop with blur */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300" 
            onClick={resetForm}
          />
          
          {/* Modal panel */}
          <div className="relative w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl shadow-primary-500/20 border border-white/20 animate-slide-up overflow-hidden">
            {/* Decorative gradient top bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600"></div>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-primary-50">
                  <PaperAirplaneIcon className="h-4 w-4 text-primary-600" />
                </div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-primary-700 to-primary-800 bg-clip-text text-transparent">
                  Send Notification
                </h3>
              </div>
              <button
                onClick={resetForm}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Success/Error Messages with icons */}
            {successMessage && (
              <div className="mx-5 mt-4 p-3 bg-emerald-50/80 backdrop-blur-sm border border-emerald-200 rounded-xl animate-slide-up">
                <p className="text-emerald-800 text-sm font-medium flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  {successMessage}
                </p>
              </div>
            )}
            
            {errorMessage && (
              <div className="mx-5 mt-4 p-3 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl animate-slide-up">
                <p className="text-red-800 text-sm font-medium flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                  {errorMessage}
                </p>
              </div>
            )}

            {/* Modal Body */}
            <form onSubmit={handleSendNotification} className="p-5 space-y-5">
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Title <span className="text-primary-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={notificationForm.title}
                  onChange={handleInputChange}
                  required
                  minLength={1}
                  maxLength={200}
                  className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all duration-200 outline-none"
                  placeholder="e.g., Fee Reminder"
                />
                <p className="text-xs text-gray-400 mt-1.5 flex justify-between">
                  <span>Notification title</span>
                  <span className="font-mono">{notificationForm.title.length}/200</span>
                </p>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Message <span className="text-primary-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={notificationForm.message}
                  onChange={handleInputChange}
                  required
                  minLength={1}
                  rows={4}
                  className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all duration-200 outline-none resize-none"
                  placeholder="Write your message here..."
                />
              </div>

              {/* Modal Footer with modern buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100/80 rounded-xl hover:bg-gray-200/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !notificationForm.title.trim() || !notificationForm.message.trim()}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl shadow-md shadow-primary-500/25 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="h-4 w-4" />
                      Send Notification
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
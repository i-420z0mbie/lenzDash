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
  const [notificationForm, setNotificationForm] = useState({ title: '', message: '' });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNotificationForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await api.post('/main/notifications/', notificationForm);
      setSuccessMessage('Notification sent successfully!');
      setNotificationForm({ title: '', message: '' });
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      let errorMsg = 'Failed to send notification.';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') errorMsg = error.response.data;
        else if (error.response.data.detail) errorMsg = error.response.data.detail;
        else if (error.response.data.message) errorMsg = error.response.data.message;
        else if (typeof error.response.data === 'object') {
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
      <header className="sticky top-0 z-30 flex-shrink-0 h-14 bg-white/70 backdrop-blur-md border-b border-white/30 shadow-lg flex items-center justify-between px-4 lg:px-5 transition-all duration-200">
        <button
          className="lg:hidden p-1.5 -ml-2 rounded-xl text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
          onClick={() => setSidebarOpen(true)}
        >
          <Bars3Icon className="h-5 w-5" />
        </button>

        <div className="flex-1 flex justify-end items-center gap-2 lg:gap-3">
          <button 
            onClick={() => setNotificationModalOpen(true)}
            className="relative p-1.5 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200 group"
          >
            <BellIcon className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-indigo-500 rounded-full ring-1 ring-white animate-pulse"></span>
          </button>

          <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600 blur-sm opacity-60"></div>
                <div className="relative w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-xs font-semibold">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-gray-800 leading-tight">{user?.username}</p>
                <p className="text-[10px] font-medium text-indigo-600 capitalize">{user?.role}</p>
              </div>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/50 shadow-sm transition-all duration-200 hover:shadow hover:-translate-y-0.5"
            >
              <ArrowRightOnRectangleIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {isNotificationModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={resetForm} />
          <div className="relative w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl shadow-indigo-500/20 border border-white/20 animate-slideUp overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400 via-indigo-500 to-indigo-600"></div>
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-xl bg-indigo-50">
                  <PaperAirplaneIcon className="h-3.5 w-3.5 text-indigo-600" />
                </div>
                <h3 className="text-sm font-bold bg-gradient-to-r from-indigo-700 to-indigo-800 bg-clip-text text-transparent">
                  Send Notification
                </h3>
              </div>
              <button onClick={resetForm} className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            {successMessage && (
              <div className="mx-4 mt-3 p-2 bg-emerald-50/80 backdrop-blur-sm border border-emerald-200 rounded-xl">
                <p className="text-[11px] text-emerald-800 font-medium flex items-center gap-1.5">
                  <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
                  {successMessage}
                </p>
              </div>
            )}
            {errorMessage && (
              <div className="mx-4 mt-3 p-2 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl">
                <p className="text-[11px] text-red-800 font-medium flex items-center gap-1.5">
                  <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                  {errorMessage}
                </p>
              </div>
            )}

            <form onSubmit={handleSendNotification} className="p-4 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Title <span className="text-indigo-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={notificationForm.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 text-xs bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all outline-none"
                  placeholder="e.g., Fee Reminder"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Message <span className="text-indigo-500">*</span>
                </label>
                <textarea
                  name="message"
                  value={notificationForm.message}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-3 py-2 text-xs bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all outline-none resize-none"
                  placeholder="Write your message here..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={resetForm} className="px-3 py-1.5 text-[11px] font-medium text-gray-600 bg-gray-100/80 rounded-xl hover:bg-gray-200/80 transition">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !notificationForm.title.trim() || !notificationForm.message.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-semibold text-white bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl shadow-md shadow-indigo-500/25 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="h-3 w-3" />
                      Send
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
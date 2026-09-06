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
      <header className="sticky top-0 z-30 flex-shrink-0 h-14 bg-white border-b border-stone-200 flex items-center justify-between px-4 lg:px-5">
        <button
          className="lg:hidden p-1.5 -ml-2 text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors"
          onClick={() => setSidebarOpen(true)}
        >
          <Bars3Icon className="h-5 w-5" />
        </button>

        <div className="flex-1 flex justify-end items-center gap-3 lg:gap-4">
          <button
            onClick={() => setNotificationModalOpen(true)}
            className="relative p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors"
          >
            <BellIcon className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-emerald-700 rounded-full ring-1 ring-white" />
          </button>

          <div className="flex items-center gap-3 pl-3 border-l border-stone-200">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-900 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs ledger-mono">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="hidden sm:block leading-tight">
                <p className="text-xs text-stone-800">{user?.username}</p>
                <p className="text-[10px] text-stone-500 capitalize">{user?.role}</p>
              </div>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-stone-600 border border-stone-300 hover:bg-stone-50 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {isNotificationModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="absolute inset-0 bg-stone-900/30" onClick={resetForm} />
          <div className="relative w-full max-w-md bg-white border border-stone-200 shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200">
              <h3 className="ledger-display text-base text-stone-800">Send notification</h3>
              <button onClick={resetForm} className="text-stone-400 hover:text-stone-700">
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            {successMessage && (
              <div className="mx-4 mt-3 px-3 py-2 bg-emerald-50 border border-emerald-200">
                <p className="text-xs text-emerald-800">{successMessage}</p>
              </div>
            )}
            {errorMessage && (
              <div className="mx-4 mt-3 px-3 py-2 bg-rose-50 border border-rose-200">
                <p className="text-xs text-rose-700">{errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleSendNotification} className="p-4 space-y-3">
              <div>
                <label className="block text-xs text-stone-600 mb-1">
                  Title <span className="text-emerald-800">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={notificationForm.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-stone-300 focus:border-emerald-800 outline-none transition-colors"
                  placeholder="e.g., Fee Reminder"
                />
              </div>
              <div>
                <label className="block text-xs text-stone-600 mb-1">
                  Message <span className="text-emerald-800">*</span>
                </label>
                <textarea
                  name="message"
                  value={notificationForm.message}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-stone-300 focus:border-emerald-800 outline-none transition-colors resize-none"
                  placeholder="Write your message here..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-1.5 text-xs text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !notificationForm.title.trim() || !notificationForm.message.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs text-white bg-emerald-800 hover:bg-emerald-900 transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
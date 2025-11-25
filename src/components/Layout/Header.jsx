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

    console.log('Sending notification data:', notificationForm);

    try {
      // Changed from '/main/push_notification/' to '/main/notifications/'
      const response = await api.post('/main/notifications/', notificationForm);
      console.log('Notification sent successfully:', response.data);
      
      setSuccessMessage('Notification sent successfully!');
      setNotificationForm({
        title: '',
        message: ''
      });
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error sending notification:', error);
      console.error('Error response data:', error.response?.data);
      
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
    setNotificationForm({
      title: '',
      message: ''
    });
    setErrorMessage('');
    setSuccessMessage('');
    setNotificationModalOpen(false);
  };

  return (
    <>
      <header className="flex-shrink-0 relative h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
        {/* Mobile menu button */}
        <button
          className="px-4 border-r border-gray-200 text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Bars3Icon className="h-6 w-6" />
        </button>

        <div className="flex-1 flex justify-between lg:justify-end items-center">
          {/* Notifications Button */}
          <button 
            onClick={() => setNotificationModalOpen(true)}
            className="flex-shrink-0 p-1 rounded-full text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
          >
            <BellIcon className="h-6 w-6" />
          </button>

          {/* User info and logout */}
          <div className="ml-4 flex items-center lg:ml-6 space-x-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{user?.username}</p>
                <p className="text-xs font-medium text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={logout}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-all duration-200"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Notification Modal */}
      {isNotificationModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Send Notification
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Success/Error Messages */}
            {successMessage && (
              <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-800 text-sm">{successMessage}</p>
              </div>
            )}
            
            {errorMessage && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 text-sm font-medium">Error: {errorMessage}</p>
              </div>
            )}

            {/* Modal Body */}
            <form onSubmit={handleSendNotification} className="p-6 space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter notification title"
                />
                <p className="text-xs text-gray-500 mt-1">{notificationForm.title.length}/200 characters</p>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={notificationForm.message}
                  onChange={handleInputChange}
                  required
                  minLength={1}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter notification message"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !notificationForm.title.trim() || !notificationForm.message.trim()}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
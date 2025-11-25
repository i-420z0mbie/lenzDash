// src/components/Dashboard/RecentPayments.jsx
import React, { useState, useEffect } from 'react';
import api from '../../api';

const RecentPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRecentPayments();
  }, []);

  const fetchRecentPayments = async () => {
    try {
      setError('');
      // Use the EXACT endpoint from your urls.py
      const response = await api.get('/main/dashboard/recent-payments-grouped/');
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching recent payments:', error);
      setError('Failed to load recent payments');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'successful': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'successful': return 'Successful';
      case 'pending': return 'Pending';
      case 'failed': return 'Failed';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Payments</h3>
          <span className="text-sm text-gray-500">Last 10 students</span>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="flex items-center justify-between p-4 rounded-xl border border-gray-100">
              <div className="flex items-center space-x-4 flex-1">
                <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-16 animate-pulse ml-auto"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Payments</h3>
        </div>
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={fetchRecentPayments}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Payments</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Last 10 students</span>
          <button
            onClick={fetchRecentPayments}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        {payments.map((payment, index) => (
          <div key={`${payment.student_id}-${index}`} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors duration-200">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {payment.payment_count > 1 ? payment.payment_count : '1'}
                  </span>
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-900">{payment.student}</p>
                <p className="text-sm text-gray-500">
                  {payment.class} • {payment.fee_item}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="font-semibold text-gray-900">GH₵ {payment.total_amount?.toFixed(2)}</p>
              <div className="flex items-center justify-end space-x-2 mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                  {getStatusText(payment.status)}
                </span>
                <span className="text-sm text-gray-500">
                  {payment.latest_payment_date ? new Date(payment.latest_payment_date).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        ))}
        
        {payments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            No recent payments found
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentPayments;
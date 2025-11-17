// src/components/Dashboard/RecentPayments.jsx
import React from 'react';

const RecentPayments = ({ payments }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'successful': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Payments</h3>
        <span className="text-sm text-gray-500">Last 10 transactions</span>
      </div>
      
      <div className="space-y-4">
        {payments.map((payment, index) => (
          <div key={index} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors duration-200">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-blue-600 rounded-full"></div>
              </div>
              <div>
                <p className="font-medium text-gray-900">{payment.student}</p>
                <p className="text-sm text-gray-500">{payment.class} • {payment.fee_item}</p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="font-semibold text-gray-900">GH₵ {payment.amount}</p>
              <div className="flex items-center justify-end space-x-2 mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                  {payment.status}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(payment.date_paid).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
        
        {payments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No recent payments found
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentPayments;
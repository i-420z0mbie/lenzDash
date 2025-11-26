import React, { useState, useEffect } from 'react';
import api from '../api';
import PaymentList from '../components/payments/PaymentList';
import PaymentForm from '../components/payments/PaymentForm';
import PaymentStats from '../components/payments/PaymentStats';
import PaymentFilters from '../components/payments/PaymentFilters';

const PaymentManagement = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    status: '',
    student: '',
    date_from: '',
    date_to: '',
    page: 1,
    page_size: 20
  });

  // Fetch payments with current filters
  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      // Add all filters to params
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const response = await api.get(`/main/payments/?${params}`);
      setPayments(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError('Failed to load payments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch payment statistics
  const fetchPaymentStats = async () => {
    try {
      const response = await api.get('/main/payments/stats/');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching payment stats:', error);
      // Set default stats if API fails
      setStats({
        total_collected: 0,
        pending_count: 0,
        successful_count: 0,
        failed_count: 0,
        refunded_count: 0
      });
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchPaymentStats();
  }, [filters]);

  // Handle manual payment creation
  const handleCreateManualPayment = async (paymentData) => {
    try {
      const response = await api.post('/main/payments/manual/', paymentData);
      setPayments(prev => [response.data, ...prev]);
      setShowPaymentForm(false);
      fetchPaymentStats(); // Refresh stats
      fetchPayments(); // Refresh payments list
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error creating manual payment:', error);
      return { 
        success: false, 
        error: error.response?.data || { detail: 'Failed to create payment' } 
      };
    }
  };

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // Export payments
  const handleExportPayments = async () => {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });
      
      const response = await api.get(`/main/payments/export/?${params}`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payments-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting payments:', error);
      setError('Failed to export payments.');
    }
  };

  if (loading && payments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-600 mt-1">
            Manage and track all payment transactions
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowPaymentForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Payment Statistics */}
      <PaymentStats stats={stats} />

      {/* Filters */}
      <PaymentFilters 
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={() => setFilters({
          status: '',
          student: '',
          date_from: '',
          date_to: '',
          page: 1,
          page_size: 20
        })}
      />

      {/* Payment List */}
      <PaymentList
        payments={payments}
        loading={loading}
        onRefresh={fetchPayments}
      />

      {/* Pagination */}
      {payments.length > 0 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => handlePageChange(filters.page - 1)}
            disabled={filters.page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-gray-600">Page {filters.page}</span>
          <button
            onClick={() => handlePageChange(filters.page + 1)}
            disabled={payments.length < filters.page_size}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <PaymentForm
          onClose={() => setShowPaymentForm(false)}
          onSubmit={handleCreateManualPayment}
        />
      )}
    </div>
  );
};

export default PaymentManagement;
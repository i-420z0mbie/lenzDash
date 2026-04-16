import React, { useState, useEffect } from 'react';
import api from '../api';
import PaymentList from '../components/payments/PaymentList';
import PaymentForm from '../components/payments/PaymentForm';
import PaymentStats from '../components/payments/PaymentStats';
import PaymentFilters from '../components/payments/PaymentFilters';

const PaymentManagement = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  // Stats will be computed locally – initialised with zeros
  const [stats, setStats] = useState({
    total_collected: 0,
    pending_count: 0,
    successful_count: 0,
    failed_count: 0,
    refunded_count: 0
  });
  const [schoolStudentFullNames, setSchoolStudentFullNames] = useState(new Set());
  const [filters, setFilters] = useState({
    status: '',
    student: '',
    date_from: '',
    date_to: '',
    page: 1,
    page_size: 20
  });

  // Fetch the list of students for this school (already filtered by backend)
  const fetchSchoolStudents = async () => {
    try {
      const response = await api.get('/main/students/');
      const nameSet = new Set(
        response.data.map(s => `${s.first_name} ${s.last_name}`.toLowerCase())
      );
      setSchoolStudentFullNames(nameSet);
      return nameSet;
    } catch (err) {
      console.error('Failed to fetch school students:', err);
      setError('Unable to load student list.');
      return new Set();
    }
  };

  // Fetch all payments then filter by student names
  const fetchPayments = async () => {
    try {
      setLoading(true);
      // Ensure we have student names
      let nameSet = schoolStudentFullNames;
      if (nameSet.size === 0) {
        nameSet = await fetchSchoolStudents();
      }
      if (nameSet.size === 0) {
        setPayments([]);
        setFilteredPayments([]);
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] && key !== 'student') {
          params.append(key, filters[key]);
        }
      });
      if (filters.student) {
        params.append('student', filters.student);
      }

      const response = await api.get(`/main/payments/?${params}`);
      const allPayments = response.data.results || response.data;

      // Filter payments to only those whose student name matches a school student
      const schoolPayments = allPayments.filter(p => {
        const fullName = `${p.student_name} ${p.student_name2}`.toLowerCase();
        return nameSet.has(fullName);
      });
      setPayments(schoolPayments);
      setFilteredPayments(schoolPayments);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError('Failed to load payments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Compute stats from the school‑filtered payments array
  const computeStatsFromPayments = (paymentsArray) => {
    const totalCollected = paymentsArray
      .filter(p => p.status === 'successful')
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const pendingCount = paymentsArray.filter(p => p.status === 'pending').length;
    const successfulCount = paymentsArray.filter(p => p.status === 'successful').length;
    const failedCount = paymentsArray.filter(p => p.status === 'failed').length;
    const refundedCount = paymentsArray.filter(p => p.status === 'refunded').length;

    setStats({
      total_collected: totalCollected,
      pending_count: pendingCount,
      successful_count: successfulCount,
      failed_count: failedCount,
      refunded_count: refundedCount
    });
  };

  // Initial load: fetch students, then payments (stats will update automatically)
  useEffect(() => {
    const init = async () => {
      await fetchSchoolStudents();
      await fetchPayments();
      // No separate fetchPaymentStats call – stats are computed from payments
    };
    init();
  }, []);

  // Whenever the school‑filtered payments change, recompute stats
  useEffect(() => {
    computeStatsFromPayments(payments);
  }, [payments]);

  // Refetch payments when date/status filters change (but keep student search client‑side)
  useEffect(() => {
    if (schoolStudentFullNames.size > 0) {
      fetchPayments();
    }
  }, [filters.status, filters.date_from, filters.date_to]);

  // Client‑side student name search
  useEffect(() => {
    if (!payments.length) return;
    if (!filters.student) {
      setFilteredPayments(payments);
      return;
    }
    const searchLower = filters.student.toLowerCase();
    const filtered = payments.filter(p =>
      `${p.student_name} ${p.student_name2}`.toLowerCase().includes(searchLower)
    );
    setFilteredPayments(filtered);
  }, [filters.student, payments]);

  const handleCreateManualPayment = async (paymentData) => {
    try {
      const response = await api.post('/main/payments/manual/', paymentData);
      setShowPaymentForm(false);
      // Refresh data – stats will be updated automatically via useEffect
      await fetchSchoolStudents();
      await fetchPayments();
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error creating manual payment:', error);
      return {
        success: false,
        error: error.response?.data || { detail: 'Failed to create payment' }
      };
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const pageSize = filters.page_size;
  const start = (filters.page - 1) * pageSize;
  const paginatedPayments = filteredPayments.slice(start, start + pageSize);

  if (loading && schoolStudentFullNames.size === 0) {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-600 mt-1">Manage and track all payment transactions for your school</p>
        </div>
        <button
          onClick={() => setShowPaymentForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Record Payment</span>
        </button>
      </div>

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

      {/* Stats now show only the school’s data */}
      <PaymentStats stats={stats} />

      <PaymentFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={() => setFilters({
          status: '', student: '', date_from: '', date_to: '', page: 1, page_size: 20
        })}
      />

      <PaymentList payments={paginatedPayments} loading={loading} onRefresh={fetchPayments} />

      {filteredPayments.length > 0 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => handlePageChange(filters.page - 1)}
            disabled={filters.page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-gray-600">
            Page {filters.page} of {Math.ceil(filteredPayments.length / pageSize)}
          </span>
          <button
            onClick={() => handlePageChange(filters.page + 1)}
            disabled={start + pageSize >= filteredPayments.length}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

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
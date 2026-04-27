// src/pages/PaymentManagement.jsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import api from '../api';

// ====================== PaymentManagement (Main) ======================
const PaymentManagement = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
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
  const isInitialMount = useRef(true);

  // Fetch all students of this school (once)
  const fetchSchoolStudents = useCallback(async () => {
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
  }, []);

  // Fetch payments based on server-side filters
  const fetchPayments = useCallback(async (nameSetOverride) => {
    try {
      setLoading(true);
      let nameSet = schoolStudentFullNames;
      if (nameSet.size === 0 && nameSetOverride) {
        nameSet = nameSetOverride;
      } else if (nameSet.size === 0) {
        nameSet = await fetchSchoolStudents();
      }
      if (nameSet.size === 0) {
        setPayments([]);
        setFilteredPayments([]);
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);

      const response = await api.get(`/main/payments/?${params}`);
      const allPayments = response.data.results || response.data;
      const schoolPayments = allPayments.filter(p => {
        const fullName = `${p.student_name} ${p.student_name2}`.toLowerCase();
        return nameSet.has(fullName);
      });
      setPayments(schoolPayments);
      applyStudentFilter(schoolPayments, filters.student);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError('Failed to load payments. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.date_from, filters.date_to, schoolStudentFullNames, fetchSchoolStudents]);

  const applyStudentFilter = (paymentsArray, studentQuery) => {
    if (!studentQuery) {
      setFilteredPayments(paymentsArray);
    } else {
      const lowerQuery = studentQuery.toLowerCase();
      const filtered = paymentsArray.filter(p =>
        `${p.student_name} ${p.student_name2}`.toLowerCase().includes(lowerQuery)
      );
      setFilteredPayments(filtered);
    }
  };

  // Compute stats
  useEffect(() => {
    const totalCollected = payments
      .filter(p => p.status === 'successful')
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const pendingCount = payments.filter(p => p.status === 'pending').length;
    const successfulCount = payments.filter(p => p.status === 'successful').length;
    const failedCount = payments.filter(p => p.status === 'failed').length;
    const refundedCount = payments.filter(p => p.status === 'refunded').length;

    setStats({
      total_collected: totalCollected,
      pending_count: pendingCount,
      successful_count: successfulCount,
      failed_count: failedCount,
      refunded_count: refundedCount
    });
  }, [payments]);

  // Initial load (once)
  useEffect(() => {
    const init = async () => {
      const nameSet = await fetchSchoolStudents();
      await fetchPayments(nameSet);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when server-side filters change (skip first mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    fetchPayments();
  }, [filters.status, filters.date_from, filters.date_to, fetchPayments]);

  // Client-side student filter
  useEffect(() => {
    applyStudentFilter(payments, filters.student);
  }, [filters.student, payments]);

  const handleCreateManualPayment = async (paymentData) => {
    try {
      const response = await api.post('/main/payments/manual/', paymentData);
      setShowPaymentForm(false);
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

  if (loading && schoolStudentFullNames.size === 0 && payments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 animate-pulse">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-xxs text-slate-400">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 md:p-5 max-w-[1600px] mx-auto animate-fadeInUp">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-white/70 backdrop-blur-sm border border-white/30 shadow-lg p-4">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-indigo-100/40 to-transparent rounded-full blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              💰 Payment Management
            </h1>
            <p className="text-xxs text-slate-500 mt-0.5">
              Manage and track all payment transactions for your school
            </p>
          </div>
          <button
            onClick={() => setShowPaymentForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xxs font-medium bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg shadow hover:shadow-md transition-all hover:scale-[1.02]"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 animate-fadeIn">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-rose-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xxs text-rose-800">{error}</span>
          </div>
        </div>
      )}

      <PaymentStats stats={stats} />
      <PaymentFilters filters={filters} onFilterChange={handleFilterChange} onClearFilters={() => setFilters({ status: '', student: '', date_from: '', date_to: '', page: 1, page_size: 20 })} />
      <PaymentList payments={paginatedPayments} loading={loading} onRefresh={fetchPayments} />

      {filteredPayments.length > 0 && (
        <div className="flex items-center justify-between pt-2">
          <button onClick={() => handlePageChange(filters.page - 1)} disabled={filters.page === 1} className="px-3 py-1.5 text-xxs border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition">Previous</button>
          <span className="text-xxs text-slate-500">Page {filters.page} of {Math.ceil(filteredPayments.length / pageSize)}</span>
          <button onClick={() => handlePageChange(filters.page + 1)} disabled={start + pageSize >= filteredPayments.length} className="px-3 py-1.5 text-xxs border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition">Next</button>
        </div>
      )}

      {showPaymentForm && <PaymentForm onClose={() => setShowPaymentForm(false)} onSubmit={handleCreateManualPayment} />}
    </div>
  );
};

const PaymentStats = ({ stats }) => {
  const statCards = [
    { title: 'Total Collected', value: `GH₵${(stats.total_collected || 0).toLocaleString()}`, color: 'bg-emerald-50 text-emerald-700', icon: '💰' },
    { title: 'Pending', value: stats.pending_count || 0, color: 'bg-amber-50 text-amber-700', icon: '⏳' },
    { title: 'Successful', value: stats.successful_count || 0, color: 'bg-blue-50 text-blue-700', icon: '✅' },
    { title: 'Failed', value: stats.failed_count || 0, color: 'bg-rose-50 text-rose-700', icon: '❌' },
    { title: 'Refunded', value: stats.refunded_count || 0, color: 'bg-purple-50 text-purple-700', icon: '↩️' }
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {statCards.map((stat, idx) => (
        <div key={idx} className={`${stat.color} border border-white/30 rounded-xl p-3 shadow-sm transition-all hover:shadow animate-fadeIn`} style={{ animationDelay: `${idx * 50}ms` }}>
          <div className="flex items-center justify-between">
            <p className="text-xxs font-medium opacity-80">{stat.title}</p>
            <span className="text-base">{stat.icon}</span>
          </div>
          <p className="text-sm font-bold mt-1">{stat.value}</p>
        </div>
      ))}
    </div>
  );
};

const PaymentFilters = ({ filters, onFilterChange, onClearFilters }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const handleApplyFilters = () => onFilterChange(localFilters);
  const handleChange = (key, value) => setLocalFilters(prev => ({ ...prev, [key]: value }));
  return (
    <div className="bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl p-4 shadow-sm transition-all">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-xxs font-medium text-slate-600 mb-1">Status</label>
          <select value={localFilters.status} onChange={(e) => handleChange('status', e.target.value)} className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xxs focus:ring-1 focus:ring-indigo-400">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="successful">Successful</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
        <div>
          <label className="block text-xxs font-medium text-slate-600 mb-1">Student</label>
          <input type="text" value={localFilters.student} onChange={(e) => handleChange('student', e.target.value)} placeholder="Search student..." className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xxs focus:ring-1 focus:ring-indigo-400" />
        </div>
        <div>
          <label className="block text-xxs font-medium text-slate-600 mb-1">From Date</label>
          <input type="date" value={localFilters.date_from} onChange={(e) => handleChange('date_from', e.target.value)} className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xxs focus:ring-1 focus:ring-indigo-400" />
        </div>
        <div>
          <label className="block text-xxs font-medium text-slate-600 mb-1">To Date</label>
          <input type="date" value={localFilters.date_to} onChange={(e) => handleChange('date_to', e.target.value)} className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xxs focus:ring-1 focus:ring-indigo-400" />
        </div>
      </div>
      <div className="flex justify-end space-x-2 mt-3">
        <button onClick={onClearFilters} className="px-3 py-1.5 text-xxs border border-slate-200 rounded-lg hover:bg-slate-50 transition">Clear</button>
        <button onClick={handleApplyFilters} className="px-3 py-1.5 text-xxs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">Apply Filters</button>
      </div>
    </div>
  );
};

const PaymentList = ({ payments, loading, onRefresh }) => {
  const getStatusBadge = (status) => {
    const config = { pending: 'bg-amber-100 text-amber-800', successful: 'bg-emerald-100 text-emerald-800', failed: 'bg-rose-100 text-rose-800', refunded: 'bg-slate-100 text-slate-800' };
    return <span className={`px-1.5 py-0.5 rounded-full text-xxs font-medium ${config[status] || config.pending}`}>{status}</span>;
  };
  const getVerificationBadge = (isVerified) => (
    <span className={`px-1.5 py-0.5 rounded-full text-xxs font-medium ${isVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}`}>
      {isVerified ? 'Verified' : 'Unverified'}
    </span>
  );

  if (payments.length === 0 && !loading) {
    return (
      <div className="bg-white/70 rounded-xl p-8 text-center border border-white/30">
        <svg className="w-10 h-10 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-xs font-medium text-slate-800 mb-1">No Payments Found</h3>
        <p className="text-xxs text-slate-500">No payment records match your current filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-100 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between p-3 border-b border-slate-100">
        <h3 className="text-xs font-semibold text-slate-700">Payment Records ({payments.length})</h3>
        <button onClick={onRefresh} className="flex items-center gap-1 text-xxs text-slate-500 hover:text-slate-700 transition">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          <span>Refresh</span>
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xxs">
          <thead className="bg-slate-50/80 text-slate-500">
            <tr><th className="px-3 py-2 text-left">Reference</th><th className="px-3 py-2 text-left">Student</th><th className="px-3 py-2 text-left">Amount</th><th className="px-3 py-2 text-left">Status</th><th className="px-3 py-2 text-left">Verified</th><th className="px-3 py-2 text-left">Date Paid</th><th className="px-3 py-2 text-left">Receipts</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payments.map((payment, idx) => (
              <tr key={payment.id} className="hover:bg-slate-50/50 transition-all animate-fadeIn" style={{ animationDelay: `${idx * 30}ms` }}>
                <td className="px-3 py-2 font-mono text-xxs">{payment.payment_reference}</td>
                <td className="px-3 py-2"><div className="font-medium text-slate-800">{payment.student_name2}, {payment.student_name}</div>{payment.fee_item_name && <div className="text-xxs text-slate-400">{payment.fee_item_name}</div>}</td>
                <td className="px-3 py-2 font-medium">GH₵{parseFloat(payment.amount).toLocaleString()}</td>
                <td className="px-3 py-2">{getStatusBadge(payment.status)}</td>
                <td className="px-3 py-2">{getVerificationBadge(payment.is_verified)}</td>
                <td className="px-3 py-2 text-slate-500">{new Date(payment.date_paid).toLocaleDateString()}</td>
                <td className="px-3 py-2"><ReceiptActions payment={payment} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {loading && <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div></div>}
    </div>
  );
};

// ====================== BULLETPROOF RECEIPT ACTIONS ======================
const ReceiptActions = ({ payment }) => {
  const [loading, setLoading] = useState(false);
  const [receipts, setReceipts] = useState(null); // null = not loaded, [] = empty
  const [showMenu, setShowMenu] = useState(false);

  const fetchReceipts = async () => {
    // Toggle if already loaded
    if (receipts !== null) {
      setShowMenu(prev => !prev);
      return;
    }

    setLoading(true);
    try {
      console.log(`Fetching receipts for payment: ${payment.payment_reference}`);
      const res = await api.get(`/main/receipt/by-payment/${payment.payment_reference}/`);
      console.log('API response:', res.data);

      // Extract array – handle both {results: [...]} and direct array
      let receiptsData = [];
      if (Array.isArray(res.data)) {
        receiptsData = res.data;
      } else if (res.data?.results && Array.isArray(res.data.results)) {
        receiptsData = res.data.results;
      } else {
        receiptsData = [];
      }
      setReceipts(receiptsData);
      setShowMenu(true);
    } catch (err) {
      console.error('Failed to fetch receipts:', err);
      setReceipts([]); // show "No receipts"
      setShowMenu(true);
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = (receipt) => {
    const url = receipt.pdf_url || `/api/receipt/${receipt.id}/download/`;
    window.open(url, '_blank');
    setShowMenu(false);
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={fetchReceipts}
        className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 focus:outline-none"
        disabled={loading}
        title="View receipts"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
        </svg>
        {loading && <div className="w-2.5 h-2.5 border border-indigo-600 border-t-transparent rounded-full animate-spin"></div>}
      </button>

      {showMenu && receipts !== null && (
        <div className="absolute left-0 mt-2 w-40 bg-white rounded-md shadow-lg border border-slate-200 z-50">
          <div className="py-1">
            {receipts.length === 0 ? (
              <div className="px-3 py-1.5 text-xxs text-slate-500">No receipts</div>
            ) : (
              receipts.map(rec => (
                <button
                  key={rec.id}
                  onClick={() => downloadReceipt(rec)}
                  className="block w-full text-left px-3 py-1.5 text-xxs text-slate-700 hover:bg-slate-50"
                >
                  {rec.receipt_type === 'student' ? '📄 Student Copy' : '🏫 School Copy'}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ====================== PaymentForm (unchanged, works) ======================
const PaymentForm = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({ school_class: '', student: '', student_fee: '', amount: '' });
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentFees, setStudentFees] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingFees, setLoadingFees] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentStep, setPaymentStep] = useState('form');

  useEffect(() => {
    const fetchClasses = async () => {
      setLoadingClasses(true);
      try {
        const res = await api.get('/main/school_class/');
        setClasses(res.data || []);
      } catch (err) { setError('Failed to load classes.'); } finally { setLoadingClasses(false); }
    };
    fetchClasses();
  }, []);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!formData.school_class) { setStudents([]); return; }
      setLoadingStudents(true);
      try {
        const res = await api.get(`/main/students-by-class/${formData.school_class}/`);
        setStudents(res.data.students || []);
      } catch (err) { setStudents([]); setError('Failed to load students for this class.'); } finally { setLoadingStudents(false); }
    };
    fetchStudents();
  }, [formData.school_class]);

  useEffect(() => {
    const fetchFees = async () => {
      if (!formData.student) { setStudentFees([]); return; }
      setLoadingFees(true);
      try {
        const res = await api.get(`/main/student_fee/?student=${formData.student}&balance__gt=0`);
        setStudentFees(res.data || []);
      } catch (err) { setStudentFees([]); } finally { setLoadingFees(false); }
    };
    fetchFees();
  }, [formData.student]);

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return students;
    return students.filter(s => `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
      String(s.admission_number || s.student_id).toLowerCase().includes(q));
  }, [students, studentSearch]);

  const selectedStudent = students.find(s => s.id === parseInt(formData.student));
  const selectedFee = studentFees.find(f => f.id === parseInt(formData.student_fee));

  const resetStudentFields = () => {
    setFormData(prev => ({ ...prev, student: '', student_fee: '', amount: '' }));
    setStudentSearch('');
    setStudentFees([]);
  };

  const handleClassChange = (e) => {
    setFormData(prev => ({ ...prev, school_class: e.target.value }));
    resetStudentFields();
    setShowStudentDropdown(false);
  };

  const selectStudent = (student) => {
    setFormData(prev => ({ ...prev, student: student.id, student_fee: '', amount: '' }));
    setStudentSearch(`${student.first_name} ${student.last_name}`);
    setShowStudentDropdown(false);
  };

  const handleAmountAutoFill = (feeId) => {
    const fee = studentFees.find(f => f.id === parseInt(feeId));
    if (fee && fee.balance > 0) setFormData(prev => ({ ...prev, amount: fee.balance }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'student_fee') handleAmountAutoFill(value);
  };

  useEffect(() => {
    if (formData.student_fee) handleAmountAutoFill(formData.student_fee);
  }, [formData.student_fee, studentFees]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (!formData.school_class) setError('Please select a class.');
    else if (!formData.student) setError('Please select a student.');
    else if (!formData.student_fee) setError('Please select a fee item.');
    else if (parseFloat(formData.amount) <= 0) setError('Amount must be greater than 0.');
    else {
      const result = await onSubmit({
        student: parseInt(formData.student),
        student_fee: parseInt(formData.student_fee),
        amount: formData.amount
      });
      if (result.success) setPaymentStep('success');
      else setError(result.error?.detail || result.error?.message || 'Failed to create payment');
    }
    setLoading(false);
  };

  if (paymentStep === 'success') {
    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
        <div className="bg-white rounded-xl max-w-sm w-full p-5 text-center shadow-2xl animate-scaleUp">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3"><svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div>
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Payment Recorded!</h3>
          <p className="text-xxs text-slate-500 mb-4">The manual payment has been applied.</p>
          <button onClick={onClose} className="w-full bg-indigo-600 text-white py-1.5 text-xs rounded-lg hover:bg-indigo-700 transition">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800">Record Manual Payment</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {error && <div className="bg-rose-50 p-2 rounded-lg text-xxs text-rose-700">{error}</div>}
          <div>
            <label className="block text-xxs font-medium text-slate-600 mb-1">Class *</label>
            <select name="school_class" value={formData.school_class} onChange={handleClassChange} required className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xxs" disabled={loadingClasses}>
              <option value="">{loadingClasses ? 'Loading...' : 'Select Class'}</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {formData.school_class && (
            <div className="relative">
              <label className="block text-xxs font-medium text-slate-600 mb-1">Student *</label>
              <input type="text" value={studentSearch} onChange={e => { setStudentSearch(e.target.value); setShowStudentDropdown(true); }} onFocus={() => setShowStudentDropdown(true)} placeholder="Search by name or admission" className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xxs" disabled={loadingStudents} />
              {showStudentDropdown && (
                <div className="absolute z-20 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-56 overflow-y-auto">
                  {filteredStudents.length ? filteredStudents.map(s => (
                    <button key={s.id} type="button" onClick={() => selectStudent(s)} className="w-full text-left px-3 py-1.5 hover:bg-indigo-50 text-xxs border-b last:border-0">
                      <div className="font-medium">{s.first_name} {s.last_name}</div>
                      <div className="text-xxs text-slate-400">{s.admission_number || s.student_id}</div>
                    </button>
                  )) : <div className="px-3 py-2 text-xxs text-slate-500">No students found</div>}
                </div>
              )}
            </div>
          )}
          {selectedStudent && (
            <div className="bg-slate-50 rounded-lg p-2 text-xxs">
              <span className="font-medium">Class:</span> {selectedStudent.school_class?.name || 'N/A'} &nbsp;|&nbsp;
              <span className="font-medium">Admission:</span> {selectedStudent.admission_number || selectedStudent.student_id}
            </div>
          )}
          {formData.student && (
            <div>
              <label className="block text-xxs font-medium text-slate-600 mb-1">Fee Item *</label>
              <select name="student_fee" value={formData.student_fee} onChange={handleChange} required className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xxs" disabled={loadingFees}>
                <option value="">{loadingFees ? 'Loading fees...' : 'Select Fee Item'}</option>
                {studentFees.map(f => <option key={f.id} value={f.id}>{f.fee_item?.name} - Balance: GH₵{f.balance || 0}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xxs font-medium text-slate-600 mb-1">Amount *</label>
            <input type="number" name="amount" value={formData.amount} onChange={handleChange} required min="0" step="0.01" placeholder="0.00" className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xxs" />
            {selectedFee && <p className="text-xxs text-slate-400 mt-1">Suggested: GH₵{selectedFee.balance || 0}</p>}
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-1.5 text-xxs border rounded-lg hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-1.5 text-xxs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">{loading ? 'Recording...' : 'Record Payment'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Inject global animation styles (only once)
if (!document.getElementById('payment-animations')) {
  const style = document.createElement('style');
  style.id = 'payment-animations';
  style.textContent = `
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes scaleUp { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .animate-fadeInUp { animation: fadeInUp 0.3s ease-out forwards; }
    .animate-scaleUp { animation: scaleUp 0.2s ease-out forwards; }
    .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
    .text-xxs { font-size: 0.65rem; line-height: 1rem; }
  `;
  document.head.appendChild(style);
}

export default PaymentManagement;
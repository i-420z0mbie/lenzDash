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
  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / pageSize));

  if (loading && schoolStudentFullNames.size === 0 && payments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-stone-50">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-stone-300 border-t-emerald-800 rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-xs text-stone-400 ledger-mono">Opening the ledger…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-stone-50 ledger-root">
      <div className="max-w-[1400px] mx-auto px-5 md:px-8 py-8 space-y-6">

        {/* ---------- Statement header ---------- */}
        <div className="border-b border-stone-300 pb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="ledger-display text-3xl text-stone-900 tracking-tight">Payments</h1>
              <p className="text-sm text-stone-500 mt-1">Every fee received and pending for your school, in one register.</p>
            </div>
            <button
              onClick={() => setShowPaymentForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-stone-900 text-stone-50 rounded-sm hover:bg-emerald-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Record payment
            </button>
          </div>

          {error && (
            <div className="mt-4 border-l-2 border-red-800 bg-red-50 pl-3 pr-3 py-2">
              <p className="text-xs text-red-900">{error}</p>
            </div>
          )}

          {/* Big total + inline stat strip */}
          <div className="mt-6 flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
            <div>
              <p className="text-xs text-stone-500 uppercase-off">Total collected</p>
              <p className="ledger-display ledger-mono text-4xl md:text-5xl text-emerald-900 mt-1 tabular-nums">
                GH₵{(stats.total_collected || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <StatStrip stats={stats} />
          </div>
        </div>

        <PaymentFilters filters={filters} onFilterChange={handleFilterChange} onClearFilters={() => setFilters({ status: '', student: '', date_from: '', date_to: '', page: 1, page_size: 20 })} />
        <PaymentList payments={paginatedPayments} loading={loading} onRefresh={fetchPayments} />

        {filteredPayments.length > 0 && (
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => handlePageChange(filters.page - 1)}
              disabled={filters.page === 1}
              className="text-xs text-stone-600 hover:text-stone-900 disabled:opacity-30 disabled:hover:text-stone-600 transition-colors"
            >
              ← Previous
            </button>
            <span className="text-xs text-stone-400 ledger-mono">Page {filters.page} of {totalPages}</span>
            <button
              onClick={() => handlePageChange(filters.page + 1)}
              disabled={start + pageSize >= filteredPayments.length}
              className="text-xs text-stone-600 hover:text-stone-900 disabled:opacity-30 disabled:hover:text-stone-600 transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {showPaymentForm && <PaymentForm onClose={() => setShowPaymentForm(false)} onSubmit={handleCreateManualPayment} />}
    </div>
  );
};

// ====================== Stat strip (inline ledger stats, not cards) ======================
const StatStrip = ({ stats }) => {
  const items = [
    { label: 'Pending', value: stats.pending_count || 0, dot: 'bg-amber-600' },
    { label: 'Successful', value: stats.successful_count || 0, dot: 'bg-emerald-700' },
    { label: 'Failed', value: stats.failed_count || 0, dot: 'bg-red-800' },
    { label: 'Refunded', value: stats.refunded_count || 0, dot: 'bg-slate-500' },
  ];
  return (
    <div className="flex flex-wrap items-center divide-x divide-stone-300">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2 px-4 first:pl-0">
          <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`}></span>
          <span className="ledger-mono text-sm text-stone-800 tabular-nums">{item.value}</span>
          <span className="text-xs text-stone-500">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

// ====================== Filters (slim toolbar) ======================
const PaymentFilters = ({ filters, onFilterChange, onClearFilters }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const handleApplyFilters = () => onFilterChange(localFilters);
  const handleChange = (key, value) => setLocalFilters(prev => ({ ...prev, [key]: value }));
  const inputCls = "w-full bg-transparent border-b border-stone-300 focus:border-emerald-800 outline-none px-0.5 py-1.5 text-sm text-stone-800 placeholder-stone-400 transition-colors";
  return (
    <div className="border-b border-stone-200 pb-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        <div>
          <label className="block text-xs text-stone-500 mb-1">Status</label>
          <select value={localFilters.status} onChange={(e) => handleChange('status', e.target.value)} className={inputCls}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="successful">Successful</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-stone-500 mb-1">Student</label>
          <input type="text" value={localFilters.student} onChange={(e) => handleChange('student', e.target.value)} placeholder="Search by name" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-stone-500 mb-1">From</label>
          <input type="date" value={localFilters.date_from} onChange={(e) => handleChange('date_from', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-stone-500 mb-1">To</label>
          <input type="date" value={localFilters.date_to} onChange={(e) => handleChange('date_to', e.target.value)} className={inputCls} />
        </div>
        <div className="flex gap-4 justify-end sm:justify-start lg:justify-end pb-1.5">
          <button onClick={onClearFilters} className="text-xs text-stone-500 hover:text-stone-800 transition-colors">Clear</button>
          <button onClick={handleApplyFilters} className="text-xs font-medium text-emerald-900 hover:text-emerald-700 transition-colors">Apply filters</button>
        </div>
      </div>
    </div>
  );
};

// ====================== Payment list (ledger table) ======================
const PaymentList = ({ payments, loading, onRefresh }) => {
  const statusMeta = {
    pending: { label: 'Pending', dot: 'bg-amber-600', text: 'text-amber-800' },
    successful: { label: 'Successful', dot: 'bg-emerald-700', text: 'text-emerald-800' },
    failed: { label: 'Failed', dot: 'bg-red-800', text: 'text-red-800' },
    refunded: { label: 'Refunded', dot: 'bg-slate-500', text: 'text-slate-600' },
  };

  if (payments.length === 0 && !loading) {
    return (
      <div className="py-16 text-center border-t border-stone-200">
        <p className="ledger-display text-lg text-stone-700">No payments match this view</p>
        <p className="text-sm text-stone-500 mt-1">Adjust the filters above, or record a manual payment to get started.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs text-stone-500">{payments.length} record{payments.length === 1 ? '' : 's'} on this page</h3>
        <button onClick={onRefresh} className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Refresh
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-t border-stone-300">
          <thead>
            <tr className="text-xs text-stone-500 border-b border-stone-300">
              <th className="text-left font-normal py-2 pr-3">Reference</th>
              <th className="text-left font-normal py-2 pr-3">Student</th>
              <th className="text-right font-normal py-2 pr-3">Amount</th>
              <th className="text-left font-normal py-2 pr-3">Status</th>
              <th className="text-left font-normal py-2 pr-3">Verified</th>
              <th className="text-left font-normal py-2 pr-3">Date paid</th>
              <th className="text-left font-normal py-2">Receipts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-150" style={{ '--tw-divide-opacity': 1 }}>
            {payments.map((payment) => {
              const meta = statusMeta[payment.status] || statusMeta.pending;
              return (
                <tr key={payment.id} className="border-b border-stone-100 hover:bg-stone-100/60 transition-colors">
                  <td className="py-2.5 pr-3 ledger-mono text-xs text-stone-500">{payment.payment_reference}</td>
                  <td className="py-2.5 pr-3">
                    <div className="font-medium text-stone-800">{payment.student_name2}, {payment.student_name}</div>
                    {payment.fee_item_name && <div className="text-xs text-stone-400">{payment.fee_item_name}</div>}
                  </td>
                  <td className="py-2.5 pr-3 text-right ledger-mono tabular-nums text-stone-800">GH₵{parseFloat(payment.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-2.5 pr-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`}></span>
                      <span className={`text-xs ${meta.text}`}>{meta.label}</span>
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-xs">
                    {payment.is_verified
                      ? <span className="text-emerald-800">Verified</span>
                      : <span className="text-stone-400">Unverified</span>}
                  </td>
                  <td className="py-2.5 pr-3 text-xs text-stone-500">{new Date(payment.date_paid).toLocaleDateString()}</td>
                  <td className="py-2.5"><ReceiptActions payment={payment} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {loading && <div className="flex justify-center py-4"><div className="w-4 h-4 border-2 border-stone-300 border-t-emerald-800 rounded-full animate-spin"></div></div>}
    </div>
  );
};

// ====================== Receipt Actions ======================
const ReceiptActions = ({ payment }) => {
  const [loading, setLoading] = useState(false);
  const [receipts, setReceipts] = useState(null); // null = not loaded, [] = empty
  const [showMenu, setShowMenu] = useState(false);

  const fetchReceipts = async () => {
    if (receipts !== null) {
      setShowMenu(prev => !prev);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get(`/main/receipt/by-payment/${payment.payment_reference}/`);

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
      setReceipts([]);
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
        className="text-xs text-emerald-900 hover:text-emerald-700 flex items-center gap-1.5 focus:outline-none transition-colors"
        disabled={loading}
        title="View receipts"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
        </svg>
        Receipts
        {loading && <span className="w-2.5 h-2.5 border border-emerald-800 border-t-transparent rounded-full animate-spin"></span>}
      </button>

      {showMenu && receipts !== null && (
        <div className="absolute left-0 mt-2 w-44 bg-white border border-stone-200 shadow-lg z-50">
          <div className="py-1">
            {receipts.length === 0 ? (
              <div className="px-3 py-2 text-xs text-stone-500">No receipts on file</div>
            ) : (
              receipts.map(rec => (
                <button
                  key={rec.id}
                  onClick={() => downloadReceipt(rec)}
                  className="block w-full text-left px-3 py-2 text-xs text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  {rec.receipt_type === 'student' ? 'Student copy' : 'School copy'}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ====================== Payment Form ======================
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

    if (!formData.school_class) {
      setError('Please select a class.');
      setLoading(false);
      return;
    }
    if (!formData.student) {
      setError('Please select a student.');
      setLoading(false);
      return;
    }
    if (!formData.student_fee) {
      setError('Please select a fee item.');
      setLoading(false);
      return;
    }
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Amount must be greater than 0.');
      setLoading(false);
      return;
    }
    // Check against outstanding balance
    if (selectedFee && selectedFee.balance !== undefined) {
      if (amount > selectedFee.balance) {
        setError(`Amount cannot exceed outstanding balance of GH₵${selectedFee.balance.toFixed(2)}`);
        setLoading(false);
        return;
      }
    }

    const result = await onSubmit({
      student: parseInt(formData.student),
      student_fee: parseInt(formData.student_fee),
      amount: formData.amount
    });

    if (result.success) {
      setPaymentStep('success');
    } else {
      setError(result.error?.detail || result.error?.message || 'Failed to create payment');
    }
    setLoading(false);
  };

  const fieldCls = "w-full bg-transparent border-b border-stone-300 focus:border-emerald-800 outline-none px-0.5 py-2 text-sm text-stone-800 placeholder-stone-400 transition-colors disabled:opacity-50";

  if (paymentStep === 'success') {
    return (
      <div className="fixed inset-0 bg-stone-900/40 flex items-center justify-center p-4 z-50">
        <div className="bg-stone-50 max-w-sm w-full p-6 text-center border border-stone-200">
          <p className="ledger-display text-xl text-emerald-900">Payment recorded</p>
          <p className="text-sm text-stone-500 mt-2">The manual payment has been applied to the student's balance.</p>
          <button onClick={onClose} className="w-full mt-5 bg-stone-900 text-stone-50 py-2 text-sm hover:bg-emerald-900 transition-colors">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-stone-900/40 flex items-center justify-center p-4 z-50">
      <div className="bg-stone-50 max-w-md w-full max-h-[90vh] overflow-y-auto border border-stone-200">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-stone-200">
          <h2 className="ledger-display text-xl text-stone-900">Record manual payment</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="border-l-2 border-red-800 bg-red-50 pl-3 pr-3 py-2">
              <p className="text-xs text-red-900">{error}</p>
            </div>
          )}
          <div>
            <label className="block text-xs text-stone-500 mb-1">Class</label>
            <select name="school_class" value={formData.school_class} onChange={handleClassChange} required className={fieldCls} disabled={loadingClasses}>
              <option value="">{loadingClasses ? 'Loading…' : 'Select class'}</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {formData.school_class && (
            <div className="relative">
              <label className="block text-xs text-stone-500 mb-1">Student</label>
              <input type="text" value={studentSearch} onChange={e => { setStudentSearch(e.target.value); setShowStudentDropdown(true); }} onFocus={() => setShowStudentDropdown(true)} placeholder="Search by name or admission number" className={fieldCls} disabled={loadingStudents} />
              {showStudentDropdown && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-stone-200 shadow-lg max-h-56 overflow-y-auto">
                  {filteredStudents.length ? filteredStudents.map(s => (
                    <button key={s.id} type="button" onClick={() => selectStudent(s)} className="w-full text-left px-3 py-2 hover:bg-stone-50 text-sm border-b border-stone-100 last:border-0 transition-colors">
                      <div className="font-medium text-stone-800">{s.first_name} {s.last_name}</div>
                      <div className="text-xs text-stone-400">{s.admission_number || s.student_id}</div>
                    </button>
                  )) : <div className="px-3 py-2 text-xs text-stone-500">No students found</div>}
                </div>
              )}
            </div>
          )}
          {selectedStudent && (
            <div className="text-xs text-stone-500 border-l-2 border-stone-300 pl-3">
              <span className="text-stone-700 font-medium">{selectedStudent.school_class?.name || 'N/A'}</span>
              <span className="mx-1.5">·</span>
              Admission {selectedStudent.admission_number || selectedStudent.student_id}
            </div>
          )}
          {formData.student && (
            <div>
              <label className="block text-xs text-stone-500 mb-1">Fee item</label>
              <select name="student_fee" value={formData.student_fee} onChange={handleChange} required className={fieldCls} disabled={loadingFees}>
                <option value="">{loadingFees ? 'Loading fees…' : 'Select fee item'}</option>
                {studentFees.map(f => <option key={f.id} value={f.id}>{f.fee_item?.name} — balance GH₵{f.balance || 0}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs text-stone-500 mb-1">Amount</label>
            <input type="number" name="amount" value={formData.amount} onChange={handleChange} required min="0" step="0.01" placeholder="0.00" className={`${fieldCls} ledger-mono tabular-nums`} />
            {selectedFee && <p className="text-xs text-stone-400 mt-1">Outstanding balance: GH₵{selectedFee.balance || 0}</p>}
          </div>
          <div className="flex gap-3 pt-3">
            <button type="button" onClick={onClose} className="flex-1 py-2 text-sm border border-stone-300 text-stone-700 hover:bg-stone-100 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 text-sm bg-stone-900 text-stone-50 hover:bg-emerald-900 disabled:opacity-50 transition-colors">{loading ? 'Recording…' : 'Record payment'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Inject fonts + base ledger styling (only once)
if (!document.getElementById('payment-ledger-styles')) {
  const style = document.createElement('style');
  style.id = 'payment-ledger-styles';
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
    .ledger-root { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; animation: ledgerFadeIn 0.35s ease-out; }
    .ledger-display { font-family: 'Fraunces', serif; font-weight: 500; }
    .ledger-mono { font-family: 'IBM Plex Mono', ui-monospace, monospace; }
    .uppercase-off { text-transform: none; }
    @keyframes ledgerFadeIn { from { opacity: 0; } to { opacity: 1; } }
  `;
  document.head.appendChild(style);
}

export default PaymentManagement;
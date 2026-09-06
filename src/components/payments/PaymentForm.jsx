import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api';

const PaymentForm = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    school_class: '',
    student: '',
    student_fee: '',
    amount: ''
  });

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
      try {
        setLoadingClasses(true);
        const res = await api.get('/main/school_class/');
        setClasses(res.data || []);
      } catch (err) {
        console.error('Error fetching classes:', err);
        setError('Failed to load classes. Please refresh the page.');
      } finally {
        setLoadingClasses(false);
      }
    };

    fetchClasses();
  }, []);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!formData.school_class) {
        setStudents([]);
        return;
      }

      try {
        setLoadingStudents(true);
        const res = await api.get(`/main/students/?school_class=${formData.school_class}`);
        setStudents(res.data || []);
      } catch (err) {
        console.error('Error fetching students:', err);
        setStudents([]);
        setError('Failed to load students for this class.');
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchStudents();
  }, [formData.school_class]);

  useEffect(() => {
    const fetchStudentFees = async () => {
      if (!formData.student) {
        setStudentFees([]);
        return;
      }

      try {
        setLoadingFees(true);
        const res = await api.get(`/main/student_fee/?student=${formData.student}&balance__gt=0`);
        setStudentFees(res.data || []);
      } catch (err) {
        console.error('Error fetching student fees:', err);
        setStudentFees([]);
      } finally {
        setLoadingFees(false);
      }
    };

    fetchStudentFees();
  }, [formData.student]);

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return students;

    return students.filter((s) => {
      const fullName = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
      const admission = String(s.admission_number || s.student_id || '').toLowerCase();
      return (
        fullName.includes(q) ||
        admission.includes(q)
      );
    });
  }, [students, studentSearch]);

  const selectedStudent = students.find((s) => s.id === parseInt(formData.student));
  const selectedFee = studentFees.find((f) => f.id === parseInt(formData.student_fee));

  const resetStudentFields = () => {
    setFormData((prev) => ({
      ...prev,
      student: '',
      student_fee: '',
      amount: ''
    }));
    setStudentSearch('');
    setStudentFees([]);
  };

  const handleClassChange = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      school_class: value
    }));
    resetStudentFields();
    setShowStudentDropdown(false);
  };

  const selectStudent = (student) => {
    setFormData((prev) => ({
      ...prev,
      student: student.id,
      student_fee: '',
      amount: ''
    }));
    setStudentSearch(`${student.first_name || ''} ${student.last_name || ''}`.trim());
    setShowStudentDropdown(false);
  };

  const handleAmountAutoFill = (feeId) => {
    const selected = studentFees.find((fee) => fee.id === parseInt(feeId));
    if (selected && selected.balance > 0) {
      setFormData((prev) => ({
        ...prev,
        amount: selected.balance
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (name === 'student_fee') {
      handleAmountAutoFill(value);
    }
  };

  useEffect(() => {
    if (formData.student_fee) {
      handleAmountAutoFill(formData.student_fee);
    }
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

    if (parseFloat(formData.amount) <= 0) {
      setError('Amount must be greater than 0.');
      setLoading(false);
      return;
    }

    const submitData = {
      student: parseInt(formData.student),
      student_fee: parseInt(formData.student_fee),
      amount: formData.amount
    };

    try {
      const result = await onSubmit(submitData);
      if (result.success) {
        setPaymentStep('success');
      } else {
        setError(
          result.error?.detail ||
          result.error?.message ||
          'Failed to create payment'
        );
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (paymentStep === 'success') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Recorded Successfully!</h3>
            <p className="text-gray-600 mb-4">
              The manual payment has been recorded and applied to the student's account.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Record Manual Payment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

          {/* Class */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
            <select
              name="school_class"
              value={formData.school_class}
              onChange={handleClassChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              disabled={loadingClasses}
            >
              <option value="">
                {loadingClasses ? 'Loading classes...' : 'Select Class'}
              </option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Student Search + Dropdown */}
          {formData.school_class && (
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>

              <input
                type="text"
                value={studentSearch}
                onChange={(e) => {
                  setStudentSearch(e.target.value);
                  setShowStudentDropdown(true);
                }}
                onFocus={() => setShowStudentDropdown(true)}
                placeholder={loadingStudents ? 'Loading students...' : 'Search student by name or admission number'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                disabled={loadingStudents}
              />

              {showStudentDropdown && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => selectStudent(student)}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">
                          {student.first_name} {student.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {student.admission_number || student.student_id}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      No students found for this search.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Selected Student Info */}
          {selectedStudent && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Student Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-600">Class:</div>
                <div className="text-gray-900">{selectedStudent.school_class?.name || 'N/A'}</div>
                <div className="text-gray-600">Admission No:</div>
                <div className="text-gray-900">{selectedStudent.admission_number || selectedStudent.student_id}</div>
              </div>
            </div>
          )}

          {/* Fee Item */}
          {formData.student && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fee Item *</label>
              <select
                name="student_fee"
                value={formData.student_fee}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                disabled={loadingFees}
              >
                <option value="">
                  {loadingFees ? 'Loading fee items...' : 'Select Fee Item to Pay'}
                </option>
                {studentFees.length > 0 ? (
                  studentFees.map((fee) => (
                    <option key={fee.id} value={fee.id}>
                      {fee.fee_item?.name} - Balance: GH₵{fee.balance || 0}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    No unpaid fees found for this student
                  </option>
                )}
              </select>
              <p className="text-sm text-gray-500 mt-1">You must select a specific fee item.</p>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
            {selectedFee && (
              <p className="text-sm text-gray-500 mt-1">
                Suggested amount: GH₵{selectedFee.balance || 0} (remaining balance)
              </p>
            )}
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Recording Payment...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;
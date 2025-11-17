// src/components/payments/PaymentForm.jsx
import React, { useState, useEffect } from 'react';
import api from '../../api';

const PaymentForm = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    student: '',
    student_fee: '',
    amount: '',
    status: 'successful',
    is_verified: true
  });
  const [students, setStudents] = useState([]);
  const [studentFees, setStudentFees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentStep, setPaymentStep] = useState('form');

  // Fetch students
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const studentsRes = await api.get('/main/students/');
        setStudents(studentsRes.data);
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    };
    fetchStudents();
  }, []);

  // Fetch unpaid student fees when student is selected
  useEffect(() => {
    const fetchStudentFees = async () => {
      if (formData.student) {
        try {
          // Get unpaid fees for this specific student
          const feesRes = await api.get(`/main/student_fee/?student=${formData.student}&balance__gt=0`);
          setStudentFees(feesRes.data);
        } catch (error) {
          console.error('Error fetching student fees:', error);
          setStudentFees([]);
        }
      } else {
        setStudentFees([]);
      }
    };

    fetchStudentFees();
  }, [formData.student]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Reset student_fee when student changes
    if (name === 'student') {
      setFormData(prev => ({ ...prev, student_fee: '', amount: '' }));
    }
  };

  // Auto-fill amount when fee item is selected
  useEffect(() => {
    if (formData.student_fee) {
      const selectedFee = studentFees.find(fee => fee.id === parseInt(formData.student_fee));
      if (selectedFee && selectedFee.balance > 0) {
        setFormData(prev => ({ 
          ...prev, 
          amount: selectedFee.balance 
        }));
      }
    }
  }, [formData.student_fee, studentFees]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate amount
    if (parseFloat(formData.amount) <= 0) {
      setError('Amount must be greater than 0');
      setLoading(false);
      return;
    }

    // Prepare the data for API
    const submitData = {
      student: formData.student,
      amount: formData.amount,
      status: formData.status,
      is_verified: formData.is_verified
    };

    // Only include student_fee if it's selected
    if (formData.student_fee) {
      submitData.student_fee = formData.student_fee;
    }

    try {
      const result = await onSubmit(submitData);
      if (result.success) {
        setPaymentStep('success');
      } else {
        setError(result.error.detail || result.error.message || 'Failed to create payment');
        setPaymentStep('error');
      }
    } catch (error) {
      setError('An unexpected error occurred');
      setPaymentStep('error');
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

  const selectedStudent = students.find(s => s.id === parseInt(formData.student));
  const selectedFee = studentFees.find(f => f.id === parseInt(formData.student_fee));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Record Manual Payment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
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

          {/* Student Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Student *
            </label>
            <select
              name="student"
              value={formData.student}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Student</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.first_name} {student.last_name} - {student.admission_number}
                </option>
              ))}
            </select>
          </div>

          {/* Student Information */}
          {selectedStudent && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Student Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-600">Class:</div>
                <div className="text-gray-900">{selectedStudent.school_class?.name || 'N/A'}</div>
                <div className="text-gray-600">Admission No:</div>
                <div className="text-gray-900">{selectedStudent.admission_number}</div>
              </div>
            </div>
          )}

          {/* Fee Item Selection - Only show if student is selected */}
          {formData.student && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fee Item *
              </label>
              <select
                name="student_fee"
                value={formData.student_fee}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Fee Item to Pay</option>
                {studentFees.length > 0 ? (
                  studentFees.map(fee => (
                    <option key={fee.id} value={fee.id}>
                      {fee.fee_item?.name} - Balance: GH₵{fee.balance || 0}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No unpaid fees found for this student</option>
                )}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                You must select a specific fee item to apply this payment to.
              </p>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount *
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {selectedFee && (
              <p className="text-sm text-gray-500 mt-1">
                Suggested amount: GH₵{selectedFee.balance || 0} (remaining balance)
              </p>
            )}
          </div>

          {/* Payment Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="successful">Successful</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Verification Status */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_verified"
                checked={formData.is_verified}
                onChange={(e) => setFormData(prev => ({ ...prev, is_verified: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Mark as verified</span>
            </label>
            <p className="text-sm text-gray-500 mt-1">
              Verified payments are automatically applied to student fee balances.
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
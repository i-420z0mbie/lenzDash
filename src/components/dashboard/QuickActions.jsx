// src/components/dashboard/QuickActions.jsx
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import api from '../../api';

const Modal = ({ title, children, onClose }) => {
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-lg p-1 hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

const QuickActions = () => {
  const [activeModal, setActiveModal] = useState(null);
  const [schoolClasses, setSchoolClasses] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [studentForm, setStudentForm] = useState({
    first_name: '',
    last_name: '',
    other_names: '',
    school_class: '',
    parent_name: '',
    parent_contact: ''
  });

  const [feeStructureForm, setFeeStructureForm] = useState({
    school_class: '',
    academic_year: new Date().getFullYear().toString(),
    term: 'Term 1',
    items: [{ name: '', amount: '' }]
  });

  const [feeItemForm, setFeeItemForm] = useState({
    fee_structure: '',
    name: '',
    amount: ''
  });

  // New: Class form
  const [classForm, setClassForm] = useState({
    name: ''
  });

  useEffect(() => {
    fetchSchoolClasses();
    fetchFeeStructures();
  }, []);

  const fetchSchoolClasses = async () => {
    try {
      const response = await api.get('/main/school_class/');
      setSchoolClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
      if (error.response?.status === 403) {
        console.log('No permission to access school classes');
        setSchoolClasses([]);
      }
    }
  };

  const fetchFeeStructures = async () => {
    try {
      const response = await api.get('/main/fee_structure/');
      setFeeStructures(response.data);
    } catch (error) {
      console.error('Error fetching fee structures:', error);
      setFeeStructures([]);
    }
  };

  // -------- Handlers --------
  const handleAddStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/main/students/', studentForm);
      alert('Student added successfully!');
      setActiveModal(null);
      setStudentForm({
        first_name: '',
        last_name: '',
        other_names: '',
        school_class: '',
        parent_name: '',
        parent_contact: ''
      });
    } catch (error) {
      console.error('Error adding student:', error);
      alert('Error adding student. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFeeStructure = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const feeStructureData = {
        school_class: feeStructureForm.school_class,
        academic_year: feeStructureForm.academic_year,
        term: feeStructureForm.term,
        items: feeStructureForm.items
          .filter(item => item.name && item.amount)
          .map(item => ({ name: item.name, amount: item.amount }))
      };

      await api.post('/main/fee_structure/', feeStructureData);
      alert('Fee structure created successfully!');
      setActiveModal(null);
      setFeeStructureForm({
        school_class: '',
        academic_year: new Date().getFullYear().toString(),
        term: 'Term 1',
        items: [{ name: '', amount: '' }]
      });

      await fetchFeeStructures();
    } catch (error) {
      console.error('Error creating fee structure:', error);
      const msg = error.response?.data ? JSON.stringify(error.response.data) : 'Please try again.';
      alert(`Error creating fee structure: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFeeItem = async (e) => {
    e.preventDefault();
    if (!feeItemForm.fee_structure) {
      alert('Please select a fee structure first.');
      return;
    }
    if (!feeItemForm.name || !feeItemForm.amount) {
      alert('Please provide a name and an amount for the fee item.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        fee_structure: feeItemForm.fee_structure,
        name: feeItemForm.name,
        amount: feeItemForm.amount
      };

      await api.post('/main/fee_item/', payload);
      alert('Fee item added successfully!');
      setActiveModal(null);
      setFeeItemForm({ fee_structure: '', name: '', amount: '' });

      await fetchFeeStructures();
    } catch (error) {
      console.error('Error adding fee item:', error);
      const msg = error.response?.data ? JSON.stringify(error.response.data) : 'Please try again.';
      alert(`Error adding fee item: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  // New: Add Class handler
  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!classForm.name.trim()) {
      alert('Please enter a class name');
      return;
    }

    setLoading(true);
    try {
      await api.post('/main/school_class/', { name: classForm.name });
      alert('Class added successfully!');
      setActiveModal(null);
      setClassForm({ name: '' });
      
      // Refresh the classes list
      await fetchSchoolClasses();
    } catch (error) {
      console.error('Error adding class:', error);
      const msg = error.response?.data ? JSON.stringify(error.response.data) : 'Please try again.';
      alert(`Error adding class: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  // FeeStructure items helpers for creation modal
  const addFeeItemField = () => {
    setFeeStructureForm(prev => ({
      ...prev,
      items: [...prev.items, { name: '', amount: '' }]
    }));
  };

  const updateFeeItemField = (index, field, value) => {
    const updated = [...feeStructureForm.items];
    updated[index][field] = value;
    setFeeStructureForm(prev => ({ ...prev, items: updated }));
  };

  const removeFeeItemField = (index) => {
    if (feeStructureForm.items.length > 1) {
      const updated = feeStructureForm.items.filter((_, i) => i !== index);
      setFeeStructureForm(prev => ({ ...prev, items: updated }));
    }
  };

  // Helper to render a friendly label for a fee structure item
  const feeStructureLabel = (fs) => {
    if (!fs) return '';
    const sc = fs.school_class?.name || (fs.school_class && fs.school_class.name) || `Class ${fs.school_class}`;
    const year = fs.academic_year || fs.academic_year;
    const term = fs.term || fs.term;
    return `${sc} — ${year} ${term}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Add Single Student */}
        <button
          onClick={() => setActiveModal('add-student')}
          className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
        >
          <svg className="w-8 h-8 text-gray-400 group-hover:text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm font-medium text-gray-700 group-hover:text-blue-900">Add Student</span>
        </button>

        {/* Create Fee Structure */}
        <button
          onClick={() => setActiveModal('fee-structure')}
          className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 group"
        >
          <svg className="w-8 h-8 text-gray-400 group-hover:text-purple-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm font-medium text-gray-700 group-hover:text-purple-900">Add Fee Structure & Items</span>
        </button>

        {/* Add Fee Item */}
        <button
          onClick={() => setActiveModal('add-fee-item')}
          className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all duration-200 group"
        >
          <svg className="w-8 h-8 text-gray-400 group-hover:text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="text-sm font-medium text-gray-700 group-hover:text-green-900">Add Fee Item</span>
        </button>

        {/* Add Class (replaced Record Payment) */}
        <button
          onClick={() => setActiveModal('add-class')}
          className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all duration-200 group"
        >
          <svg className="w-8 h-8 text-gray-400 group-hover:text-orange-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="text-sm font-medium text-gray-700 group-hover:text-orange-900">Add Class</span>
        </button>
      </div>

      {/* Add Student Modal */}
      {activeModal === 'add-student' && (
        <Modal title="Add New Student" onClose={() => setActiveModal(null)}>
          <form onSubmit={handleAddStudent} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={studentForm.first_name}
                onChange={(e) => setStudentForm(prev => ({ ...prev, first_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={studentForm.last_name}
                onChange={(e) => setStudentForm(prev => ({ ...prev, last_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Other Names</label>
              <input
                type="text"
                value={studentForm.other_names}
                onChange={(e) => setStudentForm(prev => ({ ...prev, other_names: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
              <select
                required
                value={studentForm.school_class}
                onChange={(e) => setStudentForm(prev => ({ ...prev, school_class: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Class</option>
                {schoolClasses.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent Name</label>
              <input
                type="text"
                value={studentForm.parent_name}
                onChange={(e) => setStudentForm(prev => ({ ...prev, parent_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent Contact</label>
              <input
                type="text"
                value={studentForm.parent_contact}
                onChange={(e) => setStudentForm(prev => ({ ...prev, parent_contact: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Student'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Fee Structure Modal */}
      {activeModal === 'fee-structure' && (
        <Modal title="Create Fee Structure" onClose={() => setActiveModal(null)}>
          <form onSubmit={handleCreateFeeStructure} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
              <select
                required
                value={feeStructureForm.school_class}
                onChange={(e) => setFeeStructureForm(prev => ({ ...prev, school_class: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Select Class</option>
                {schoolClasses.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                <input
                  type="text"
                  value={feeStructureForm.academic_year}
                  onChange={(e) => setFeeStructureForm(prev => ({ ...prev, academic_year: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
                <select
                  value={feeStructureForm.term}
                  onChange={(e) => setFeeStructureForm(prev => ({ ...prev, term: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="Term 1">Term 1</option>
                  <option value="Term 2">Term 2</option>
                  <option value="Term 3">Term 3</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Fee Items</label>
                <button
                  type="button"
                  onClick={addFeeItemField}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  + Add Item
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {feeStructureForm.items.map((item, index) => (
                  <div key={index} className="flex space-x-2 items-start">
                    <input
                      type="text"
                      placeholder="Item name"
                      value={item.name}
                      onChange={(e) => updateFeeItemField(index, 'name', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      value={item.amount}
                      onChange={(e) => updateFeeItemField(index, 'amount', e.target.value)}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    {feeStructureForm.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFeeItemField(index)}
                        className="px-2 py-2 text-red-600 hover:text-red-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Structure'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Fee Item Modal */}
      {activeModal === 'add-fee-item' && (
        <Modal title="Add Fee Item" onClose={() => setActiveModal(null)}>
          <form onSubmit={handleAddFeeItem} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fee Structure *</label>
              <select
                required
                value={feeItemForm.fee_structure}
                onChange={(e) => setFeeItemForm(prev => ({ ...prev, fee_structure: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Select Structure</option>
                {feeStructures.map(fs => (
                  <option key={fs.id} value={fs.id}>
                    {feeStructureLabel(fs)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
              <input
                type="text"
                required
                value={feeItemForm.name}
                onChange={(e) => setFeeItemForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
              <input
                type="number"
                step="0.01"
                required
                value={feeItemForm.amount}
                onChange={(e) => setFeeItemForm(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Item'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Class Modal (replaced Record Payment) */}
      {activeModal === 'add-class' && (
        <Modal title="Add New Class" onClose={() => setActiveModal(null)}>
          <form onSubmit={handleAddClass} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class Name *</label>
              <input
                type="text"
                required
                value={classForm.name}
                onChange={(e) => setClassForm({ name: e.target.value })}
                placeholder="e.g., Primary 1, Grade 2, Form 3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter the name of the class you want to create
              </p>
            </div>

            <div className="bg-orange-50 rounded-lg p-3">
              <h4 className="text-sm font-medium text-orange-800 mb-1">Note</h4>
              <p className="text-sm text-orange-700">
                The class will be automatically associated with your school. You can then assign students to this class and create fee structures for it.
              </p>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  setClassForm({ name: '' });
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !classForm.name.trim()}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Class'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default QuickActions;
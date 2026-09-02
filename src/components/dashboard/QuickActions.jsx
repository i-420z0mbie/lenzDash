import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import api from '../../api';

const Modal = ({ title, children, onClose }) => ReactDOM.createPortal(
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-white rounded-xl w-full max-w-md p-5 shadow-2xl">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
      </div>
      {children}
    </div>
  </div>,
  document.body
);

const QuickActions = () => {
  const [activeModal, setActiveModal] = useState(null);
  const [schoolClasses, setSchoolClasses] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(''); // error message for the current modal

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
  const [classForm, setClassForm] = useState({ name: '' });

  // Fetch data
  useEffect(() => {
    fetchSchoolClasses();
    fetchFeeStructures();
  }, []);

  const fetchSchoolClasses = async () => {
    try {
      const res = await api.get('/main/school_class/');
      setSchoolClasses(res.data);
    } catch (e) {
      console.error('Failed to fetch classes', e);
    }
  };

  const fetchFeeStructures = async () => {
    try {
      const res = await api.get('/main/fee_structure/');
      setFeeStructures(res.data);
    } catch (e) {
      console.error('Failed to fetch fee structures', e);
    }
  };

  // Reset functions
  const resetStudentForm = () =>
    setStudentForm({
      first_name: '',
      last_name: '',
      other_names: '',
      school_class: '',
      parent_name: '',
      parent_contact: ''
    });
  const resetFeeStructureForm = () =>
    setFeeStructureForm({
      school_class: '',
      academic_year: new Date().getFullYear().toString(),
      term: 'Term 1',
      items: [{ name: '', amount: '' }]
    });

  // Fee item array helpers
  const addItemField = () =>
    setFeeStructureForm(prev => ({ ...prev, items: [...prev.items, { name: '', amount: '' }] }));
  const removeItemField = (idx) => {
    if (feeStructureForm.items.length > 1) {
      setFeeStructureForm(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== idx)
      }));
    }
  };
  const updateItem = (idx, field, val) => {
    const newItems = [...feeStructureForm.items];
    newItems[idx][field] = val;
    setFeeStructureForm(prev => ({ ...prev, items: newItems }));
  };

  // ---- Handlers ----

  // Add Student
  const handleAddStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/main/students/', studentForm);
      alert('Student added successfully!');
      setActiveModal(null);
      resetStudentForm();
    } catch (err) {
      if (err.response && err.response.status === 400) {
        const data = err.response.data;
        const msg = Object.values(data).flat().join('; ');
        setError(`❌ ${msg || 'Please check your input.'}`);
      } else {
        setError('❌ An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Create Fee Structure (with enhanced error handling)
  const handleCreateFeeStructure = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/main/fee_structure/', {
        ...feeStructureForm,
        items: feeStructureForm.items.filter(i => i.name && i.amount)
      });
      alert('Fee structure created successfully!');
      setActiveModal(null);
      resetFeeStructureForm();
      await fetchFeeStructures();
    } catch (err) {
      if (err.response && err.response.status === 400) {
        const data = err.response.data;
        // Check for non_field_errors (the duplicate error)
        if (data.non_field_errors && data.non_field_errors.length) {
          const msg = data.non_field_errors[0];
          if (msg.toLowerCase().includes('already exists')) {
            setError(
              `⚠️ ${msg}. You can add fee items to the existing structure using the "Add Fee Item" action below.`
            );
          } else {
            setError(`❌ ${msg}`);
          }
        } else {
          // Field-specific errors
          const fieldErrors = Object.keys(data).map(
            field => `${field}: ${data[field].join(', ')}`
          ).join('; ');
          setError(`❌ ${fieldErrors || 'Please check your input.'}`);
        }
      } else {
        setError('❌ An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Add Fee Item
  const handleAddFeeItem = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/main/fee_item/', feeItemForm);
      alert('Fee item added successfully!');
      setActiveModal(null);
      setFeeItemForm({ fee_structure: '', name: '', amount: '' });
      await fetchFeeStructures();
    } catch (err) {
      if (err.response && err.response.status === 400) {
        const data = err.response.data;
        const msg = Object.values(data).flat().join('; ');
        setError(`❌ ${msg || 'Please check your input.'}`);
      } else {
        setError('❌ An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Add Class
  const handleAddClass = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/main/school_class/', { name: classForm.name });
      alert('Class added successfully!');
      setActiveModal(null);
      setClassForm({ name: '' });
      await fetchSchoolClasses();
    } catch (err) {
      if (err.response && err.response.status === 400) {
        const data = err.response.data;
        const msg = Object.values(data).flat().join('; ');
        setError(`❌ ${msg || 'Please check your input.'}`);
      } else {
        setError('❌ An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper to switch to "Add Fee Item" modal from the fee structure error
  const switchToAddFeeItem = () => {
    setActiveModal('add-fee-item');
    setError('');
  };

  return (
    <div className="glass-card rounded-xl p-4">
      <h2 className="text-xs font-semibold text-slate-600 mb-3">⚡ Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <button
          onClick={() => setActiveModal('add-student')}
          className="flex flex-col items-center p-2 border border-dashed border-slate-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition"
        >
          <svg className="w-5 h-5 text-slate-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-[10px] font-medium">Add Student</span>
        </button>
        <button
          onClick={() => setActiveModal('fee-structure')}
          className="flex flex-col items-center p-2 border border-dashed border-slate-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition"
        >
          <svg className="w-5 h-5 text-slate-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-[10px] font-medium">Fee Structure</span>
        </button>
        <button
          onClick={() => setActiveModal('add-fee-item')}
          className="flex flex-col items-center p-2 border border-dashed border-slate-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition"
        >
          <svg className="w-5 h-5 text-slate-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="text-[10px] font-medium">Add Fee Item</span>
        </button>
        <button
          onClick={() => setActiveModal('add-class')}
          className="flex flex-col items-center p-2 border border-dashed border-slate-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition"
        >
          <svg className="w-5 h-5 text-slate-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="text-[10px] font-medium">Add Class</span>
        </button>
      </div>

      {/* ---------- MODALS ---------- */}

      {/* Add Student Modal */}
      {activeModal === 'add-student' && (
        <Modal title="Add New Student" onClose={() => { setActiveModal(null); setError(''); }}>
          <form onSubmit={handleAddStudent} className="space-y-3">
            <input
              required
              placeholder="First Name"
              value={studentForm.first_name}
              onChange={e => setStudentForm(p => ({ ...p, first_name: e.target.value }))}
              className="w-full p-2 text-xs border rounded-lg"
            />
            <input
              required
              placeholder="Last Name"
              value={studentForm.last_name}
              onChange={e => setStudentForm(p => ({ ...p, last_name: e.target.value }))}
              className="w-full p-2 text-xs border rounded-lg"
            />
            <input
              placeholder="Other Names"
              value={studentForm.other_names}
              onChange={e => setStudentForm(p => ({ ...p, other_names: e.target.value }))}
              className="w-full p-2 text-xs border rounded-lg"
            />
            <select
              required
              value={studentForm.school_class}
              onChange={e => setStudentForm(p => ({ ...p, school_class: e.target.value }))}
              className="w-full p-2 text-xs border rounded-lg"
            >
              <option value="">Select Class</option>
              {schoolClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input
              placeholder="Parent Name"
              value={studentForm.parent_name}
              onChange={e => setStudentForm(p => ({ ...p, parent_name: e.target.value }))}
              className="w-full p-2 text-xs border rounded-lg"
            />
            <input
              placeholder="Parent Contact"
              value={studentForm.parent_contact}
              onChange={e => setStudentForm(p => ({ ...p, parent_contact: e.target.value }))}
              className="w-full p-2 text-xs border rounded-lg"
            />
            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-2 text-xs text-rose-700">
                {error}
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setActiveModal(null); setError(''); }}
                className="flex-1 py-1.5 text-xs bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-1.5 text-xs bg-blue-600 text-white rounded-lg"
              >
                {loading ? 'Adding...' : 'Add'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Fee Structure Modal */}
      {activeModal === 'fee-structure' && (
        <Modal title="Create Fee Structure" onClose={() => { setActiveModal(null); setError(''); }}>
          <form onSubmit={handleCreateFeeStructure} className="space-y-3">
            <select
              required
              value={feeStructureForm.school_class}
              onChange={e => setFeeStructureForm(p => ({ ...p, school_class: e.target.value }))}
              className="w-full p-2 text-xs border rounded-lg"
            >
              <option value="">Select Class</option>
              {schoolClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input
              type="text"
              placeholder="Academic Year"
              value={feeStructureForm.academic_year}
              onChange={e => setFeeStructureForm(p => ({ ...p, academic_year: e.target.value }))}
              className="w-full p-2 text-xs border rounded-lg"
            />
            <select
              value={feeStructureForm.term}
              onChange={e => setFeeStructureForm(p => ({ ...p, term: e.target.value }))}
              className="w-full p-2 text-xs border rounded-lg"
            >
              <option>Term 1</option>
              <option>Term 2</option>
              <option>Term 3</option>
            </select>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-medium">Fee Items</span>
                <button type="button" onClick={addItemField} className="text-[10px] text-purple-600">
                  + Add
                </button>
              </div>
              {feeStructureForm.items.map((item, idx) => (
                <div key={idx} className="flex gap-1 mt-1">
                  <input
                    placeholder="Name"
                    value={item.name}
                    onChange={e => updateItem(idx, 'name', e.target.value)}
                    className="flex-1 p-1.5 text-xs border rounded"
                  />
                  <input
                    placeholder="Amount"
                    type="number"
                    value={item.amount}
                    onChange={e => updateItem(idx, 'amount', e.target.value)}
                    className="w-20 p-1.5 text-xs border rounded"
                  />
                  {feeStructureForm.items.length > 1 && (
                    <button type="button" onClick={() => removeItemField(idx)} className="text-rose-500 text-xs">
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Error display with suggestion */}
            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-2 text-xs text-rose-700">
                {error}
                {error.toLowerCase().includes('already exists') && (
                  <button
                    type="button"
                    onClick={switchToAddFeeItem}
                    className="ml-2 text-rose-800 font-semibold underline hover:no-underline"
                  >
                    Go to Add Fee Item
                  </button>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setActiveModal(null); setError(''); }}
                className="flex-1 py-1.5 text-xs bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-1.5 text-xs bg-purple-600 text-white rounded-lg"
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Fee Item Modal */}
      {activeModal === 'add-fee-item' && (
        <Modal title="Add Fee Item" onClose={() => { setActiveModal(null); setError(''); }}>
          <form onSubmit={handleAddFeeItem} className="space-y-3">
            <select
              required
              value={feeItemForm.fee_structure}
              onChange={e => setFeeItemForm(p => ({ ...p, fee_structure: e.target.value }))}
              className="w-full p-2 text-xs border rounded-lg"
            >
              <option value="">Select Fee Structure</option>
              {feeStructures.map(fs => (
                <option key={fs.id} value={fs.id}>
                  {fs.school_class?.name} - {fs.academic_year} {fs.term}
                </option>
              ))}
            </select>
            <input
              required
              placeholder="Item Name"
              value={feeItemForm.name}
              onChange={e => setFeeItemForm(p => ({ ...p, name: e.target.value }))}
              className="w-full p-2 text-xs border rounded-lg"
            />
            <input
              required
              type="number"
              step="0.01"
              placeholder="Amount"
              value={feeItemForm.amount}
              onChange={e => setFeeItemForm(p => ({ ...p, amount: e.target.value }))}
              className="w-full p-2 text-xs border rounded-lg"
            />
            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-2 text-xs text-rose-700">
                {error}
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setActiveModal(null); setError(''); }}
                className="flex-1 py-1.5 text-xs bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-1.5 text-xs bg-green-600 text-white rounded-lg"
              >
                {loading ? 'Adding...' : 'Add'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Class Modal */}
      {activeModal === 'add-class' && (
        <Modal title="Add New Class" onClose={() => { setActiveModal(null); setError(''); }}>
          <form onSubmit={handleAddClass} className="space-y-3">
            <input
              required
              placeholder="Class name (e.g., Primary 1)"
              value={classForm.name}
              onChange={e => setClassForm({ name: e.target.value })}
              className="w-full p-2 text-xs border rounded-lg"
            />
            <div className="bg-amber-50 rounded-lg p-2">
              <p className="text-[10px] text-amber-800">
                The class will be created and can be used to assign students and fee structures.
              </p>
            </div>
            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-2 text-xs text-rose-700">
                {error}
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setActiveModal(null); setError(''); }}
                className="flex-1 py-1.5 text-xs bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-1.5 text-xs bg-orange-600 text-white rounded-lg"
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
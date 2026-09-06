import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import api from '../../api';

const Modal = ({ title, children, onClose }) => ReactDOM.createPortal(
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-stone-900/30" onClick={onClose} />
    <div className="relative bg-stone-50 border border-stone-300 w-full max-w-md p-6 shadow-sm">
      <div className="flex justify-between items-baseline mb-4 border-b border-stone-200 pb-3">
        <h3 className="ledger-display text-lg text-stone-900">{title}</h3>
        <button onClick={onClose} className="text-stone-400 hover:text-stone-900 transition-colors text-sm">✕</button>
      </div>
      {children}
    </div>
  </div>,
  document.body
);

const inputCls = "w-full px-3 py-2 text-sm bg-white border border-stone-300 focus:border-emerald-800 focus:outline-none placeholder:text-stone-400";

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
        setError(msg || 'Please check your input.');
      } else {
        setError('An unexpected error occurred. Please try again.');
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
              `${msg}. You can add fee items to the existing structure using "Add Fee Item" instead.`
            );
          } else {
            setError(msg);
          }
        } else {
          // Field-specific errors
          const fieldErrors = Object.keys(data).map(
            field => `${field}: ${data[field].join(', ')}`
          ).join('; ');
          setError(fieldErrors || 'Please check your input.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
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
        setError(msg || 'Please check your input.');
      } else {
        setError('An unexpected error occurred. Please try again.');
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
        setError(msg || 'Please check your input.');
      } else {
        setError('An unexpected error occurred. Please try again.');
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

  const actions = [
    {
      key: 'add-student',
      label: 'Add student',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
    },
    {
      key: 'fee-structure',
      label: 'Fee structure',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    },
    {
      key: 'add-fee-item',
      label: 'Add fee item',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    },
    {
      key: 'add-class',
      label: 'Add class',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    }
  ];

  return (
    <div className="border-b border-stone-200 pb-6">
      <h3 className="text-sm font-medium text-stone-700 mb-3">Quick actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {actions.map(a => (
          <button
            key={a.key}
            onClick={() => setActiveModal(a.key)}
            className="flex flex-col items-center gap-1.5 py-4 border border-stone-200 text-stone-600 hover:border-emerald-800 hover:text-emerald-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{a.icon}</svg>
            <span className="text-xs">{a.label}</span>
          </button>
        ))}
      </div>

      {/* ---------- MODALS ---------- */}

      {/* Add Student Modal */}
      {activeModal === 'add-student' && (
        <Modal title="Add new student" onClose={() => { setActiveModal(null); setError(''); }}>
          <form onSubmit={handleAddStudent} className="space-y-3">
            <input
              required
              placeholder="First name"
              value={studentForm.first_name}
              onChange={e => setStudentForm(p => ({ ...p, first_name: e.target.value }))}
              className={inputCls}
            />
            <input
              required
              placeholder="Last name"
              value={studentForm.last_name}
              onChange={e => setStudentForm(p => ({ ...p, last_name: e.target.value }))}
              className={inputCls}
            />
            <input
              placeholder="Other names"
              value={studentForm.other_names}
              onChange={e => setStudentForm(p => ({ ...p, other_names: e.target.value }))}
              className={inputCls}
            />
            <select
              required
              value={studentForm.school_class}
              onChange={e => setStudentForm(p => ({ ...p, school_class: e.target.value }))}
              className={inputCls}
            >
              <option value="">Select class</option>
              {schoolClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input
              placeholder="Parent name"
              value={studentForm.parent_name}
              onChange={e => setStudentForm(p => ({ ...p, parent_name: e.target.value }))}
              className={inputCls}
            />
            <input
              placeholder="Parent contact"
              value={studentForm.parent_contact}
              onChange={e => setStudentForm(p => ({ ...p, parent_contact: e.target.value }))}
              className={inputCls}
            />
            {error && (
              <div className="border border-red-800/30 bg-red-50 p-2.5 text-xs text-red-800">
                {error}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setActiveModal(null); setError(''); }}
                className="flex-1 py-2 text-xs border border-stone-300 text-stone-600 hover:text-stone-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 text-xs bg-stone-900 text-stone-50 hover:bg-emerald-900 transition-colors disabled:opacity-60"
              >
                {loading ? 'Adding…' : 'Add student'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Fee Structure Modal */}
      {activeModal === 'fee-structure' && (
        <Modal title="Create fee structure" onClose={() => { setActiveModal(null); setError(''); }}>
          <form onSubmit={handleCreateFeeStructure} className="space-y-3">
            <select
              required
              value={feeStructureForm.school_class}
              onChange={e => setFeeStructureForm(p => ({ ...p, school_class: e.target.value }))}
              className={inputCls}
            >
              <option value="">Select class</option>
              {schoolClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input
              type="text"
              placeholder="Academic year"
              value={feeStructureForm.academic_year}
              onChange={e => setFeeStructureForm(p => ({ ...p, academic_year: e.target.value }))}
              className={inputCls}
            />
            <select
              value={feeStructureForm.term}
              onChange={e => setFeeStructureForm(p => ({ ...p, term: e.target.value }))}
              className={inputCls}
            >
              <option>Term 1</option>
              <option>Term 2</option>
              <option>Term 3</option>
            </select>
            <div>
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="text-xs text-stone-500">Fee items</span>
                <button type="button" onClick={addItemField} className="text-xs text-emerald-900 hover:text-emerald-700">
                  + Add item
                </button>
              </div>
              <div className="space-y-1.5">
                {feeStructureForm.items.map((item, idx) => (
                  <div key={idx} className="flex gap-1.5">
                    <input
                      placeholder="Name"
                      value={item.name}
                      onChange={e => updateItem(idx, 'name', e.target.value)}
                      className={`flex-1 ${inputCls} py-1.5`}
                    />
                    <input
                      placeholder="Amount"
                      type="number"
                      value={item.amount}
                      onChange={e => updateItem(idx, 'amount', e.target.value)}
                      className={`w-24 ledger-mono ${inputCls} py-1.5`}
                    />
                    {feeStructureForm.items.length > 1 && (
                      <button type="button" onClick={() => removeItemField(idx)} className="text-stone-400 hover:text-red-800 text-xs px-1">
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Error display with suggestion */}
            {error && (
              <div className="border border-amber-800/30 bg-amber-50 p-2.5 text-xs text-amber-900">
                {error}
                {error.toLowerCase().includes('already exists') && (
                  <button
                    type="button"
                    onClick={switchToAddFeeItem}
                    className="ml-2 font-medium underline hover:no-underline"
                  >
                    Go to Add Fee Item
                  </button>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setActiveModal(null); setError(''); }}
                className="flex-1 py-2 text-xs border border-stone-300 text-stone-600 hover:text-stone-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 text-xs bg-stone-900 text-stone-50 hover:bg-emerald-900 transition-colors disabled:opacity-60"
              >
                {loading ? 'Creating…' : 'Create structure'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Fee Item Modal */}
      {activeModal === 'add-fee-item' && (
        <Modal title="Add fee item" onClose={() => { setActiveModal(null); setError(''); }}>
          <form onSubmit={handleAddFeeItem} className="space-y-3">
            <select
              required
              value={feeItemForm.fee_structure}
              onChange={e => setFeeItemForm(p => ({ ...p, fee_structure: e.target.value }))}
              className={inputCls}
            >
              <option value="">Select fee structure</option>
              {feeStructures.map(fs => (
                <option key={fs.id} value={fs.id}>
                  {fs.school_class?.name} — {fs.academic_year} {fs.term}
                </option>
              ))}
            </select>
            <input
              required
              placeholder="Item name"
              value={feeItemForm.name}
              onChange={e => setFeeItemForm(p => ({ ...p, name: e.target.value }))}
              className={inputCls}
            />
            <input
              required
              type="number"
              step="0.01"
              placeholder="Amount"
              value={feeItemForm.amount}
              onChange={e => setFeeItemForm(p => ({ ...p, amount: e.target.value }))}
              className={`ledger-mono ${inputCls}`}
            />
            {error && (
              <div className="border border-red-800/30 bg-red-50 p-2.5 text-xs text-red-800">
                {error}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setActiveModal(null); setError(''); }}
                className="flex-1 py-2 text-xs border border-stone-300 text-stone-600 hover:text-stone-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 text-xs bg-stone-900 text-stone-50 hover:bg-emerald-900 transition-colors disabled:opacity-60"
              >
                {loading ? 'Adding…' : 'Add item'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Class Modal */}
      {activeModal === 'add-class' && (
        <Modal title="Add new class" onClose={() => { setActiveModal(null); setError(''); }}>
          <form onSubmit={handleAddClass} className="space-y-3">
            <input
              required
              placeholder="Class name (e.g., Primary 1)"
              value={classForm.name}
              onChange={e => setClassForm({ name: e.target.value })}
              className={inputCls}
            />
            <div className="border border-amber-800/30 bg-amber-50 p-2.5">
              <p className="text-xs text-amber-900">
                The class will be created and can then be used to assign students and fee structures.
              </p>
            </div>
            {error && (
              <div className="border border-red-800/30 bg-red-50 p-2.5 text-xs text-red-800">
                {error}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setActiveModal(null); setError(''); }}
                className="flex-1 py-2 text-xs border border-stone-300 text-stone-600 hover:text-stone-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 text-xs bg-stone-900 text-stone-50 hover:bg-emerald-900 transition-colors disabled:opacity-60"
              >
                {loading ? 'Adding…' : 'Add class'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default QuickActions;
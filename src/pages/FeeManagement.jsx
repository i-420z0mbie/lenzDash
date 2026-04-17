// src/pages/FeeManagement.jsx
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import api from '../api';

// ============================================================
// Modal Component (reusable portal)
// ============================================================
const Modal = ({ title, children, onClose }) => {
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl transform transition-all duration-300 scale-100">
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-all rounded-full p-1 hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body
  );
};

// ============================================================
// Fee Structures List Component (beautiful table/card hybrid)
// ============================================================
const FeeStructuresList = ({ structures, onEdit, onDelete, onRefresh }) => {
  return (
    <div className="space-y-4">
      {structures.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-gray-500">No fee structures found. Create your first one!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {structures.map((structure) => (
            <div
              key={structure.id}
              className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-bold text-gray-800">
                        {structure.school_class?.name || 'Unknown Class'}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        structure.is_active
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {structure.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex gap-3 mt-1 text-sm text-gray-500">
                      <span>📅 {structure.academic_year}</span>
                      <span>📚 {structure.term}</span>
                      <span>💰 GH₵{parseFloat(structure.total_amount || 0).toFixed(2)}</span>
                      <span>📦 {structure.items?.length || 0} items</span>
                    </div>
                    {structure.items && structure.items.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {structure.items.slice(0, 3).map((item, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                            {item.name}: GH₵{item.amount}
                          </span>
                        ))}
                        {structure.items.length > 3 && (
                          <span className="text-xs text-gray-400">+{structure.items.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(structure)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(structure.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================
// Fee Analytics Component (simple but beautiful)
// ============================================================
const FeeAnalytics = ({ structures, stats }) => {
  const totalPotential = structures.reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0);
  const activePotential = structures
    .filter(s => s.is_active)
    .reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Potential Revenue</p>
              <p className="text-2xl font-bold text-gray-800">GH₵{totalPotential.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-emerald-600 font-medium">Active Structures Value</p>
              <p className="text-2xl font-bold text-gray-800">GH₵{activePotential.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
        <h4 className="font-semibold text-gray-700 mb-3">Fee Structure Overview</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total Structures</span>
            <span className="font-medium">{stats.total_structures}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Active / Inactive</span>
            <span className="font-medium">{stats.active_structures} / {stats.total_structures - stats.active_structures}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Main FeeManagement Component
// ============================================================
const FeeManagement = () => {
  const [feeStructures, setFeeStructures] = useState([]);
  const [schoolClasses, setSchoolClasses] = useState([]);
  const [activeTab, setActiveTab] = useState('structures');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFeeStructureModal, setShowFeeStructureModal] = useState(false);
  const [editingStructure, setEditingStructure] = useState(null);
  const [stats, setStats] = useState({
    total_structures: 0,
    active_structures: 0,
    total_revenue: 0,
    pending_payments: 0,
  });

  // Form state for fee structure
  const [feeStructureForm, setFeeStructureForm] = useState({
    school_class: '',
    academic_year: new Date().getFullYear().toString(),
    term: 'Term 1',
    items: [{ name: '', amount: '' }],
    is_active: true, // automatically active on create
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchFeeData();
  }, []);

  const fetchFeeData = async () => {
    try {
      setLoading(true);
      setError('');

      const [structuresRes, classesRes, statsRes] = await Promise.all([
        api.get('/main/fee_structure/'),
        api.get('/main/school_class/'),
        api.get('/main/dashboard/overview/').catch(() => ({ data: {} })),
      ]);

      setFeeStructures(structuresRes.data);
      setSchoolClasses(classesRes.data);

      setStats({
        total_structures: structuresRes.data.length,
        active_structures: structuresRes.data.filter((s) => s.is_active).length,
        total_revenue: statsRes.data?.total_revenue || 0,
        pending_payments: statsRes.data?.pending_payments || 0,
      });
    } catch (error) {
      console.error('Error fetching fee data:', error);
      if (error.response?.status !== 403) {
        setError('Failed to load fee management data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Create fee structure (automatically active)
  const handleCreateFeeStructure = async (e) => {
    e.preventDefault();

    if (!feeStructureForm.school_class) {
      setFormError('Please select a class');
      return;
    }

    const validItems = feeStructureForm.items.filter((item) => item.name && item.amount);
    if (validItems.length === 0) {
      setFormError('Please add at least one fee item with name and amount');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      const feeStructureData = {
        school_class: feeStructureForm.school_class,
        academic_year: feeStructureForm.academic_year,
        term: feeStructureForm.term,
        is_active: true, // force active
        items: validItems.map((item) => ({
          name: item.name,
          amount: parseFloat(item.amount),
        })),
      };

      const response = await api.post('/main/fee_structure/', feeStructureData);

      setFeeStructures((prev) => [response.data, ...prev]);
      setStats((prev) => ({
        ...prev,
        total_structures: prev.total_structures + 1,
        active_structures: prev.active_structures + 1,
      }));

      setShowFeeStructureModal(false);
      resetFeeStructureForm();
      // Optional small toast (using alert for simplicity)
      alert('Fee structure created successfully!');
    } catch (error) {
      console.error('Error creating fee structure:', error);
      let errorMessage = 'Failed to create fee structure. Please try again.';
      if (error.response?.data) {
        if (typeof error.response.data === 'object') {
          errorMessage = Object.values(error.response.data).flat().join(', ');
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
        if (errorMessage.toLowerCase().includes('already exists')) {
          errorMessage = 'A fee structure already exists for this class, academic year, and term.';
        }
      }
      setFormError(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateStructure = async (id, formData) => {
    try {
      const response = await api.put(`/main/fee_structure/${id}/`, formData);
      setFeeStructures((prev) =>
        prev.map((structure) => (structure.id === id ? response.data : structure))
      );
      setShowFeeStructureModal(false);
      setEditingStructure(null);
      await fetchFeeData();
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating fee structure:', error);
      return {
        success: false,
        error: error.response?.data || 'Failed to update fee structure',
      };
    }
  };

  const handleDeleteStructure = async (id) => {
    if (!window.confirm('Are you sure you want to delete this fee structure? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/main/fee_structure/${id}/`);
      setFeeStructures((prev) => prev.filter((structure) => structure.id !== id));
      setStats((prev) => ({
        ...prev,
        total_structures: prev.total_structures - 1,
        active_structures: prev.active_structures - 1,
      }));
      alert('Fee structure deleted.');
    } catch (error) {
      console.error('Error deleting fee structure:', error);
      alert('Failed to delete fee structure. Please try again.');
    }
  };

  const handleEdit = (structure) => {
    setEditingStructure(structure);
    setShowFeeStructureModal(true);
    setFeeStructureForm({
      school_class: structure.school_class?.id || structure.school_class,
      academic_year: structure.academic_year,
      term: structure.term,
      items: structure.items?.map((item) => ({
        name: item.name,
        amount: item.amount.toString(),
      })) || [{ name: '', amount: '' }],
      is_active: structure.is_active,
    });
  };

  const handleCloseForm = () => {
    setShowFeeStructureModal(false);
    setEditingStructure(null);
    resetFeeStructureForm();
    setFormError('');
  };

  const resetFeeStructureForm = () => {
    setFeeStructureForm({
      school_class: '',
      academic_year: new Date().getFullYear().toString(),
      term: 'Term 1',
      items: [{ name: '', amount: '' }],
      is_active: true,
    });
  };

  // Fee item handlers – NO "add item" button, only edit and delete
  const updateFeeItemField = (index, field, value) => {
    const updated = [...feeStructureForm.items];
    updated[index][field] = value;
    setFeeStructureForm((prev) => ({ ...prev, items: updated }));
  };

  const removeFeeItemField = (index) => {
    if (feeStructureForm.items.length > 1) {
      const updated = feeStructureForm.items.filter((_, i) => i !== index);
      setFeeStructureForm((prev) => ({ ...prev, items: updated }));
    } else {
      setFormError('At least one fee item is required.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading fee management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Section with Gradient */}
      <div className="bg-gradient-to-r from-white via-gray-50 to-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Fee Management
            </h1>
            <p className="text-gray-500 mt-1">Create and manage fee structures effortlessly</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchFeeData}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button
              onClick={() => setShowFeeStructureModal(true)}
              className="px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 font-medium flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Fee Structure
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-xl">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Structures</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total_structures}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Structures</p>
              <p className="text-2xl font-bold text-gray-800">{stats.active_structures}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-xl">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Value</p>
              <p className="text-2xl font-bold text-gray-800">
                GH₵{feeStructures.reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-100 px-4">
          <nav className="flex gap-1">
            {[
              { id: 'structures', name: '📋 Fee Structures' },
              { id: 'analytics', name: '📈 Analytics' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 text-sm font-medium transition-all rounded-t-xl ${
                  activeTab === tab.id
                    ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-500'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'structures' && (
            <FeeStructuresList
              structures={feeStructures}
              onEdit={handleEdit}
              onDelete={handleDeleteStructure}
              onRefresh={fetchFeeData}
            />
          )}
          {activeTab === 'analytics' && (
            <FeeAnalytics structures={feeStructures} stats={stats} />
          )}
        </div>
      </div>

      {/* Fee Structure Modal (Create/Edit) – NO ADD ITEM BUTTON */}
      {showFeeStructureModal && (
        <Modal
          title={editingStructure ? '✏️ Edit Fee Structure' : '✨ Create Fee Structure'}
          onClose={handleCloseForm}
        >
          <form onSubmit={editingStructure ? (e) => {
            e.preventDefault();
            handleUpdateStructure(editingStructure.id, {
              school_class: feeStructureForm.school_class,
              academic_year: feeStructureForm.academic_year,
              term: feeStructureForm.term,
              is_active: feeStructureForm.is_active,
              items: feeStructureForm.items.filter(i => i.name && i.amount).map(i => ({ name: i.name, amount: parseFloat(i.amount) })),
            }).then(res => {
              if (res.success) {
                setShowFeeStructureModal(false);
                setEditingStructure(null);
                alert('Fee structure updated!');
              } else {
                setFormError(res.error);
              }
            });
          } : handleCreateFeeStructure} className="space-y-5">
            {formError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                <select
                  required
                  value={feeStructureForm.school_class}
                  onChange={(e) => setFeeStructureForm(prev => ({ ...prev, school_class: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={!!editingStructure}
                >
                  <option value="">Select Class</option>
                  {schoolClasses.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                <input
                  type="text"
                  value={feeStructureForm.academic_year}
                  onChange={(e) => setFeeStructureForm(prev => ({ ...prev, academic_year: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  disabled={!!editingStructure}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
                <select
                  value={feeStructureForm.term}
                  onChange={(e) => setFeeStructureForm(prev => ({ ...prev, term: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  disabled={!!editingStructure}
                >
                  <option>Term 1</option>
                  <option>Term 2</option>
                  <option>Term 3</option>
                </select>
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={feeStructureForm.is_active}
                    onChange={(e) => setFeeStructureForm(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Active (visible for billing)</span>
                </label>
              </div>
            </div>

            {/* Fee Items Section – NO ADD BUTTON, only edit/delete existing items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">Fee Items *</label>
                <span className="text-xs text-gray-400">Edit or delete items below</span>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {feeStructureForm.items.map((item, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <input
                      type="text"
                      placeholder="Item name"
                      value={item.name}
                      onChange={(e) => updateFeeItemField(index, 'name', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Amount"
                      value={item.amount}
                      onChange={(e) => updateFeeItemField(index, 'amount', e.target.value)}
                      className="w-28 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeFeeItemField(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition"
                      title="Remove item"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Total Amount:</span>
                  <span className="text-lg font-bold text-gray-800">
                    GH₵{feeStructureForm.items.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleCloseForm}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 shadow-sm"
              >
                {formLoading ? 'Saving...' : editingStructure ? 'Update Structure' : 'Create Structure'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
};

export default FeeManagement;
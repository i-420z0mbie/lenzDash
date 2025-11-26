// src/pages/FeeManagement.jsx
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import api from '../api';
import FeeStructuresList from '../components/fees/FeeStructuresList';
import FeeAnalytics from '../components/fees/FeeAnalytics';
import BulkFeeActions from '../components/fees/BulkFeeActions';

// Modal Component (copied from QuickActions)
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
    pending_payments: 0
  });

  // Fee Structure Form State (from QuickActions)
  const [feeStructureForm, setFeeStructureForm] = useState({
    school_class: '',
    academic_year: new Date().getFullYear().toString(),
    term: 'Term 1',
    items: [{ name: '', amount: '' }]
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
        api.get('/main/dashboard/overview/')
      ]);

      setFeeStructures(structuresRes.data);
      setSchoolClasses(classesRes.data);
      
      if (statsRes.data) {
        setStats({
          total_structures: structuresRes.data.length,
          active_structures: structuresRes.data.filter(s => s.is_active).length,
          total_revenue: statsRes.data.total_revenue || 0,
          pending_payments: statsRes.data.pending_payments || 0
        });
      }
    } catch (error) {
      console.error('Error fetching fee data:', error);
      if (error.response?.status !== 403) {
        setError('Failed to load fee management data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // New: Improved Fee Structure Creation with Modal
  const handleCreateFeeStructure = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!feeStructureForm.school_class) {
      setFormError('Please select a class');
      return;
    }

    const validItems = feeStructureForm.items.filter(item => item.name && item.amount);
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
        items: validItems.map(item => ({ 
          name: item.name, 
          amount: parseFloat(item.amount) 
        }))
      };

      const response = await api.post('/main/fee_structure/', feeStructureData);
      
      // Add the new structure to the list
      setFeeStructures(prev => [response.data, ...prev]);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        total_structures: prev.total_structures + 1,
        active_structures: prev.active_structures + 1
      }));

      // Show success and close modal
      alert('Fee structure created successfully!');
      setShowFeeStructureModal(false);
      resetFeeStructureForm();
      
    } catch (error) {
      console.error('Error creating fee structure:', error);
      let errorMessage = 'Failed to create fee structure. Please try again.';
      
      if (error.response?.data) {
        // Handle specific error cases
        if (typeof error.response.data === 'object') {
          errorMessage = Object.values(error.response.data).flat().join(', ');
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
        
        // Check for duplicate fee structure
        if (errorMessage.toLowerCase().includes('already exists') || 
            errorMessage.toLowerCase().includes('duplicate')) {
          errorMessage = 'A fee structure already exists for this class, academic year, and term combination.';
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
      setFeeStructures(prev => 
        prev.map(structure => 
          structure.id === id ? response.data : structure
        )
      );
      setShowFeeStructureModal(false);
      setEditingStructure(null);
      await fetchFeeData();
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating fee structure:', error);
      return { 
        success: false, 
        error: error.response?.data || 'Failed to update fee structure' 
      };
    }
  };

  const handleDeleteStructure = async (id) => {
    if (!window.confirm('Are you sure you want to delete this fee structure? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/main/fee_structure/${id}/`);
      setFeeStructures(prev => prev.filter(structure => structure.id !== id));
      setStats(prev => ({
        ...prev,
        total_structures: prev.total_structures - 1,
        active_structures: prev.active_structures - 1
      }));
      return { success: true };
    } catch (error) {
      console.error('Error deleting fee structure:', error);
      alert('Failed to delete fee structure. Please try again.');
      return { success: false };
    }
  };

  const handleToggleActive = async (id, isActive) => {
    try {
      const response = await api.patch(`/main/fee_structure/${id}/`, { 
        is_active: !isActive 
      });
      setFeeStructures(prev => 
        prev.map(structure => 
          structure.id === id ? response.data : structure
        )
      );
      
      // Update active structures count
      setStats(prev => ({
        ...prev,
        active_structures: isActive ? prev.active_structures - 1 : prev.active_structures + 1
      }));
      
      return { success: true };
    } catch (error) {
      console.error('Error toggling fee structure:', error);
      alert('Failed to update fee structure status.');
      return { success: false };
    }
  };

  const handleEdit = (structure) => {
    setEditingStructure(structure);
    setShowFeeStructureModal(true);
    // Pre-fill form for editing
    setFeeStructureForm({
      school_class: structure.school_class?.id || structure.school_class,
      academic_year: structure.academic_year,
      term: structure.term,
      items: structure.items?.map(item => ({ 
        name: item.name, 
        amount: item.amount.toString() 
      })) || [{ name: '', amount: '' }]
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
      items: [{ name: '', amount: '' }]
    });
  };

  // Fee Structure Form Helpers (from QuickActions)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading fee management data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fee Management</h1>
            <p className="text-gray-600 mt-1">
              Manage fee structures, track payments, and analyze financial performance
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={fetchFeeData}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
            <button 
              onClick={() => setShowFeeStructureModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Fee Structure</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Structures</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_structures}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Structures</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active_structures}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">GH₵{stats.total_revenue?.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Payments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending_payments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {[
              { id: 'structures', name: 'Fee Structures', icon: '📊' },
              { id: 'analytics', name: 'Analytics', icon: '📈' },
              { id: 'bulk-actions', name: 'Bulk Actions', icon: '⚡' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-4 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Fee Structures Tab */}
          {activeTab === 'structures' && (
            <FeeStructuresList
              structures={feeStructures}
              onEdit={handleEdit}
              onDelete={handleDeleteStructure}
              onToggleActive={handleToggleActive}
              onRefresh={fetchFeeData}
            />
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <FeeAnalytics
              structures={feeStructures}
              stats={stats}
            />
          )}

          {/* Bulk Actions Tab */}
          {activeTab === 'bulk-actions' && (
            <BulkFeeActions
              structures={feeStructures}
              onStructuresUpdate={fetchFeeData}
            />
          )}
        </div>
      </div>

      {/* Fee Structure Creation Modal */}
      {showFeeStructureModal && (
        <Modal 
          title={editingStructure ? "Edit Fee Structure" : "Create Fee Structure"} 
          onClose={handleCloseForm}
        >
          <form onSubmit={handleCreateFeeStructure} className="space-y-4">
            {/* Form Error Display */}
            {formError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-800 text-sm">{formError}</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
              <select
                required
                value={feeStructureForm.school_class}
                onChange={(e) => setFeeStructureForm(prev => ({ ...prev, school_class: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
                <select
                  value={feeStructureForm.term}
                  onChange={(e) => setFeeStructureForm(prev => ({ ...prev, term: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Term 1">Term 1</option>
                  <option value="Term 2">Term 2</option>
                  <option value="Term 3">Term 3</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Fee Items *</label>
                <button
                  type="button"
                  onClick={addFeeItemField}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
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
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      value={item.amount}
                      onChange={(e) => updateFeeItemField(index, 'amount', e.target.value)}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                onClick={handleCloseForm}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {formLoading ? 'Creating...' : editingStructure ? 'Update Structure' : 'Create Structure'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeManagement;
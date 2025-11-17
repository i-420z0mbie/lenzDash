// src/pages/FeeManagement.jsx
import React, { useState, useEffect } from 'react';
import api from '../api';
import FeeStructuresList from '../components/fees/FeeStructuresList';
import FeeStructureForm from '../components/fees/FeeStructureForm';
import FeeAnalytics from '../components/fees/FeeAnalytics';
import BulkFeeActions from '../components/fees/BulkFeeActions';

const FeeManagement = () => {
  const [feeStructures, setFeeStructures] = useState([]);
  const [schoolClasses, setSchoolClasses] = useState([]);
  const [activeTab, setActiveTab] = useState('structures');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingStructure, setEditingStructure] = useState(null);
  const [stats, setStats] = useState({
    total_structures: 0,
    active_structures: 0,
    total_revenue: 0,
    pending_payments: 0
  });

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
        api.get('/main/dashboard/overview/') // Reuse dashboard stats
      ]);

      setFeeStructures(structuresRes.data);
      setSchoolClasses(classesRes.data);
      
      // Extract fee-related stats from overview
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

  const handleCreateStructure = async (formData) => {
    try {
      const response = await api.post('/main/fee_structure/', formData);
      setFeeStructures(prev => [response.data, ...prev]);
      setShowForm(false);
      await fetchFeeData(); // Refresh stats
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error creating fee structure:', error);
      return { 
        success: false, 
        error: error.response?.data || 'Failed to create fee structure' 
      };
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
      setShowForm(false);
      setEditingStructure(null);
      await fetchFeeData(); // Refresh stats
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
      await fetchFeeData(); // Refresh stats
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
      await fetchFeeData(); // Refresh stats
      return { success: true };
    } catch (error) {
      console.error('Error toggling fee structure:', error);
      alert('Failed to update fee structure status.');
      return { success: false };
    }
  };

  const handleEdit = (structure) => {
    setEditingStructure(structure);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingStructure(null);
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
              onClick={() => setShowForm(true)}
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
              <p className="text-2xl font-bold text-gray-900">GH₵{stats.total_revenue}</p>
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

      {/* Fee Structure Form Modal */}
      {showForm && (
        <FeeStructureForm
          structure={editingStructure}
          schoolClasses={schoolClasses}
          onSubmit={editingStructure ? 
            (data) => handleUpdateStructure(editingStructure.id, data) : 
            handleCreateStructure
          }
          onClose={handleCloseForm}
        />
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
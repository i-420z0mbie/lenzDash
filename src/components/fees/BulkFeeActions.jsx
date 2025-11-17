// src/components/fees/BulkFeeActions.jsx
import React, { useState } from 'react';
import api from '../../api';

const BulkFeeActions = ({ structures, onStructuresUpdate }) => {
  const [activeAction, setActiveAction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedStructures, setSelectedStructures] = useState([]);
  const [csvFile, setCsvFile] = useState(null);

  const handleBulkActivate = async () => {
    if (!window.confirm(`Activate ${selectedStructures.length} fee structures?`)) return;

    setLoading(true);
    try {
      const promises = selectedStructures.map(id => 
        api.patch(`/main/fee_structure/${id}/`, { is_active: true })
      );
      await Promise.all(promises);
      await onStructuresUpdate();
      setSelectedStructures([]);
      setActiveAction(null);
      alert(`Successfully activated ${selectedStructures.length} structures`);
    } catch (error) {
      console.error('Error activating structures:', error);
      alert('Error activating structures. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDeactivate = async () => {
    if (!window.confirm(`Deactivate ${selectedStructures.length} fee structures?`)) return;

    setLoading(true);
    try {
      const promises = selectedStructures.map(id => 
        api.patch(`/main/fee_structure/${id}/`, { is_active: false })
      );
      await Promise.all(promises);
      await onStructuresUpdate();
      setSelectedStructures([]);
      setActiveAction(null);
      alert(`Successfully deactivated ${selectedStructures.length} structures`);
    } catch (error) {
      console.error('Error deactivating structures:', error);
      alert('Error deactivating structures. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Permanently delete ${selectedStructures.length} fee structures? This action cannot be undone.`)) return;

    setLoading(true);
    try {
      const promises = selectedStructures.map(id => 
        api.delete(`/main/fee_structure/${id}/`)
      );
      await Promise.all(promises);
      await onStructuresUpdate();
      setSelectedStructures([]);
      setActiveAction(null);
      alert(`Successfully deleted ${selectedStructures.length} structures`);
    } catch (error) {
      console.error('Error deleting structures:', error);
      alert('Error deleting structures. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedStructures.length === structures.length) {
      setSelectedStructures([]);
    } else {
      setSelectedStructures(structures.map(s => s.id));
    }
  };

  const toggleSelectStructure = (id) => {
    setSelectedStructures(prev => 
      prev.includes(id) 
        ? prev.filter(structureId => structureId !== id)
        : [...prev, id]
    );
  };

  // Fixed total value calculation - properly parse amounts
  const calculateTotalValue = () => {
    return structures.reduce((total, structure) => {
      // Ensure we're working with numbers, not strings
      const structureTotal = parseFloat(structure.total_amount) || 0;
      return total + structureTotal;
    }, 0);
  };

  return (
    <div className="space-y-6">
      {/* Bulk Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-green-500 hover:bg-green-50 transition-all cursor-pointer">
          <div className="text-green-600 text-2xl mb-2">✅</div>
          <h3 className="font-semibold text-gray-900 mb-2">Bulk Activate</h3>
          <p className="text-gray-600 text-sm mb-3">Activate multiple fee structures at once</p>
          <button
            onClick={() => setActiveAction('activate')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            Activate Structures
          </button>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-orange-500 hover:bg-orange-50 transition-all cursor-pointer">
          <div className="text-orange-600 text-2xl mb-2">⏸️</div>
          <h3 className="font-semibold text-gray-900 mb-2">Bulk Deactivate</h3>
          <p className="text-gray-600 text-sm mb-3">Deactivate multiple fee structures at once</p>
          <button
            onClick={() => setActiveAction('deactivate')}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
          >
            Deactivate Structures
          </button>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-red-500 hover:bg-red-50 transition-all cursor-pointer">
          <div className="text-red-600 text-2xl mb-2">🗑️</div>
          <h3 className="font-semibold text-gray-900 mb-2">Bulk Delete</h3>
          <p className="text-gray-600 text-sm mb-3">Permanently delete multiple structures</p>
          <button
            onClick={() => setActiveAction('delete')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            Delete Structures
          </button>
        </div>
      </div>

      {/* Structure Selection */}
      {(activeAction === 'activate' || activeAction === 'deactivate' || activeAction === 'delete') && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Select Structures to {activeAction === 'activate' ? 'Activate' : activeAction === 'deactivate' ? 'Deactivate' : 'Delete'}
            </h3>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {selectedStructures.length} of {structures.length} selected
              </span>
              <button
                onClick={toggleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {selectedStructures.length === structures.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
            {structures.map(structure => (
              <div
                key={structure.id}
                className={`flex items-center p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                  selectedStructures.includes(structure.id) ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedStructures.includes(structure.id)}
                  onChange={() => toggleSelectStructure(structure.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {structure.school_class?.name || 'Unknown Class'}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      structure.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {structure.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {structure.academic_year} • {structure.term} • ${parseFloat(structure.total_amount || 0).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                setActiveAction(null);
                setSelectedStructures([]);
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (activeAction === 'activate') handleBulkActivate();
                else if (activeAction === 'deactivate') handleBulkDeactivate();
                else if (activeAction === 'delete') handleBulkDelete();
              }}
              disabled={loading || selectedStructures.length === 0}
              className={`px-4 py-2 text-white rounded-lg transition-colors font-medium disabled:opacity-50 ${
                activeAction === 'activate' 
                  ? 'bg-green-600 hover:bg-green-700'
                  : activeAction === 'deactivate'
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {loading ? 'Processing...' : `${activeAction === 'activate' ? 'Activate' : activeAction === 'deactivate' ? 'Deactivate' : 'Delete'} ${selectedStructures.length} Structures`}
            </button>
          </div>
        </div>
      )}

      {/* Quick Stats - Fixed total value calculation */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">{structures.length}</div>
            <div className="text-gray-600 text-sm">Total Structures</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {structures.filter(s => s.is_active).length}
            </div>
            <div className="text-gray-600 text-sm">Active</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {structures.filter(s => !s.is_active).length}
            </div>
            <div className="text-gray-600 text-sm">Inactive</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              GH₵{calculateTotalValue().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-gray-600 text-sm">Total Value</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkFeeActions;
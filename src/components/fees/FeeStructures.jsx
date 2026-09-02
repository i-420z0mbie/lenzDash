// src/components/fees/FeeStructures.jsx
import React, { useState, useEffect } from 'react';
import api from '../../api';
import FeeStructureForm from './FeeStructureForm';
import AddFeeItemsForm from './AddFeeItemsForm';
import BulkFeeActions from './BulkFeeActions';

const FeeStructures = () => {
  const [feeStructures, setFeeStructures] = useState([]);
  const [schoolClasses, setSchoolClasses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showAddItemsForm, setShowAddItemsForm] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch fee structures
  const fetchFeeStructures = async () => {
    try {
      const response = await api.get('/main/fee_structure/');
      setFeeStructures(response.data);
    } catch (error) {
      console.error('Error fetching fee structures:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch school classes
  const fetchSchoolClasses = async () => {
    try {
      const response = await api.get('/main/school_classes/');
      setSchoolClasses(response.data);
    } catch (error) {
      console.error('Error fetching school classes:', error);
    }
  };

  useEffect(() => {
    fetchFeeStructures();
    fetchSchoolClasses();
  }, []);

  // Handle fee structure submission (create or update)
  const handleSubmit = async (formData) => {
    try {
      let response;
      
      if (selectedStructure) {
        // Editing existing structure - UPDATE all items
        response = await api.put(`/main/fee_structure/${selectedStructure.id}/`, formData);
      } else {
        // Create new structure
        response = await api.post('/main/fee_structure/', formData);
      }
      
      // Refresh the list
      await fetchFeeStructures();
      setShowForm(false);
      setSelectedStructure(null);
      return { success: true };
    } catch (error) {
      console.error('Error saving fee structure:', error);
      let errorMessage = 'Failed to save fee structure';
      
      if (error.response?.data) {
        if (typeof error.response.data === 'object') {
          errorMessage = error.response.data;
        } else {
          errorMessage = error.response.data.detail || error.response.data;
        }
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  // Handle adding items to existing structure (APPEND items)
  const handleAddItems = async (structureId, itemsData) => {
    try {
      // First get the current structure
      const currentResponse = await api.get(`/main/fee_structure/${structureId}/`);
      const currentStructure = currentResponse.data;
      
      // Combine existing items with new items
      const updatedItems = [
        ...currentStructure.items,
        ...itemsData.items
      ];
      
      // Update the structure with combined items
      const updateData = {
        school_class: currentStructure.school_class.id,
        academic_year: currentStructure.academic_year,
        term: currentStructure.term,
        is_active: currentStructure.is_active,
        items: updatedItems
      };
      
      await api.put(`/main/fee_structure/${structureId}/`, updateData);
      
      // Refresh the list
      await fetchFeeStructures();
      setShowAddItemsForm(false);
      setSelectedStructure(null);
      return { success: true };
    } catch (error) {
      console.error('Error adding fee items:', error);
      let errorMessage = 'Failed to add fee items';
      
      if (error.response?.data) {
        if (typeof error.response.data === 'object') {
          errorMessage = error.response.data;
        } else {
          errorMessage = error.response.data.detail || error.response.data;
        }
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const handleEdit = (structure) => {
    setSelectedStructure(structure);
    setShowForm(true);
  };

  const handleAddItemsClick = (structure) => {
    setSelectedStructure(structure);
    setShowAddItemsForm(true);
  };

  const handleCreate = () => {
    setSelectedStructure(null);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this fee structure? This will also delete all fee items.')) {
      try {
        await api.delete(`/main/fee_structure/${id}/`);
        await fetchFeeStructures();
      } catch (error) {
        console.error('Error deleting fee structure:', error);
        alert('Error deleting fee structure');
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Fee Structures</h1>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Create Fee Structure
        </button>
      </div>

      {/* Bulk Actions */}
      <BulkFeeActions 
        structures={feeStructures} 
        onStructuresUpdate={fetchFeeStructures} 
      />

      {/* Fee Structures List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Academic Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Term
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {feeStructures.map((structure) => (
                <tr key={structure.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {structure.school_class?.name || 'Unknown Class'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{structure.academic_year}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{structure.term}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      GH₵{parseFloat(structure.total_amount || 0).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {structure.items?.length || 0} items
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      structure.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {structure.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(structure)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleAddItemsClick(structure)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Add Items
                    </button>
                    <button
                      onClick={() => handleDelete(structure.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fee Structure Form Modal */}
      {showForm && (
        <FeeStructureForm
          structure={selectedStructure}
          schoolClasses={schoolClasses}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowForm(false);
            setSelectedStructure(null);
          }}
          existingStructures={feeStructures}
        />
      )}

      {/* Add Fee Items Form Modal */}
      {showAddItemsForm && selectedStructure && (
        <AddFeeItemsForm
          structure={selectedStructure}
          onSubmit={handleAddItems}
          onClose={() => {
            setShowAddItemsForm(false);
            setSelectedStructure(null);
          }}
        />
      )}
    </div>
  );
};

export default FeeStructures;
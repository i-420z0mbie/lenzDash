// src/components/fees/AddFeeItemsForm.jsx
import React, { useState } from 'react';

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {children}
    </div>
  </div>
);

const AddFeeItemsForm = ({ structure, onSubmit, onClose }) => {
  const [items, setItems] = useState([{ name: '', amount: '' }]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    // Validate fee items
    items.forEach((item, index) => {
      if (!item.name.trim()) {
        newErrors[`item_${index}_name`] = 'Item name is required';
      }
      if (!item.amount || parseFloat(item.amount) <= 0) {
        newErrors[`item_${index}_amount`] = 'Valid amount is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    // Prepare data for API - ensure amounts are numbers
    const submitData = {
      items: items
        .filter(item => item.name && item.amount)
        .map(item => ({
          ...item,
          amount: parseFloat(item.amount)
        }))
    };

    const result = await onSubmit(structure.id, submitData);
    
    if (!result.success) {
      // Handle API errors
      if (result.error) {
        if (typeof result.error === 'object') {
          setErrors(result.error);
        } else {
          setErrors({ general: result.error });
        }
      }
    } else {
      onClose();
    }
    
    setLoading(false);
  };

  const addFeeItem = () => {
    setItems(prev => [...prev, { name: '', amount: '' }]);
  };

  const updateFeeItem = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;
    setItems(updatedItems);
  };

  const removeFeeItem = (index) => {
    if (items.length > 1) {
      const updatedItems = items.filter((_, i) => i !== index);
      setItems(updatedItems);
    }
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => {
      return total + (parseFloat(item.amount) || 0);
    }, 0);
  };

  return (
    <Modal 
      title={`Add Fee Items to ${structure.school_class?.name} - ${structure.academic_year} ${structure.term}`} 
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{errors.general}</p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-blue-800 text-sm">
              This will add new fee items to the existing structure. Existing items will not be affected.
            </p>
          </div>
        </div>

        {/* Fee Items Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">
              New Fee Items *
            </label>
            <button
              type="button"
              onClick={addFeeItem}
              className="text-sm bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Add Item
            </button>
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {items.map((item, index) => (
              <div key={index} className="flex gap-3 items-start">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Item name (e.g., Tuition, Books, etc.)"
                    value={item.name}
                    onChange={(e) => updateFeeItem(index, 'name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors[`item_${index}_name`] ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors[`item_${index}_name`] && (
                    <p className="text-red-600 text-sm mt-1">{errors[`item_${index}_name`]}</p>
                  )}
                </div>
                
                <div className="w-32">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Amount"
                    value={item.amount}
                    onChange={(e) => updateFeeItem(index, 'amount', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors[`item_${index}_amount`] ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors[`item_${index}_amount`] && (
                    <p className="text-red-600 text-sm mt-1">{errors[`item_${index}_amount`]}</p>
                  )}
                </div>
                
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFeeItem(index)}
                    className="p-2 text-red-600 hover:text-red-700 transition-colors mt-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Total Amount */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Additional Amount:</span>
              <span className="text-xl font-bold text-gray-900">
                + GH₵{calculateTotal().toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
              <span className="font-medium text-gray-700">New Total:</span>
              <span className="text-xl font-bold text-green-600">
                GH₵{(parseFloat(structure.total_amount || 0) + calculateTotal()).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
          >
            {loading ? 'Adding Items...' : 'Add Items to Structure'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddFeeItemsForm;
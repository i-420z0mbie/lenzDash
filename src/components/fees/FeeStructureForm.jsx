// src/components/fees/FeeStructureForm.jsx
import React, { useState, useEffect } from 'react';
import api from '../../api';

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

const FeeStructureForm = ({ structure, schoolClasses, onSubmit, onClose, existingStructures = [] }) => {
  const [formData, setFormData] = useState({
    school_class: '',
    academic_year: new Date().getFullYear().toString(),
    term: 'Term 1',
    items: [{ name: '', amount: '' }],
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [existingStructure, setExistingStructure] = useState(null);

  useEffect(() => {
    if (structure) {
      setFormData({
        school_class: structure.school_class?.id || '',
        academic_year: structure.academic_year,
        term: structure.term,
        items: structure.items?.length > 0 
          ? structure.items.map(item => ({ name: item.name, amount: item.amount }))
          : [{ name: '', amount: '' }],
        is_active: structure.is_active
      });
    }
  }, [structure]);

  // Check for existing structure when form data changes
  useEffect(() => {
    if (formData.school_class && formData.academic_year && formData.term && !structure) {
      const existing = existingStructures.find(s => 
        s.school_class?.id === parseInt(formData.school_class) &&
        s.academic_year === formData.academic_year &&
        s.term === formData.term
      );
      setExistingStructure(existing);
    } else {
      setExistingStructure(null);
    }
  }, [formData.school_class, formData.academic_year, formData.term, existingStructures, structure]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.school_class) {
      newErrors.school_class = 'Class is required';
    }

    if (!formData.academic_year) {
      newErrors.academic_year = 'Academic year is required';
    }

    if (!formData.term) {
      newErrors.term = 'Term is required';
    }

    // Validate fee items
    formData.items.forEach((item, index) => {
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

    // If trying to create a duplicate structure, show error
    if (existingStructure && !structure) {
      setErrors({ 
        general: `A fee structure already exists for this class, academic year, and term. Please edit the existing structure instead.` 
      });
      return;
    }

    setLoading(true);
    
    // Prepare data for API - ensure amounts are numbers
    const submitData = {
      ...formData,
      items: formData.items
        .filter(item => item.name && item.amount)
        .map(item => ({
          ...item,
          amount: parseFloat(item.amount)
        }))
    };

    const result = await onSubmit(submitData);
    
    if (!result.success) {
      // Handle API errors
      if (result.error) {
        if (typeof result.error === 'object') {
          setErrors(result.error);
        } else {
          setErrors({ general: result.error });
        }
      }
    }
    
    setLoading(false);
  };

  const addFeeItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', amount: '' }]
    }));
  };

  const updateFeeItem = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const removeFeeItem = (index) => {
    if (formData.items.length > 1) {
      const updatedItems = formData.items.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, items: updatedItems }));
    }
  };

  const calculateTotal = () => {
    return formData.items.reduce((total, item) => {
      return total + (parseFloat(item.amount) || 0);
    }, 0);
  };

  return (
    <Modal 
      title={structure ? 'Edit Fee Structure' : 'Create New Fee Structure'} 
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{errors.general}</p>
          </div>
        )}

        {/* Existing Structure Warning */}
        {existingStructure && !structure && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-yellow-800 text-sm">
                A fee structure already exists for {existingStructure.school_class?.name} - {existingStructure.academic_year} {existingStructure.term}. 
                You cannot create duplicate fee structures. Please edit the existing structure to add more fee items.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Class *
            </label>
            <select
              value={formData.school_class}
              onChange={(e) => setFormData(prev => ({ ...prev, school_class: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.school_class ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={!!structure} // Disable when editing existing structure
            >
              <option value="">Select Class</option>
              {schoolClasses.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
            {errors.school_class && (
              <p className="text-red-600 text-sm mt-1">{errors.school_class}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Academic Year *
            </label>
            <input
              type="text"
              value={formData.academic_year}
              onChange={(e) => setFormData(prev => ({ ...prev, academic_year: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.academic_year ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., 2024"
              disabled={!!structure} // Disable when editing existing structure
            />
            {errors.academic_year && (
              <p className="text-red-600 text-sm mt-1">{errors.academic_year}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Term *
            </label>
            <select
              value={formData.term}
              onChange={(e) => setFormData(prev => ({ ...prev, term: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.term ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={!!structure} // Disable when editing existing structure
            >
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </select>
            {errors.term && (
              <p className="text-red-600 text-sm mt-1">{errors.term}</p>
            )}
          </div>

          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Active Structure</span>
            </label>
          </div>
        </div>

        {/* Fee Items Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Fee Items *
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
            {formData.items.map((item, index) => (
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
                
                {formData.items.length > 1 && (
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
              <span className="font-medium text-gray-700">Total Amount:</span>
              <span className="text-xl font-bold text-gray-900">
                GH₵{calculateTotal().toFixed(2)}
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
            disabled={loading || (existingStructure && !structure)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
          >
            {loading ? 'Saving...' : (structure ? 'Update Structure' : 'Create Structure')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default FeeStructureForm;
// src/components/Dashboard/FeeStructuresOverview.jsx
import React from 'react';

const FeeStructuresOverview = ({ data }) => {
  // Mock data - replace with actual API call
  const feeStructures = [
    { class: 'Grade 1', term: 'Term 1', totalAmount: 2500, active: true },
    { class: 'Grade 2', term: 'Term 1', totalAmount: 2800, active: true },
    { class: 'Grade 3', term: 'Term 1', totalAmount: 3000, active: true },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Active Fee Structures</h3>
        <span className="text-sm text-gray-500">{feeStructures.length} active</span>
      </div>
      
      <div className="space-y-4">
        {feeStructures.map((structure, index) => (
          <div key={index} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors duration-200">
            <div>
              <p className="font-medium text-gray-900">{structure.class}</p>
              <p className="text-sm text-gray-500">{structure.term}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">GH₵ {structure.totalAmount}</p>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>
          </div>
        ))}
        
        {feeStructures.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No active fee structures
          </div>
        )}
      </div>
    </div>
  );
};

export default FeeStructuresOverview;
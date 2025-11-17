// src/components/dashboard/ActiveFeeStructures.jsx
import React, { useState } from 'react';

const ActiveFeeStructures = ({ structures }) => {
  const [showAll, setShowAll] = useState(false);
  const displayStructures = showAll ? structures : structures.slice(0, 3);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Active Fee Structures</h2>
        {structures.length > 3 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showAll ? 'Show Less' : `Show All (${structures.length})`}
          </button>
        )}
      </div>

      <div className="space-y-4">
        {displayStructures.map((structure) => (
          <div key={structure.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">
                  {structure.school_class?.name || 'Class Not Found'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {structure.academic_year} • {structure.term}
                </p>
                <div className="mt-2">
                  <span className="text-sm font-medium text-gray-700">
                    Total: GH₵{structure.total_amount || 0}
                  </span>
                  <span className="text-sm text-gray-500 ml-4">
                    {structure.items?.length || 0} fee items
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>
            
            {/* Fee Items */}
            {structure.items && structure.items.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Fee Items:</h4>
                <div className="space-y-1">
                  {structure.items.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.name}</span>
                      <span className="text-gray-900 font-medium">GH₵{item.amount}</span>
                    </div>
                  ))}
                  {structure.items.length > 3 && (
                    <div className="text-sm text-gray-500">
                      +{structure.items.length - 3} more items
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {structures.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-gray-600">No active fee structures</p>
        </div>
      )}
    </div>
  );
};

export default ActiveFeeStructures;
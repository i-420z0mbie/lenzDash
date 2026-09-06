import React, { useState } from 'react';

const PaymentFilters = ({ filters, onFilterChange, onClearFilters }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
  };

  const handleChange = (key, value) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={localFilters.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="successful">Successful</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {/* Student Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Student
          </label>
          <input
            type="text"
            value={localFilters.student}
            onChange={(e) => handleChange('student', e.target.value)}
            placeholder="Search student..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Date From */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From Date
          </label>
          <input
            type="date"
            value={localFilters.date_from}
            onChange={(e) => handleChange('date_from', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Date To */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To Date
          </label>
          <input
            type="date"
            value={localFilters.date_to}
            onChange={(e) => handleChange('date_to', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Filter Actions */}
      <div className="flex justify-end space-x-3 mt-4">
        <button
          onClick={onClearFilters}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Clear
        </button>
        <button
          onClick={handleApplyFilters}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default PaymentFilters;

// src/components/fees/FeeStructuresList.jsx
import React, { useState, useMemo } from 'react';

const FeeStructuresList = ({ structures, onEdit, onDelete, onToggleActive, onRefresh }) => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('class');

  const filteredStructures = useMemo(() => {
    let filtered = structures;

    // Filter by status
    if (filter === 'active') {
      filtered = filtered.filter(s => s.is_active);
    } else if (filter === 'inactive') {
      filtered = filtered.filter(s => !s.is_active);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.school_class?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.academic_year?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.term?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort structures
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'class':
          return (a.school_class?.name || '').localeCompare(b.school_class?.name || '');
        case 'year':
          return b.academic_year.localeCompare(a.academic_year);
        case 'amount':
          return (b.total_amount || 0) - (a.total_amount || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [structures, filter, searchTerm, sortBy]);

  const getStatusBadge = (isActive) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      isActive 
        ? 'bg-green-100 text-green-800' 
        : 'bg-gray-100 text-gray-800'
    }`}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );

  if (structures.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Fee Structures</h3>
        <p className="text-gray-600 mb-4">Get started by creating your first fee structure.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-wrap gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="all">All Structures</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="class">Sort by Class</option>
            <option value="year">Sort by Year</option>
            <option value="amount">Sort by Amount</option>
          </select>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search structures..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-64"
          />
          <button
            onClick={onRefresh}
            className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ↻
          </button>
        </div>
      </div>

      {/* Structures Grid */}
      <div className="grid gap-4">
        {filteredStructures.map((structure) => (
          <div key={structure.id} className="bg-gray-50 rounded-xl border border-gray-200 p-6 hover:border-gray-300 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {structure.school_class?.name || 'Unknown Class'}
                  </h3>
                  {getStatusBadge(structure.is_active)}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                  <div>
                    <span className="font-medium">Academic Year:</span> {structure.academic_year}
                  </div>
                  <div>
                    <span className="font-medium">Term:</span> {structure.term}
                  </div>
                  <div>
                    <span className="font-medium">Total Amount:</span> 
                    <span className="font-semibold text-gray-900 ml-1">
                      GH₵{structure.total_amount || 0}
                    </span>
                  </div>
                </div>

                {/* Fee Items */}
                {structure.items && structure.items.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-medium text-gray-700 mb-3">Fee Breakdown:</h4>
                    <div className="grid gap-2">
                      {structure.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center py-2 px-3 bg-white rounded-lg border border-gray-100">
                          <span className="text-gray-700">{item.name}</span>
                          <span className="font-semibold text-gray-900">GH₵{item.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => onToggleActive(structure.id, structure.is_active)}
                  className={`p-2 rounded-lg transition-colors ${
                    structure.is_active
                      ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                      : 'bg-green-100 text-green-600 hover:bg-green-200'
                  }`}
                  title={structure.is_active ? 'Deactivate' : 'Activate'}
                >
                  {structure.is_active ? '⏸️' : '▶️'}
                </button>
                
                <button
                  onClick={() => onEdit(structure)}
                  className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                  title="Edit"
                >
                  ✏️
                </button>
                
                <button
                  onClick={() => onDelete(structure.id)}
                  className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty Filter State */}
      {filteredStructures.length === 0 && structures.length > 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No matching structures</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
};

export default FeeStructuresList;
// src/components/dashboard/OutstandingStudents.jsx
import React, { useState } from 'react';

const OutstandingStudents = ({ students }) => {
  const [showAll, setShowAll] = useState(false);
  const displayStudents = showAll ? students : students.slice(0, 5);

  // Calculate summary statistics
  const totalOutstanding = students.reduce((sum, student) => sum + parseFloat(student.total_balance || 0), 0);
  const averageBalance = students.length > 0 ? totalOutstanding / students.length : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Outstanding Balances</h2>
          <p className="text-sm text-gray-600 mt-1">
            {students.length} students with outstanding fees
          </p>
        </div>
        {students.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showAll ? 'Show Less' : `Show All (${students.length})`}
          </button>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-sm text-blue-600 font-medium">Total Outstanding</p>
          <p className="text-lg font-bold text-blue-900">GH₵{totalOutstanding.toFixed(2)}</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-3">
          <p className="text-sm text-orange-600 font-medium">Avg. per Student</p>
          <p className="text-lg font-bold text-orange-900">GH₵{averageBalance.toFixed(2)}</p>
        </div>
      </div>

      {/* Students List */}
      <div className="space-y-3">
        {displayStudents.map((student) => {
          // Debug log to see what data we're receiving
          console.log('Student data:', student);
          
          return (
            <div key={student.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {student.first_name} {student.last_name}
                </h3>
                <p className="text-sm text-gray-600 truncate">
                  {student.student_id} • {student.school_class?.name || 'No Class Assigned'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-red-600">
                  GH₵{parseFloat(student.total_balance || 0).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">Outstanding</p>
              </div>
            </div>
          );
        })}
      </div>

      {students.length === 0 && (
        <div className="text-center py-8">
          <div className="text-green-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-600">No outstanding balances</p>
          <p className="text-sm text-gray-500 mt-1">All fees are paid up to date</p>
        </div>
      )}
    </div>
  );
};

export default OutstandingStudents;
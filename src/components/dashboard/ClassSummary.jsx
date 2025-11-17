// src/components/dashboard/ClassSummary.jsx
// src/components/dashboard/ClassSummary.jsx
import React, { useState } from 'react';

const ClassSummary = ({ data }) => {
  const [expandedClass, setExpandedClass] = useState(null);

  // Debug log to see what data we're receiving
  console.log('Class summary data:', data);

  // If data is already aggregated by class (from your current Django view)
  if (data.length > 0 && data[0].class) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Class Performance</h2>
          <span className="text-sm text-gray-500">
            {data.length} classes
          </span>
        </div>

        <div className="space-y-4">
          {data.map((classData) => {
            const totalDue = parseFloat(classData.total_due || 0);
            const totalPaid = parseFloat(classData.total_paid || 0);
            const totalBalance = parseFloat(classData.total_balance || 0);
            const collectionRate = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;

            return (
              <div key={classData.class} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{classData.class}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Class Fee Summary
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      GH₵{totalPaid.toFixed(2)} / GH₵{totalDue.toFixed(2)}
                    </p>
                    <p className={`text-sm font-medium ${
                      collectionRate >= 80 ? 'text-green-600' : 
                      collectionRate >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {collectionRate.toFixed(1)}% collected
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Total Due</p>
                      <p className="font-semibold text-gray-900">GH₵{totalDue.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Paid</p>
                      <p className="font-semibold text-green-600">GH₵{totalPaid.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Balance</p>
                      <p className={`font-semibold ${totalBalance > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        GH₵{totalBalance.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {data.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 14l9-5-9-5-9 5 9 5z" />
              </svg>
            </div>
            <p className="text-gray-600">No class data available</p>
          </div>
        )}
      </div>
    );
  }

  // Original logic for detailed term-by-term data
  const groupedByClass = data.reduce((acc, item) => {
    const className = item.school_class?.name || 'Unknown Class';
    if (!acc[className]) {
      acc[className] = [];
    }
    acc[className].push(item);
    return acc;
  }, {});

  const toggleClass = (className) => {
    setExpandedClass(expandedClass === className ? null : className);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Class Performance</h2>
        <span className="text-sm text-gray-500">
          {Object.keys(groupedByClass).length} classes
        </span>
      </div>

      <div className="space-y-3">
        {Object.entries(groupedByClass).map(([className, classData]) => {
          const totalStudents = classData.reduce((sum, item) => sum + (item.total_students || 0), 0);
          const totalPaid = classData.reduce((sum, item) => sum + parseFloat(item.total_paid || 0), 0);
          const totalDue = classData.reduce((sum, item) => sum + parseFloat(item.total_due || 0), 0);
          const collectionRate = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;

          return (
            <div key={className} className="border border-gray-200 rounded-lg">
              {/* Class Header */}
              <button
                onClick={() => toggleClass(className)}
                className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors rounded-lg"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{className}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {totalStudents} students • {classData.length} fee structures
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    GH₵{totalPaid.toFixed(2)} / GH₵{totalDue.toFixed(2)}
                  </p>
                  <p className={`text-sm font-medium ${
                    collectionRate >= 80 ? 'text-green-600' : 
                    collectionRate >= 50 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {collectionRate.toFixed(1)}% collected
                  </p>
                </div>
                <svg 
                  className={`w-5 h-5 text-gray-400 transform transition-transform ${
                    expandedClass === className ? 'rotate-180' : ''
                  }`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Expandable Content */}
              {expandedClass === className && (
                <div className="px-4 pb-4 border-t border-gray-200">
                  <div className="mt-4 space-y-3">
                    {classData.map((termData, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {termData.term} {termData.academic_year}
                          </h4>
                          <p className="text-xs text-gray-600">
                            {termData.total_students || 0} students
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            GH₵{parseFloat(termData.total_paid || 0).toFixed(2)} / GH₵{parseFloat(termData.total_due || 0).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-600">
                            Balance: GH₵{(parseFloat(termData.total_due || 0) - parseFloat(termData.total_paid || 0)).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {data.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 14l9-5-9-5-9 5 9 5z" />
            </svg>
          </div>
          <p className="text-gray-600">No class data available</p>
        </div>
      )}
    </div>
  );
};

export default ClassSummary;
// src/components/dashboard/ClassSummary.jsx
import React, { useState, useEffect } from 'react';
import api from '../../api';

const ClassSummary = () => {
  const [expandedClass, setExpandedClass] = useState(null);
  const [classData, setClassData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClassData();
  }, []);

  const fetchClassData = async () => {
    try {
      setLoading(true);
      setError('');
      // This endpoint should return class data filtered by the user's school
      const response = await api.get('/main/class-overview/');
      setClassData(response.data);
    } catch (error) {
      console.error('Error fetching class data:', error);
      setError('Failed to load class data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleClass = (classId) => {
    setExpandedClass(expandedClass === classId ? null : classId);
  };

  // Helper function to get class name consistently
  const getClassName = (classItem) => {
    return classItem.school_class?.name || classItem.name || classItem.class || 'Unknown Class';
  };

  // Helper function to get class ID consistently
  const getClassId = (classItem) => {
    return classItem.id || classItem.school_class?.id || classItem.class;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Class Performance</h2>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading class data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Class Performance</h2>
        </div>
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={fetchClassData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // If data is already aggregated by class (from your current Django view)
  if (classData.length > 0 && (classData[0].name || classData[0].class)) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Class Performance</h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              {classData.length} classes
            </span>
            <button
              onClick={fetchClassData}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {classData.map((classItem) => {
            const totalDue = parseFloat(classItem.total_due || 0);
            const totalPaid = parseFloat(classItem.total_paid || 0);
            const totalBalance = parseFloat(classItem.total_balance || 0);
            const collectionRate = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;
            const className = getClassName(classItem);
            const classId = getClassId(classItem);

            return (
              <div key={classId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{className}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {classItem.total_students || 0} students • Collection Rate: {collectionRate.toFixed(1)}%
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
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          collectionRate >= 80 ? 'bg-green-500' : 
                          collectionRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(collectionRate, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {classData.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 14l9-5-9-5-9 5 9 5z" />
              </svg>
            </div>
            <p className="text-gray-600">No class data available for your school</p>
            <button
              onClick={fetchClassData}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Data
            </button>
          </div>
        )}
      </div>
    );
  }

  // Handle case where data might have term-by-term breakdown (like in ActiveFeeStructures)
  // Group by class first
  const groupedByClass = classData.reduce((acc, item) => {
    const className = getClassName(item);
    const classId = getClassId(item) || className; // Use class name as ID if no ID exists
    
    if (!acc[classId]) {
      acc[classId] = {
        className: className,
        items: []
      };
    }
    acc[classId].items.push(item);
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Class Performance</h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            {Object.keys(groupedByClass).length} classes
          </span>
          <button
            onClick={fetchClassData}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center space-x-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {Object.entries(groupedByClass).map(([classId, classInfo]) => {
          const classItems = classInfo.items;
          const className = classInfo.className;
          
          const totalStudents = classItems.reduce((sum, item) => sum + (item.total_students || 0), 0);
          const totalPaid = classItems.reduce((sum, item) => sum + parseFloat(item.total_paid || 0), 0);
          const totalDue = classItems.reduce((sum, item) => sum + parseFloat(item.total_due || 0), 0);
          const totalBalance = classItems.reduce((sum, item) => sum + parseFloat(item.total_balance || 0), 0);
          const collectionRate = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;

          return (
            <div key={classId} className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              {/* Class Header */}
              <button
                onClick={() => toggleClass(classId)}
                className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors rounded-lg"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{className}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {totalStudents} students • {classItems.length} fee structures
                  </p>
                </div>
                <div className="text-right mr-4">
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
                    expandedClass === classId ? 'rotate-180' : ''
                  }`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Expandable Content */}
              {expandedClass === classId && (
                <div className="px-4 pb-4 border-t border-gray-200">
                  <div className="mt-4 space-y-3">
                    {classItems.map((termData, index) => {
                      const termDue = parseFloat(termData.total_due || 0);
                      const termPaid = parseFloat(termData.total_paid || 0);
                      const termBalance = parseFloat(termData.total_balance || 0);
                      const termCollectionRate = termDue > 0 ? (termPaid / termDue) * 100 : 0;

                      return (
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
                              GH₵{termPaid.toFixed(2)} / GH₵{termDue.toFixed(2)}
                            </p>
                            <p className={`text-xs font-medium ${
                              termCollectionRate >= 80 ? 'text-green-600' : 
                              termCollectionRate >= 50 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {termCollectionRate.toFixed(1)}% collected
                            </p>
                            <p className="text-xs text-gray-600">
                              Balance: GH₵{termBalance.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Class Summary */}
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Class Summary</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-blue-700">Total Students:</span>
                        <span className="font-semibold ml-2">{totalStudents}</span>
                      </div>
                      <div>
                        <span className="text-blue-700">Total Due:</span>
                        <span className="font-semibold ml-2">GH₵{totalDue.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-blue-700">Total Paid:</span>
                        <span className="font-semibold text-green-600 ml-2">GH₵{totalPaid.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-blue-700">Outstanding:</span>
                        <span className="font-semibold text-red-600 ml-2">GH₵{totalBalance.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {classData.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 14l9-5-9-5-9 5 9 5z" />
            </svg>
          </div>
          <p className="text-gray-600">No class data available for your school</p>
          <button
            onClick={fetchClassData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Data
          </button>
        </div>
      )}
    </div>
  );
};

export default ClassSummary;
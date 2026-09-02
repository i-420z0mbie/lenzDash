// src/components/Dashboard/StudentOverview.jsx
import React from 'react';

const StudentOverview = ({ data }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Student Overview by Class</h3>
        <span className="text-sm text-gray-500">Payment status distribution</span>
      </div>
      
      <div className="space-y-4">
        {data.map((classData, index) => {
          const paidPercentage = (classData.paid / classData.count) * 100;
          
          return (
            <div key={index} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors duration-200">
              <div className="flex-1">
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-900">{classData.class}</span>
                  <span className="text-sm text-gray-600">
                    {classData.paid}/{classData.count} paid ({paidPercentage.toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${paidPercentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{classData.paid} paid</span>
                  <span>{classData.unpaid} pending</span>
                </div>
              </div>
            </div>
          );
        })}
        
        {data.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No student data available
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentOverview;
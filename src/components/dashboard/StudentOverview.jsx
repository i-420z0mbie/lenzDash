import React from 'react';

const StudentOverview = ({ data }) => {
  return (
    <div className="border border-stone-200 bg-white">
      <div className="flex items-baseline justify-between px-4 py-3 border-b border-stone-200">
        <h3 className="ledger-display text-base text-stone-800">Students by class</h3>
        <span className="text-xs text-stone-400">Payment status</span>
      </div>

      <div className="divide-y divide-stone-100">
        {data.map((classData, index) => {
          const paidPercentage = classData.count ? (classData.paid / classData.count) * 100 : 0;

          return (
            <div key={index} className="px-4 py-3 hover:bg-stone-50 transition-colors">
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-sm text-stone-800">{classData.class}</span>
                <span className="ledger-mono text-xs text-stone-500 tabular-nums">
                  {classData.paid}/{classData.count} paid · {paidPercentage.toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 bg-stone-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-800 transition-all duration-500"
                  style={{ width: `${paidPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-stone-400 mt-1">
                <span>{classData.paid} paid</span>
                <span>{classData.unpaid} pending</span>
              </div>
            </div>
          );
        })}

        {data.length === 0 && (
          <div className="text-center py-10 px-4">
            <p className="text-sm text-stone-500">No student data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentOverview;
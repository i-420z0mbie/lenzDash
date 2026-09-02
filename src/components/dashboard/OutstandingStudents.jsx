import React, { useState } from 'react';

const OutstandingStudents = ({ students }) => {
  const [showAll, setShowAll] = useState(false);
  const display = showAll ? students : students.slice(0, 5);
  const totalOutstanding = students.reduce((sum, s) => sum + (parseFloat(s.total_balance) || 0), 0);

  return (
    <div className="glass-card rounded-xl p-4 transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-slate-600">⚠️ Outstanding Balances</h3>
        <span className="text-[10px] text-slate-400">{students.length} students</span>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-amber-50 rounded-lg p-2">
          <p className="text-[9px] text-amber-600">Total O/S</p>
          <p className="text-xs font-bold text-amber-800">GH₵ {totalOutstanding.toFixed(2)}</p>
        </div>
        <div className="bg-indigo-50 rounded-lg p-2">
          <p className="text-[9px] text-indigo-600">Avg balance</p>
          <p className="text-xs font-bold text-indigo-800">GH₵ {(totalOutstanding / students.length || 0).toFixed(2)}</p>
        </div>
      </div>
      <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
        {display.map(s => (
          <div key={s.id} className="flex justify-between items-center p-2 rounded-lg border border-white/30 hover:bg-white/40">
            <div>
              <p className="text-xs font-medium">{s.first_name} {s.last_name}</p>
              <p className="text-[9px] text-slate-500">{s.student_id}</p>
            </div>
            <p className="text-xs font-semibold text-rose-600">GH₵ {parseFloat(s.total_balance).toFixed(2)}</p>
          </div>
        ))}
      </div>
      {students.length > 5 && (
        <button onClick={() => setShowAll(!showAll)} className="mt-2 w-full text-center text-[10px] text-indigo-600 hover:underline">
          {showAll ? 'Show less' : `Show all (${students.length})`}
        </button>
      )}
    </div>
  );
};

export default OutstandingStudents;
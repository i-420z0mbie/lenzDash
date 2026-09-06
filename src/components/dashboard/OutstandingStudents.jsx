import React, { useState } from 'react';

const OutstandingStudents = ({ students }) => {
  const [showAll, setShowAll] = useState(false);
  const display = showAll ? students : students.slice(0, 5);
  const totalOutstanding = students.reduce((sum, s) => sum + (parseFloat(s.total_balance) || 0), 0);
  const avgBalance = totalOutstanding / (students.length || 1);

  return (
    <div className="border border-stone-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-stone-700">Outstanding balances</h3>
        <span className="text-xs text-stone-400">{students.length} students</span>
      </div>

      <div className="flex items-center divide-x divide-stone-200 border-b border-stone-200 pb-3 mb-1">
        <div className="pr-4">
          <p className="text-xs text-stone-500">Total</p>
          <p className="ledger-mono text-sm text-amber-800 tabular-nums">GH₵{totalOutstanding.toFixed(2)}</p>
        </div>
        <div className="pl-4">
          <p className="text-xs text-stone-500">Average</p>
          <p className="ledger-mono text-sm text-stone-700 tabular-nums">GH₵{avgBalance.toFixed(2)}</p>
        </div>
      </div>

      <div className="max-h-60 overflow-y-auto">
        {display.map(s => (
          <div key={s.id} className="flex justify-between items-center py-2 border-b border-stone-100 last:border-0">
            <div>
              <p className="text-sm text-stone-800">{s.first_name} {s.last_name}</p>
              <p className="text-xs text-stone-400 ledger-mono">{s.student_id}</p>
            </div>
            <p className="ledger-mono text-sm text-amber-800 tabular-nums">GH₵{parseFloat(s.total_balance).toFixed(2)}</p>
          </div>
        ))}
        {students.length === 0 && (
          <div className="text-center py-6 text-stone-400 text-sm">No outstanding balances</div>
        )}
      </div>

      {students.length > 5 && (
        <button onClick={() => setShowAll(!showAll)} className="mt-2 w-full text-center text-xs text-emerald-900 hover:text-emerald-700 transition-colors">
          {showAll ? 'Show less' : `Show all (${students.length})`}
        </button>
      )}
    </div>
  );
};

export default OutstandingStudents;
import React from 'react';

const ActiveFeeStructures = ({ structures }) => {
  const itemsTotal = (fs) => fs.items?.reduce((sum, item) => sum + Number(item.amount || 0), 0) || 0;
  const total = structures.reduce((sum, fs) => sum + itemsTotal(fs), 0);

  return (
    <div className="border border-stone-200 bg-white">
      <div className="flex items-baseline justify-between px-4 py-3 border-b border-stone-200">
        <h3 className="ledger-display text-base text-stone-800">Active fee structures</h3>
        <span className="ledger-mono text-xs text-stone-400 tabular-nums">{structures.length} active</span>
      </div>

      <div className="divide-y divide-stone-100 max-h-72 overflow-y-auto">
        {structures.map((fs) => (
          <div key={fs.id} className="flex items-center justify-between px-4 py-3 hover:bg-stone-50 transition-colors">
            <div>
              <p className="text-sm text-stone-800">{fs.school_class?.name}</p>
              <p className="text-xs text-stone-500 mt-0.5">
                {fs.academic_year} · {fs.term} · {fs.items?.length || 0} {fs.items?.length === 1 ? 'item' : 'items'}
              </p>
            </div>
            <div className="text-right">
              <p className="ledger-mono text-sm text-emerald-900 tabular-nums">
                GH₵{itemsTotal(fs).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <span className="text-xs text-emerald-700">Active</span>
            </div>
          </div>
        ))}

        {structures.length === 0 && (
          <div className="text-center py-10 px-4">
            <p className="text-sm text-stone-500">No active fee structures</p>
            <p className="text-xs text-stone-400 mt-1">Create one from Quick Actions to start billing a class.</p>
          </div>
        )}
      </div>

      {structures.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-stone-200 bg-stone-50">
          <span className="text-xs text-stone-500">Total billed</span>
          <span className="ledger-mono text-sm text-stone-800 tabular-nums">
            GH₵{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      )}
    </div>
  );
};

export default ActiveFeeStructures;
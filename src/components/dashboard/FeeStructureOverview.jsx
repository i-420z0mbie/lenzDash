import React from 'react';

const FeeStructuresOverview = ({ data }) => {
  const feeStructures = data && data.length ? data : [];

  return (
    <div className="border border-stone-200 bg-white">
      <div className="flex items-baseline justify-between px-4 py-3 border-b border-stone-200">
        <h3 className="ledger-display text-base text-stone-800">Fee structures by class</h3>
        <span className="ledger-mono text-xs text-stone-400 tabular-nums">{feeStructures.length} active</span>
      </div>

      {feeStructures.length > 0 ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-stone-400 border-b border-stone-100">
              <th className="text-left font-normal px-4 py-2">Class</th>
              <th className="text-left font-normal px-4 py-2">Term</th>
              <th className="text-right font-normal px-4 py-2">Amount</th>
              <th className="text-right font-normal px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {feeStructures.map((structure, index) => (
              <tr key={index} className="hover:bg-stone-50 transition-colors">
                <td className="px-4 py-2.5 text-stone-800">{structure.class}</td>
                <td className="px-4 py-2.5 text-stone-500">{structure.term}</td>
                <td className="px-4 py-2.5 text-right ledger-mono text-emerald-900 tabular-nums">
                  GH₵{Number(structure.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span className={`text-xs ${structure.active ? 'text-emerald-700' : 'text-stone-400'}`}>
                    {structure.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="text-center py-10 px-4">
          <p className="text-sm text-stone-500">No active fee structures</p>
        </div>
      )}
    </div>
  );
};

export default FeeStructuresOverview;
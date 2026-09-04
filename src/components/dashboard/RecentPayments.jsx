import React from 'react';

const STATUS_META = {
  successful: { label: 'Successful', dot: 'bg-emerald-700', text: 'text-emerald-800' },
  pending: { label: 'Pending', dot: 'bg-amber-600', text: 'text-amber-800' },
  failed: { label: 'Failed', dot: 'bg-red-800', text: 'text-red-800' },
  refunded: { label: 'Refunded', dot: 'bg-slate-500', text: 'text-slate-600' },
};

const RecentPayments = ({ payments }) => {
  const display = payments.slice(0, 5);

  return (
    <div className="border border-stone-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-stone-700">Recent payments</h3>
        <span className="text-xs text-stone-400">Last {display.length}</span>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {display.map((p, idx) => {
          const meta = STATUS_META[p.status] || STATUS_META.pending;
          return (
            <div key={idx} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
              <div className="min-w-0 pr-3">
                <p className="text-sm text-stone-800 truncate">{p.student}</p>
                <p className="text-xs text-stone-400 truncate">{p.class} · {p.fee_item}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="ledger-mono text-sm text-stone-800 tabular-nums">GH₵{p.total_amount?.toFixed(2)}</p>
                <span className="inline-flex items-center gap-1.5 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`}></span>
                  <span className={`text-xs ${meta.text}`}>{meta.label}</span>
                </span>
              </div>
            </div>
          );
        })}
        {payments.length === 0 && (
          <div className="text-center py-6 text-stone-400 text-sm">No recent payments</div>
        )}
      </div>
    </div>
  );
};

export default RecentPayments;
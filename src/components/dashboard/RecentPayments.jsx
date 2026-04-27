import React from 'react';

const RecentPayments = ({ payments }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'successful': return 'bg-emerald-100 text-emerald-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      default: return 'bg-rose-100 text-rose-700';
    }
  };

  return (
    <div className="glass-card rounded-xl p-4 transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-slate-600">🕒 Recent Payments</h3>
        <span className="text-[10px] text-slate-400">Last 10</span>
      </div>
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {payments.slice(0, 5).map((p, idx) => (
          <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white/40 border border-white/30 hover:bg-white/60 transition">
            <div>
              <p className="text-xs font-medium text-slate-800">{p.student}</p>
              <p className="text-[10px] text-slate-500">{p.class} • {p.fee_item}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-800">GH₵ {p.total_amount?.toFixed(2)}</p>
              <span className={`inline-block px-1.5 py-0.5 rounded-full text-[9px] font-medium ${getStatusColor(p.status)}`}>
                {p.status}
              </span>
            </div>
          </div>
        ))}
        {payments.length === 0 && (
          <div className="text-center py-6 text-slate-400 text-xs">No recent payments</div>
        )}
      </div>
    </div>
  );
};

export default RecentPayments;
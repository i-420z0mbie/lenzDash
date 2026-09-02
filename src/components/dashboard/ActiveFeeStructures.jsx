import React from 'react';

const ActiveFeeStructures = ({ structures }) => {
  return (
    <div className="glass-card rounded-xl p-4 transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-slate-600">📋 Active Fee Structures</h3>
        <span className="text-[10px] text-slate-400">{structures.length} active</span>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {structures.map((fs) => (
          <div key={fs.id} className="p-2 rounded-lg border border-white/30 hover:bg-white/40 transition">
            <div className="flex justify-between items-center">
              <p className="text-xs font-medium">{fs.school_class?.name}</p>
              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] rounded-full">Active</span>
            </div>
            <p className="text-[10px] text-slate-500">{fs.academic_year} • {fs.term}</p>
            <p className="text-[10px] text-slate-500 mt-1">{fs.items?.length || 0} fee items</p>
          </div>
        ))}
        {structures.length === 0 && (
          <div className="text-center py-6 text-slate-400 text-xs">No active fee structures</div>
        )}
      </div>
    </div>
  );
};

export default ActiveFeeStructures;
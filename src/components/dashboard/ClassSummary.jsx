import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ClassSummary = ({ data }) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="glass-card rounded-xl p-4 transition-all hover:shadow-md">
        <h3 className="text-xs font-semibold text-slate-600 mb-2">🏛️ Class Financial Summary</h3>
        <div className="flex items-center justify-center h-[260px] text-slate-400 text-sm">
          No class data available
        </div>
      </div>
    );
  }

  const chartData = data.map(c => ({
    name: c.name && c.name.length > 12 ? c.name.slice(0, 10) + '..' : (c.name || 'Unnamed'),
    Due: c.total_due || 0,
    Paid: c.total_paid || 0,
    Balance: c.total_balance || 0
  }));

  return (
    <div className="glass-card rounded-xl p-4 transition-all hover:shadow-md">
      <h3 className="text-xs font-semibold text-slate-600 mb-2">🏛️ Class Financial Summary</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fontSize: 9 }} />
          <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `GH₵${v.toLocaleString()}`} />
          <Tooltip formatter={v => `GH₵${v.toLocaleString()}`} contentStyle={{ fontSize: 10, borderRadius: 8 }} />
          <Bar dataKey="Due" stackId="a" fill="#94a3b8" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Paid" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Balance" stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ClassSummary;
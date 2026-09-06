import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ClassSummary = ({ data }) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="border border-stone-200 bg-white p-4">
        <h3 className="text-sm font-medium text-stone-700 mb-3">Class financial summary</h3>
        <div className="flex items-center justify-center h-[260px] text-stone-400 text-sm">
          No class data available
        </div>
      </div>
    );
  }

  const chartData = data.map(c => ({
    name: c.name && c.name.length > 12 ? c.name.slice(0, 10) + '…' : (c.name || 'Unnamed'),
    Due: c.total_due || 0,
    Paid: c.total_paid || 0,
    Balance: c.total_balance || 0
  }));

  return (
    <div className="border border-stone-200 bg-white p-4">
      <h3 className="text-sm font-medium text-stone-700 mb-3">Class financial summary</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 6, right: 6, left: -6, bottom: 0 }} barGap={4}>
          <CartesianGrid vertical={false} stroke="#e7e5e4" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#78716c' }} axisLine={{ stroke: '#d6d3d1' }} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#78716c' }} tickFormatter={v => `GH₵${v.toLocaleString()}`} axisLine={false} tickLine={false} width={56} />
          <Tooltip
            cursor={{ fill: '#f5f5f4' }}
            formatter={v => `GH₵${v.toLocaleString()}`}
            contentStyle={{ fontSize: '11px', border: '1px solid #e7e5e4', borderRadius: 0, boxShadow: 'none' }}
          />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
          <Bar dataKey="Due" fill="#a8a29e" radius={[2, 2, 0, 0]} />
          <Bar dataKey="Paid" fill="#047857" radius={[2, 2, 0, 0]} />
          <Bar dataKey="Balance" fill="#b45309" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ClassSummary;
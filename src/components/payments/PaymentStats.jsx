import React from 'react';

const PaymentStats = ({ stats }) => {
  const statCards = [
    {
      title: 'Total Collected',
      value: `GH₵${(stats.total_collected || 0).toLocaleString()}`,
      color: 'bg-green-50 text-green-700 border-green-200',
      icon: '💰'
    },
    {
      title: 'Pending Payments',
      value: stats.pending_count || 0,
      color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      icon: '⏳'
    },
    {
      title: 'Successful Payments',
      value: stats.successful_count || 0,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: '✅'
    },
    {
      title: 'Failed Payments',
      value: stats.failed_count || 0,
      color: 'bg-red-50 text-red-700 border-red-200',
      icon: '❌'
    },
    {
      title: 'Refunded Payments',
      value: stats.refunded_count || 0,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: '↩️'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className={`border rounded-lg p-4 ${stat.color}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-80">{stat.title}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </div>
            <span className="text-2xl">{stat.icon}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PaymentStats;
// src/components/Dashboard/StatsGrid.jsx
import React from 'react';
import { 
  UserGroupIcon, 
  AcademicCapIcon, 
  CurrencyDollarIcon,
  CreditCardIcon 
} from '@heroicons/react/24/outline';

const StatsGrid = ({ stats }) => {
  const statCards = [
    {
      name: 'Total Students',
      value: stats.total_students,
      icon: UserGroupIcon,
      color: 'bg-blue-500',
      change: '+',
      changeType: 'positive'
    },
    {
      name: 'Total Classes',
      value: stats.total_classes,
      icon: AcademicCapIcon,
      color: 'bg-green-500',
      change: '+',
      changeType: 'positive'
    },
    {
      name: 'Total Fees Paid',
      value: `GH₵ ${stats.total_fees_paid?.toLocaleString()}`,
      icon: CurrencyDollarIcon,
      color: 'bg-purple-500',
      change: '+',
      changeType: 'positive'
    },
    {
      name: 'Outstanding Balance',
      value: `GH₵ ${stats.total_balance?.toLocaleString()}`,
      icon: CreditCardIcon,
      color: 'bg-orange-500',
      change: '-',
      changeType: 'negative'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((card) => (
        <div key={card.name} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{card.name}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              <div className={`flex items-center mt-2 text-sm ${
                card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                <span className="font-medium">{card.change}</span>
                <span className="ml-1 text-gray-500">from last month</span>
              </div>
            </div>
            <div className={`${card.color} rounded-xl p-3`}>
              <card.icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsGrid;
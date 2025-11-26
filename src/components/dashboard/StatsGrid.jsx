// src/components/Dashboard/StatsGrid.jsx
import React, { useState, useEffect } from 'react';
import { 
  UserGroupIcon, 
  AcademicCapIcon, 
  CurrencyDollarIcon,
  CreditCardIcon 
} from '@heroicons/react/24/outline';
import api from '../../api';

const StatsGrid = () => {
  const [stats, setStats] = useState({
    total_students: 0,
    total_classes: 0,
    total_fees_paid: 0,
    total_balance: 0,
    students_change: 0,
    classes_change: 0,
    paid_change: 0,
    balance_change: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      setError('');
      // Use the new dashboard stats endpoint
      const response = await api.get('/main/dashboard/stats/');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  // Safe change calculation with fallbacks
  const getChangeValue = (change) => {
    return typeof change === 'number' ? change : 0;
  };

  const statCards = [
    {
      name: 'Total Students',
      value: stats.total_students?.toLocaleString() || '0',
      icon: UserGroupIcon,
      color: 'bg-blue-500',
      change: getChangeValue(stats.students_change),
      description: 'from last month'
    },
    {
      name: 'Total Classes',
      value: stats.total_classes?.toLocaleString() || '0',
      icon: AcademicCapIcon,
      color: 'bg-green-500',
      change: getChangeValue(stats.classes_change),
      description: 'from last month'
    },
    {
      name: 'Total Fees Paid',
      value: `GH₵ ${(stats.total_fees_paid || 0).toLocaleString()}`,
      icon: CurrencyDollarIcon,
      color: 'bg-purple-500',
      change: getChangeValue(stats.paid_change),
      description: 'from last month'
    },
    {
      name: 'Outstanding Balance',
      value: `GH₵ ${(stats.total_balance || 0).toLocaleString()}`,
      icon: CreditCardIcon,
      color: 'bg-orange-500',
      change: getChangeValue(stats.balance_change), // Positive change means balance decreased (good)
      description: 'from last month'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-3 flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
              </div>
              <div className="bg-gray-200 rounded-xl p-3 animate-pulse">
                <div className="h-6 w-6 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <div key={card.name} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                <div className="text-red-600 text-sm mt-2">{error}</div>
              </div>
              <div className={`${card.color} rounded-xl p-3`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <button
              onClick={fetchStats}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Retry
            </button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((card) => {
        const changeType = card.change > 0 ? 'positive' : card.change < 0 ? 'negative' : 'neutral';
        // For balance, positive change is good (balance decreasing)
        const isBalanceCard = card.name === 'Outstanding Balance';
        const displayChangeType = isBalanceCard ? 
          (changeType === 'positive' ? 'positive' : changeType === 'negative' ? 'negative' : 'neutral') :
          changeType;

        return (
          <div key={card.name} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                <div className={`flex items-center mt-2 text-sm ${
                  displayChangeType === 'positive' 
                    ? 'text-green-600' 
                    : displayChangeType === 'negative' 
                    ? 'text-red-600' 
                    : 'text-gray-600'
                }`}>
                  {displayChangeType === 'positive' && (
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  )}
                  {displayChangeType === 'negative' && (
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                    </svg>
                  )}
                  {displayChangeType !== 'neutral' ? (
                    <>
                      <span className="font-medium">
                        {displayChangeType === 'positive' ? '+' : '-'}{Math.abs(card.change).toFixed(1)}%
                      </span>
                      <span className="ml-1 text-gray-500">{card.description}</span>
                    </>
                  ) : (
                    <span className="text-gray-500">No change {card.description}</span>
                  )}
                </div>
              </div>
              <div className={`${card.color} rounded-xl p-3`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsGrid;




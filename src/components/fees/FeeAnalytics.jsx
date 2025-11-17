// src/components/fees/FeeAnalytics.jsx
import React, { useMemo } from 'react';

const FeeAnalytics = ({ structures, stats }) => {
  const analytics = useMemo(() => {
    const classRevenue = {};
    const termRevenue = {};
    let totalPotentialRevenue = 0;

    structures.forEach(structure => {
      const classKey = structure.school_class?.name || 'Unknown';
      const termKey = `${structure.academic_year} - ${structure.term}`;
      const total = parseFloat(structure.total_amount) || 0;

      // Class revenue
      classRevenue[classKey] = (classRevenue[classKey] || 0) + total;
      
      // Term revenue
      termRevenue[termKey] = (termRevenue[termKey] || 0) + total;
      
      // Total potential revenue (assuming all structures are potential)
      totalPotentialRevenue += total;
    });

    return {
      classRevenue: Object.entries(classRevenue)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5),
      termRevenue: Object.entries(termRevenue)
        .sort(([,a], [,b]) => b - a),
      totalPotentialRevenue
    };
  }, [structures]);

  // Format currency with proper rounding and compact notation for large numbers
  const formatCurrency = (amount) => {
    if (amount >= 1000000) {
      return `GH₵${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `GH₵${(amount / 1000).toFixed(1)}K`;
    } else {
      return `GH₵${amount.toFixed(2)}`;
    }
  };

  // Format number with proper commas and fixed decimals
  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  // Format currency for detailed display (without compact notation)
  const formatCurrencyDetailed = (amount) => {
    return `GH₵${parseFloat(amount).toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Structures</p>
              <p className="text-2xl font-bold text-blue-900">{formatNumber(stats.total_structures)}</p>
            </div>
            <div className="p-3 bg-blue-200 rounded-lg">
              <span className="text-blue-700 text-lg">📊</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Active Structures</p>
              <p className="text-2xl font-bold text-green-900">{formatNumber(stats.active_structures)}</p>
            </div>
            <div className="p-3 bg-green-200 rounded-lg">
              <span className="text-green-700 text-lg">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Potential Revenue</p>
              <p className="text-2xl font-bold text-purple-900">
                {formatCurrency(analytics.totalPotentialRevenue)}
              </p>
              <p className="text-xs text-purple-600 mt-1">
                {formatCurrencyDetailed(analytics.totalPotentialRevenue)}
              </p>
            </div>
            <div className="p-3 bg-purple-200 rounded-lg">
              <span className="text-purple-700 text-lg">💰</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Performance */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Classes by Revenue</h3>
          <div className="space-y-3">
            {analytics.classRevenue.map(([className, revenue]) => (
              <div key={className} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700 truncate">{className}</span>
                <span className="font-bold text-gray-900 whitespace-nowrap">
                  {formatCurrency(revenue)}
                </span>
              </div>
            ))}
            {analytics.classRevenue.length === 0 && (
              <p className="text-gray-500 text-center py-4">No data available</p>
            )}
          </div>
        </div>

        {/* Term Performance */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Term</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {analytics.termRevenue.map(([term, revenue]) => (
              <div key={term} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">{term}</span>
                <span className="font-bold text-gray-900 whitespace-nowrap">
                  {formatCurrency(revenue)}
                </span>
              </div>
            ))}
            {analytics.termRevenue.length === 0 && (
              <p className="text-gray-500 text-center py-4">No data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Structure Status Overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Structure Status Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 border border-green-200 rounded-lg bg-green-50">
            <div className="text-2xl font-bold text-green-900">{formatNumber(stats.active_structures)}</div>
            <div className="text-green-700 text-sm font-medium">Active</div>
          </div>
          
          <div className="text-center p-4 border border-orange-200 rounded-lg bg-orange-50">
            <div className="text-2xl font-bold text-orange-900">
              {formatNumber(stats.total_structures - stats.active_structures)}
            </div>
            <div className="text-orange-700 text-sm font-medium">Inactive</div>
          </div>
          
          <div className="text-center p-4 border border-blue-200 rounded-lg bg-blue-50">
            <div className="text-2xl font-bold text-blue-900">{formatNumber(stats.total_structures)}</div>
            <div className="text-blue-700 text-sm font-medium">Total</div>
          </div>
          
          <div className="text-center p-4 border border-purple-200 rounded-lg bg-purple-50">
            <div className="text-2xl font-bold text-purple-900">
              {stats.total_structures > 0 
                ? Math.round((stats.active_structures / stats.total_structures) * 100)
                : 0
              }%
            </div>
            <div className="text-purple-700 text-sm font-medium">Active Rate</div>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Average per Structure</div>
            <div className="text-xl font-bold text-gray-900">
              {structures.length > 0 
                ? formatCurrency(analytics.totalPotentialRevenue / structures.length)
                : 'GH₵0.00'
              }
            </div>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Highest Class</div>
            <div className="text-xl font-bold text-gray-900">
              {analytics.classRevenue.length > 0 
                ? analytics.classRevenue[0][0]
                : 'N/A'
              }
            </div>
            <div className="text-sm text-gray-600">
              {analytics.classRevenue.length > 0 
                ? formatCurrency(analytics.classRevenue[0][1])
                : ''
              }
            </div>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Active Rate</div>
            <div className="text-xl font-bold text-gray-900">
              {stats.total_structures > 0 
                ? `${Math.round((stats.active_structures / stats.total_structures) * 100)}%`
                : '0%'
              }
            </div>
            <div className="text-sm text-gray-600">
              {stats.active_structures} of {stats.total_structures} structures
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeeAnalytics;
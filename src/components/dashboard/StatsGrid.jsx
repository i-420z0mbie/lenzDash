import React, { useEffect, useState } from 'react';
import {
  UserGroupIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';

const AnimatedCounter = ({ value, prefix = '', decimals = 0 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const end = Number(value) || 0;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / 600, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(end * eased);

      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [value]);

  return (
    <span className="tabular-nums">
      {prefix}
      {Number(count).toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </span>
  );
};

const TrendRow = ({ label, trend, currency = false, inverse = false }) => {
  if (!trend) return null;

  const { current, previous, delta, percent, status } = trend;

  let text = '';
  let color = 'text-slate-500';

  if (status === 'no_data') {
    text = 'No history yet';
  } else if (status === 'new') {
    text = 'New activity';
    color = 'text-emerald-600';
  } else if (status === 'flat') {
    text = 'No change';
  } else {
    const isGood = inverse ? delta < 0 : delta > 0;
    color = isGood ? 'text-emerald-600' : 'text-rose-500';

    const percentText =
      percent !== null ? `${percent > 0 ? '+' : ''}${percent}%` : '';

    text = percentText;
  }

  return (
    <div className="rounded-lg bg-white/40 px-2 py-1 border border-white/30">
      <div className="flex justify-between items-center">
        <span className="text-[9px] text-slate-400">{label}</span>
        <span className={`text-[9px] font-semibold ${color}`}>{text}</span>
      </div>
    </div>
  );
};

const StatsGrid = ({ stats }) => {
  const safeStats = {
    total_students: 0,
    total_classes: 0,
    total_fees_paid: 0,
    total_balance: 0,
    trends: {},
    ...stats,
  };

  const statCards = [
    {
      name: 'Total Students',
      value: safeStats.total_students,
      icon: UserGroupIcon,
      color: 'bg-blue-500',
      trendKey: 'students',
    },
    {
      name: 'Total Classes',
      value: safeStats.total_classes,
      icon: AcademicCapIcon,
      color: 'bg-green-500',
      trendKey: 'classes',
    },
    {
      name: 'Total Fees Paid',
      value: safeStats.total_fees_paid,
      icon: CurrencyDollarIcon,
      color: 'bg-purple-500',
      trendKey: 'fees_paid',
      isCurrency: true,
    },
    {
      name: 'Outstanding Balance',
      value: safeStats.total_balance,
      icon: CreditCardIcon,
      color: 'bg-orange-500',
      trendKey: 'balance',
      isCurrency: true,
      inverse: true,
    },
  ];

  const trends = safeStats.trends || {};

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {statCards.map((card) => {
        const metricTrends = trends[card.trendKey] || {};

        return (
          <div
            key={card.name}
            className="glass-card rounded-xl p-3 transition-all hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {card.name}
                </p>

                <p className="text-sm font-bold text-slate-800 mt-1">
                  {card.isCurrency ? (
                    <AnimatedCounter value={card.value} prefix="GH₵ " decimals={2} />
                  ) : (
                    <AnimatedCounter value={card.value} />
                  )}
                </p>

                <div className="mt-2 space-y-1">
                  <TrendRow label="Today" trend={metricTrends.today} currency={card.isCurrency} inverse={card.inverse} />
                  <TrendRow label="7 Days" trend={metricTrends['7d']} currency={card.isCurrency} inverse={card.inverse} />
                  <TrendRow label="30 Days" trend={metricTrends['30d']} currency={card.isCurrency} inverse={card.inverse} />
                </div>
              </div>

              <div className={`${card.color} rounded-lg p-1.5 shadow-md`}>
                <card.icon className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsGrid;
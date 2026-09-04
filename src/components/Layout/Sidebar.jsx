import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  ChartBarIcon, UserGroupIcon, AcademicCapIcon,
  CurrencyDollarIcon, CreditCardIcon, CogIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/', icon: ChartBarIcon },
  { name: 'Students', href: '/students', icon: UserGroupIcon },
  { name: 'Classes', href: '/classes', icon: AcademicCapIcon },
  { name: 'Fee Management', href: '/fees', icon: CurrencyDollarIcon },
  { name: 'Payments', href: '/payments', icon: CreditCardIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
];

const Brand = () => (
  <div className="flex-shrink-0 px-5 py-6 border-b border-stone-200">
    <div className="flex items-center gap-2.5">
      <img src="/lenz-icon.png" alt="LenzPay" className="w-8 h-8 object-contain" />
      <div>
        <span className="ledger-display text-lg text-stone-900 block leading-tight">LenzPay</span>
        <p className="text-[10px] text-stone-400">Smart finance hub</p>
      </div>
    </div>
  </div>
);

const Sidebar = ({ open, setOpen }) => {
  const location = useLocation();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const date = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  const NavItems = ({ onNavigate }) => (
    <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      {navigation.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 pl-3.5 pr-3 py-2 text-[13px] border-l-2 transition-colors ${
              isActive
                ? 'border-emerald-800 bg-emerald-50/60 text-emerald-900 font-medium'
                : 'border-transparent text-stone-500 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <item.icon className={`h-4 w-4 ${isActive ? 'text-emerald-800' : 'text-stone-400'}`} />
            <span>{item.name}</span>
          </NavLink>
        );
      })}
    </nav>
  );

  const StatusBlock = () => (
    <div className="border border-stone-200 px-3 py-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-700" />
          <span className="text-[10px] text-emerald-800">Live</span>
        </div>
        <span className="text-[10px] text-stone-400">v2.0</span>
      </div>
      <div className="flex items-baseline justify-between mt-1.5">
        <span className="ledger-mono text-lg text-stone-800 tabular-nums">{time}</span>
        <span className="text-[10px] text-stone-400">{date}</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      {open && (
        <div className="fixed inset-0 flex z-50 lg:hidden">
          <div className="fixed inset-0 bg-stone-900/30" onClick={() => setOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white border-r border-stone-200 animate-slideInRight">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 z-10 flex items-center justify-center h-8 w-8 text-stone-400 hover:text-stone-700"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
            <Brand />
            <NavItems onNavigate={() => setOpen(false)} />
            <div className="p-3 mt-auto border-t border-stone-200">
              <StatusBlock />
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 h-screen sticky top-0 bg-white border-r border-stone-200">
          <Brand />
          <NavItems />
          <div className="p-3 mt-auto border-t border-stone-200">
            <StatusBlock />
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
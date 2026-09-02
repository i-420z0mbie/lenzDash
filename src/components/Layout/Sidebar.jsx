import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  ChartBarIcon, UserGroupIcon, AcademicCapIcon,
  CurrencyDollarIcon, CreditCardIcon, CogIcon,
  XMarkIcon, CheckCircleIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/', icon: ChartBarIcon },
  { name: 'Students', href: '/students', icon: UserGroupIcon },
  { name: 'Classes', href: '/classes', icon: AcademicCapIcon },
  { name: 'Fee Management', href: '/fees', icon: CurrencyDollarIcon },
  { name: 'Payments', href: '/payments', icon: CreditCardIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
];

const Sidebar = ({ open, setOpen }) => {
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formattedDate = currentTime.toLocaleDateString([], { month: 'short', day: 'numeric' });

  return (
    <>
      {/* Mobile sidebar */}
      {open && (
        <div className="fixed inset-0 flex z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white/95 backdrop-blur-md shadow-2xl animate-slideInRight">
            <div className="absolute top-3 right-3 z-10">
              <button onClick={() => setOpen(false)} className="flex items-center justify-center h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm text-gray-500 hover:text-gray-700">
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-shrink-0 px-5 py-5 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-xl blur-md opacity-40"></div>
                  <img src="/lenz-icon.png" alt="Logo" className="relative w-9 h-9 object-contain rounded-xl bg-white p-1 shadow-md" />
                </div>
                <div>
                  <span className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-indigo-700 bg-clip-text text-transparent">LenzPay</span>
                  <p className="text-[10px] text-gray-500 font-medium tracking-wide">Smart Finance Hub</p>
                </div>
              </div>
            </div>
            <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={() => setOpen(false)}
                    className={`group relative flex items-center gap-3 px-3 py-2.5 text-[11px] font-medium rounded-xl transition-all duration-200 ${
                      isActive ? 'bg-gradient-to-r from-indigo-50 to-indigo-100/40 text-indigo-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50/80 hover:text-gray-900'
                    }`}
                  >
                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-indigo-500 to-indigo-600 rounded-r-full"></div>}
                    <item.icon className={`h-4 w-4 transition ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-500 group-hover:scale-110'}`} />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>
            <div className="p-3 mt-auto border-t border-gray-100/80">
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-50/80 via-white/60 to-blue-50/40 p-3 backdrop-blur-md transition-all hover:shadow-md group">
                <div className="absolute -top-8 -right-8 w-20 h-20 bg-indigo-200/30 rounded-full blur-2xl"></div>
                <div className="relative flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.6)]"></div>
                      <span className="text-[10px] font-semibold text-emerald-700 uppercase">Live</span>
                    </div>
                    <CheckCircleIcon className="h-3 w-3 text-indigo-500 opacity-70" />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-mono font-bold text-indigo-800 tracking-tight">{formattedTime}</span>
                    <span className="text-[9px] font-medium text-gray-500">{formattedDate}</span>
                  </div>
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-indigo-300/40 to-transparent my-0.5"></div>
                  <div className="flex justify-between items-center text-[9px] text-gray-500">
                    <span>v2.0</span>
                    <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-indigo-400"></span>Operational</span>
                  </div>
                </div>
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                  <div className="w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_3s_infinite]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-72 h-screen sticky top-0 bg-white/90 backdrop-blur-md border-r border-gray-100 shadow-xl shadow-indigo-50/20">
          <div className="flex-shrink-0 px-5 py-6 border-b border-gray-100/80">
            <div className="flex items-center gap-2.5">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl blur-md opacity-40 group-hover:opacity-70 transition"></div>
                <img src="/lenz-icon.png" alt="Logo" className="relative w-10 h-10 object-contain rounded-xl bg-white p-1 shadow-md transition-transform group-hover:scale-105" />
              </div>
              <div>
                <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-indigo-600 to-indigo-700 bg-clip-text text-transparent">LenzPay</span>
                <p className="text-[9px] font-medium text-gray-400 uppercase tracking-wider">Premium Dashboard</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={`group relative flex items-center gap-3 px-4 py-2.5 text-[12px] font-medium rounded-xl transition-all duration-200 ${
                    isActive ? 'bg-gradient-to-r from-indigo-50/90 to-indigo-100/50 text-indigo-700 shadow-md' : 'text-gray-600 hover:bg-gray-50/70 hover:text-gray-900'
                  }`}
                >
                  {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-gradient-to-b from-indigo-500 to-indigo-600 rounded-r-full"></div>}
                  <item.icon className={`h-4 w-4 transition ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-500 group-hover:scale-110'}`} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
          <div className="p-4 mt-auto border-t border-gray-100/80">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-50/80 via-white/60 to-blue-50/40 p-3 backdrop-blur-md transition-all hover:shadow-md group">
              <div className="absolute -top-8 -right-8 w-20 h-20 bg-indigo-200/30 rounded-full blur-2xl"></div>
              <div className="relative flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.6)]"></div>
                    <span className="text-[10px] font-semibold text-emerald-700 uppercase">Live</span>
                  </div>
                  <CheckCircleIcon className="h-3 w-3 text-indigo-500 opacity-70" />
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-mono font-bold text-indigo-800 tracking-tight">{formattedTime}</span>
                  <span className="text-[9px] font-medium text-gray-500">{formattedDate}</span>
                </div>
                <div className="h-px w-full bg-gradient-to-r from-transparent via-indigo-300/40 to-transparent my-0.5"></div>
                <div className="flex justify-between items-center text-[9px] text-gray-500">
                  <span>v2.0</span>
                  <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-indigo-400"></span>Powered by BinaryLenz</span>
                </div>
              </div>
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_3s_infinite]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  ChartBarIcon, 
  UserGroupIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  CreditCardIcon,
  CogIcon,
  XMarkIcon
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

  return (
    <>
      {/* Mobile overlay with glass morphism effect */}
      {open && (
        <div className="fixed inset-0 flex z-50 lg:hidden">
          {/* Backdrop with blur */}
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300" 
            onClick={() => setOpen(false)} 
          />
          
          {/* Mobile sidebar panel */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white/95 backdrop-blur-md shadow-2xl animate-slide-in-right">
            {/* Close button */}
            <div className="absolute top-4 right-4 z-10">
              <button
                className="flex items-center justify-center h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm text-gray-500 hover:text-gray-700 hover:bg-white/40 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                onClick={() => setOpen(false)}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            {/* Logo Section with Icon */}
            <div className="flex-shrink-0 px-6 py-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-600 rounded-xl blur-md opacity-40"></div>
                  <img 
                    src="/lenz-icon.png" 
                    alt="LenzPay Logo" 
                    className="relative w-11 h-11 object-contain rounded-xl bg-white p-1.5 shadow-md"
                  />
                </div>
                <div>
                  <span className="font-bold text-xl bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                    LenzPay
                  </span>
                  <p className="text-xs text-gray-500 font-medium tracking-wide">Smart Finance Hub</p>
                </div>
              </div>
            </div>
            
            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={() => setOpen(false)}
                    className={`
                      group relative flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-2xl
                      transition-all duration-300 ease-out
                      ${isActive 
                        ? 'bg-gradient-to-r from-primary-50 to-primary-100/40 text-primary-700 shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-50/80 hover:text-gray-900 hover:shadow-sm'
                      }
                    `}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-primary-500 to-primary-600 rounded-r-full shadow-glow"></div>
                    )}
                    
                    <item.icon 
                      className={`
                        h-5 w-5 transition-all duration-200
                        ${isActive 
                          ? 'text-primary-600 drop-shadow-sm' 
                          : 'text-gray-400 group-hover:text-primary-500 group-hover:scale-110'
                        }
                      `}
                    />
                    <span className="tracking-wide">{item.name}</span>
                    
                    {!isActive && (
                      <span className="absolute bottom-2 left-12 right-4 h-px bg-gradient-to-r from-primary-200/0 via-primary-200/50 to-primary-200/0 scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            <div className="p-4 border-t border-gray-100">
              <div className="text-center text-[11px] text-gray-400 font-medium tracking-wider">
                © 2025 LenzPay v2.0
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar - modern glass card style */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-80 h-screen sticky top-0 bg-white/90 backdrop-blur-md border-r border-gray-100 shadow-xl shadow-primary-50/20">
          {/* Logo area */}
          <div className="flex-shrink-0 px-6 py-7 border-b border-gray-100/80">
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl blur-md opacity-40 group-hover:opacity-70 transition duration-500"></div>
                <img 
                  src="/lenz-icon.png" 
                  alt="LenzPay Logo" 
                  className="relative w-12 h-12 object-contain rounded-2xl bg-white p-1.5 shadow-md transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-2xl tracking-tight bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                  LenzPay
                </span>
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mt-0.5">
                  Premium Dashboard
                </span>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={`
                    group relative flex items-center gap-4 px-5 py-3.5 text-[15px] font-medium rounded-2xl
                    transition-all duration-300 ease-out
                    ${isActive 
                      ? 'bg-gradient-to-r from-primary-50/90 to-primary-100/50 text-primary-700 shadow-md shadow-primary-100/50' 
                      : 'text-gray-600 hover:bg-gray-50/70 hover:text-gray-900 hover:shadow-sm hover:translate-x-0.5'
                    }
                  `}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-gradient-to-b from-primary-500 to-primary-600 rounded-r-full shadow-glow"></div>
                  )}
                  
                  <item.icon 
                    className={`
                      h-5 w-5 transition-all duration-200
                      ${isActive 
                        ? 'text-primary-600 drop-shadow-md' 
                        : 'text-gray-400 group-hover:text-primary-500 group-hover:scale-110'
                      }
                    `}
                  />
                  <span className="tracking-wide">{item.name}</span>
                  
                  {!isActive && (
                    <span className="absolute bottom-2 left-14 right-5 h-px bg-gradient-to-r from-primary-300/0 via-primary-300/60 to-primary-300/0 scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Bottom status */}
          <div className="p-5 mt-auto border-t border-gray-100/80">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-50/60 via-white/40 to-blue-50/40 p-4 sm:p-5 backdrop-blur-md">
            
            {/* Soft glow background */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary-200/30 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-blue-200/20 rounded-full blur-3xl"></div>

            <div className="relative flex items-center gap-3">
              
              {/* Status indicator */}
              <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-100 to-blue-100 flex items-center justify-center shadow-inner">
                <div className="w-2.5 h-2.5 rounded-full bg-primary-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.7)]"></div>
              </div>

              {/* Text content */}
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold text-primary-700 tracking-wide">
                  System Online
                </span>

                <span className="text-[11px] sm:text-xs text-gray-500">
                  All services powered by{' '}
                  <span className="font-semibold bg-gradient-to-r from-primary-500 via-blue-500 to-primary-600 bg-clip-text text-transparent
                                  transition-all duration-300
                                  hover:drop-shadow-[0_0_6px_rgba(59,130,246,0.5)]
                                  hover:brightness-110">
                    BinaryLenz
                  </span>
                </span>
              </div>
            </div>

            {/* Subtle animated shimmer line */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_4s_infinite]"></div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
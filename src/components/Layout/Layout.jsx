import React, { useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  useEffect(() => {
    if (!document.getElementById('layout-global-styles')) {
      const style = document.createElement('style');
      style.id = 'layout-global-styles';
      style.textContent = `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(15px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(250px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-fadeInUp { animation: fadeInUp 0.25s ease-out; }
        .animate-slideUp { animation: slideUp 0.2s cubic-bezier(0.2, 0.9, 0.4, 1.1); }
        .animate-slideInRight { animation: slideInRight 0.25s ease-out; }
        .glass-card { background: rgba(255,255,255,0.6); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.5); }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto p-4 md:p-5">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
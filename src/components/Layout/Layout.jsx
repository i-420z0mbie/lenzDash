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
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-slideInRight { animation: slideInRight 0.2s ease-out; }
        .ledger-display { font-family: 'Fraunces', serif; font-weight: 500; }
        .ledger-mono { font-family: 'IBM Plex Mono', ui-monospace, monospace; }
        /* Bridge for components not yet redesigned: flat card instead of blurred glass */
        .glass-card { background: #ffffff; border: 1px solid #e7e5e4; }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div className="flex h-screen bg-stone-50" style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
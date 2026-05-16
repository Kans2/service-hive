import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, LayoutDashboard, Users } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Layout() {
  const { user, logout, isLoading } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark' || 
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-outfit">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-border flex flex-col transition-all duration-300 z-20 relative">
        <div className="h-20 flex items-center px-8 border-b border-border">
          <div className="flex items-center gap-3 text-primary-600 dark:text-accent-blue font-bold text-2xl font-space-grotesk tracking-tight">
            <LayoutDashboard className="w-7 h-7" />
            SmartLeads
          </div>
        </div>
        <div className="flex-1 py-6 flex flex-col gap-2 px-4">
          <div className="px-4 py-3 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400 rounded-xl flex items-center gap-3 font-medium transition-colors cursor-pointer border border-primary-100 dark:border-primary-500/20">
            <Users className="w-5 h-5" />
            Leads
          </div>
        </div>
        <div className="p-6 border-t border-border bg-slate-50/50 dark:bg-[#121214]">
          <div className="flex items-center justify-between mb-5">
            <div className="text-sm font-medium truncate pr-2">
              <div className="truncate font-space-grotesk font-semibold text-slate-900 dark:text-slate-100 text-base">{user.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 capitalize flex items-center gap-1.5 mt-0.5 font-outfit">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-blue shadow-[0_0_8px_#00f0ff]"></span>
                {user.role}
              </div>
            </div>
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-[#27272a] text-slate-500 transition-colors border border-transparent dark:hover:border-white/10"
            >
              {isDarkMode ? '🌞' : '🌙'}
            </button>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-[#27272a] transition-all shadow-sm font-outfit"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto relative bg-background">
        <header className="h-20 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-10 flex items-center px-10 shadow-sm">
          <h1 className="text-xl font-space-grotesk font-semibold text-slate-800 dark:text-white">Dashboard Overview</h1>
        </header>
        <main className="p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

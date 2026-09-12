import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, LogOut, Bell, Sparkles } from 'lucide-react';
import { Badge } from '../common/Badge';

export const Navbar: React.FC = () => {
  const { user, logout, quickSwitchDemoUser } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const roleColors: Record<string, 'purple' | 'blue' | 'emerald' | 'slate'> = {
    ADMIN: 'purple',
    MANAGER: 'blue',
    STAFF: 'emerald',
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Brand & DBMS PBL Tag */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>DBMS Project-Based Learning</span>
        </div>
        <span className="text-xs text-slate-500 hidden md:inline">|</span>
        <span className="text-xs font-mono text-slate-400 hidden md:inline">PostgreSQL 3NF • Neon Serverless</span>
      </div>

      {/* Right controls: Demo Role Switcher, Alerts, User Profile */}
      <div className="flex items-center gap-4">
        {/* Quick Demo Role Switcher for Examiners & Live Viva */}
        <div className="flex items-center gap-1.5 bg-slate-950/70 border border-slate-800 rounded-xl p-1 text-xs">
          <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider px-2">Demo RBAC:</span>
          <button
            onClick={() => quickSwitchDemoUser('ADMIN')}
            className={`px-2 py-0.5 rounded-lg font-medium transition-all ${
              user?.role === 'ADMIN'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-purple-300 hover:bg-slate-800/50'
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => quickSwitchDemoUser('MANAGER')}
            className={`px-2 py-0.5 rounded-lg font-medium transition-all ${
              user?.role === 'MANAGER'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-blue-300 hover:bg-slate-800/50'
            }`}
          >
            Manager
          </button>
          <button
            onClick={() => quickSwitchDemoUser('STAFF')}
            className={`px-2 py-0.5 rounded-lg font-medium transition-all ${
              user?.role === 'STAFF'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-800/50'
            }`}
          >
            Staff
          </button>
        </div>

        {/* User Info & Avatar */}
        {user && (
          <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
            {/* Initials Avatar */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shadow-md border border-teal-400/30">
              {getInitials(user.fullName || 'User')}
            </div>

            <div className="hidden sm:block text-left">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white leading-none">{user.fullName}</span>
                <Badge variant={roleColors[user.role] || 'slate'}>{user.role}</Badge>
              </div>
              <span className="text-[11px] text-slate-400 leading-none mt-1 block">
                {user.department || 'Logistics'} • {user.email}
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              title="Logout"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};


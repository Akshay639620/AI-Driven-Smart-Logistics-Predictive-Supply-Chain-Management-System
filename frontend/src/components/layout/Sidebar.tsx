import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  Truck,
  Building2,
  TrendingUp,
  Database,
  FileCode2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Smart Inventory', href: '/inventory', icon: Boxes },
    { name: 'Orders & Fulfillment', href: '/orders', icon: ShoppingCart },
    { name: 'Shipment Tracking', href: '/shipments', icon: Truck },
    { name: 'Suppliers', href: '/suppliers', icon: Building2 },
    { name: 'AI Demand Forecasting', href: '/forecasting', icon: TrendingUp },
  ];

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-slate-900/80 flex flex-col justify-between shrink-0 min-h-screen">
      <div>
        {/* App Title */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800/80">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-white block leading-none">
              SmartLogistics<span className="text-teal-400 font-black">.AI</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase mt-1 block">
              Supply Chain ERP
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <div className="p-4 space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Operations
          </div>
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}

          {/* Special DBMS PBL Defense Tab */}
          <div className="pt-4">
            <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              DBMS Defense
            </div>
            <NavLink
              to="/dbms-showcase"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-500/20 to-teal-500/20 text-purple-300 border border-purple-500/30 shadow-md font-semibold'
                    : 'text-purple-400/90 hover:text-purple-200 hover:bg-purple-950/30 border border-purple-500/10'
                }`
              }
            >
              <Database className="w-4 h-4 text-purple-400 shrink-0" />
              <span>DBMS Showcase</span>
              <span className="ml-auto text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                Viva
              </span>
            </NavLink>
          </div>
        </div>
      </div>

      {/* Footer link to Swagger docs & Schema */}
      <div className="p-4 border-t border-slate-800/80 space-y-2">
        <a
          href="http://localhost:5000/api-docs"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-teal-400" />
            <span>Swagger API Docs</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">OpenAPI</span>
        </a>
        <div className="px-3 py-2 bg-slate-950/60 rounded-xl border border-slate-800/60 text-[11px] text-slate-400">
          <div className="flex items-center justify-between text-slate-500">
            <span>Logged in role:</span>
            <span className="font-semibold text-teal-400 font-mono">{user?.role}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

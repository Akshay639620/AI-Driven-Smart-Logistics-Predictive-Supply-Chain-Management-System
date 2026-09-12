import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import {
  DollarSign,
  ShoppingCart,
  Truck,
  AlertTriangle,
  Clock,
  TrendingUp,
  Boxes,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const [kpis, setKpis] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [recentShipments, setRecentShipments] = useState<any[]>([]);
  const [stockAlerts, setStockAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [kpiRes, trendsRes, catRes, shipRes, alertRes] = await Promise.all([
          api.get('/analytics/kpis'),
          api.get('/analytics/monthly-trends'),
          api.get('/analytics/category-performance'),
          api.get('/shipments?status=IN_TRANSIT'),
          api.get('/inventory/alerts'),
        ]);

        if (kpiRes.data.success) setKpis(kpiRes.data.data);
        if (trendsRes.data.success) setTrends(trendsRes.data.data);
        if (catRes.data.success) setCategoryData(catRes.data.data);
        if (shipRes.data.success) setRecentShipments(shipRes.data.data.slice(0, 6));
        if (alertRes.data.success) setStockAlerts(alertRes.data.data.slice(0, 5));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
          <p className="text-xs font-mono text-slate-400">Loading supply chain analytics from PostgreSQL...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Heading */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Supply Chain Command Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry, normalized database aggregates, and predictive machine learning models.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/orders"
            className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs transition-all shadow-lg shadow-teal-500/20 flex items-center gap-2"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Place Order (Atomic Transaction)</span>
          </Link>
          <Link
            to="/dbms-showcase"
            className="px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-semibold text-xs transition-all flex items-center gap-2"
          >
            <span>DBMS Viva Defense</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Gross Revenue"
          value={`$${(kpis?.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle="Aggregated across all completed orders"
          icon={DollarSign}
          color="teal"
          trend="+14.2% YoY"
        />
        <StatCard
          title="Total Orders Processed"
          value={kpis?.totalOrders || 0}
          subtitle="Historical and active orders"
          icon={ShoppingCart}
          color="blue"
        />
        <StatCard
          title="On-Time Delivery Rate"
          value={`${kpis?.onTimeDeliveryRate || 95}%`}
          subtitle="Computed from shipment delivery dates"
          icon={Clock}
          color="purple"
          trend="Target: >92%"
        />
        <StatCard
          title="Active Shipments"
          value={kpis?.activeShipments || 0}
          subtitle="Currently in transit across carriers"
          icon={Truck}
          color="amber"
        />
        <StatCard
          title="Triggered Stock Alerts"
          value={kpis?.lowStockAlerts || stockAlerts.length}
          subtitle="Automated PostgreSQL trigger events"
          icon={AlertTriangle}
          color="rose"
          trend="Action Required"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Volume Trends */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">12-Month Revenue & Order Dynamics</h2>
              <p className="text-xs text-slate-400">PostgreSQL SQL Aggregation via TO_CHAR() and GROUP BY</p>
            </div>
            <span className="text-[11px] font-mono text-teal-400 px-2 py-1 rounded bg-teal-500/10 border border-teal-500/20">
              Live SQL Aggregate
            </span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `$${val / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="totalRevenue" name="Revenue ($)" stroke="#14b8a6" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Performance */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Demand by Category</h2>
              <p className="text-xs text-slate-400">Join across Products, Items & Orders</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" fontSize={10} />
                <YAxis dataKey="category" type="category" stroke="#64748b" fontSize={10} width={80} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Bar dataKey="unitsSold" name="Units Sold" fill="#3b82f6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Lower Row: Trigger Alerts & Active Shipments with ML Delay Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trigger-Generated Low Stock Alerts */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">PostgreSQL Trigger Alerts</h2>
                <p className="text-xs text-slate-400">Rows created automatically by trg_inventory_low_stock_check</p>
              </div>
            </div>
            <Link to="/inventory" className="text-xs text-teal-400 hover:text-teal-300 font-medium">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {stockAlerts.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No active low-stock alerts. All inventory optimal!</p>
            ) : (
              stockAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{alert.product?.name}</span>
                      <Badge variant={alert.alertType === 'CRITICAL_STOCK' ? 'rose' : 'amber'}>
                        {alert.alertType}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Warehouse: <span className="text-slate-300 font-medium">{alert.warehouse?.name}</span> ({alert.warehouse?.city})
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold font-mono text-rose-400">{alert.currentQuantity} in stock</span>
                    <span className="text-[10px] text-slate-500 block">Threshold: {alert.threshold}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Shipments with Delay Risk */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Active Shipments & AI Delay Risk</h2>
                <p className="text-xs text-slate-400">Scored via Scikit-learn RandomForestClassifier</p>
              </div>
            </div>
            <Link to="/shipments" className="text-xs text-teal-400 hover:text-teal-300 font-medium">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {recentShipments.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No active transit shipments at this moment.</p>
            ) : (
              recentShipments.map((shipment) => {
                const latestScore = shipment.riskScores?.[0];
                const riskLevel = latestScore?.predictedDelayRisk || 'LOW';
                const riskVariant = riskLevel === 'HIGH' ? 'rose' : riskLevel === 'MEDIUM' ? 'amber' : 'emerald';

                return (
                  <div
                    key={shipment.id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-teal-400">{shipment.trackingNumber}</span>
                        <Badge variant={riskVariant}>Risk: {riskLevel}</Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {shipment.carrierName} • Dest: <span className="text-slate-300 font-medium">{shipment.route?.destinationCity}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold text-slate-300 block">{shipment.status}</span>
                      {latestScore && (
                        <span className="text-[10px] font-mono text-slate-400">
                          Prob: {(latestScore.delayProbability * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

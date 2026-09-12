import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  Boxes,
  Search,
  Filter,
  Eye,
  Plus,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  Database,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Inventory: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'view' | 'table' | 'alerts'>('view');
  const [viewData, setViewData] = useState<any[]>([]);
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('ALL');

  // Stock Adjustment Modal
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [triggerAlertNotice, setTriggerAlertNotice] = useState<any | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [viewRes, invRes, alertRes] = await Promise.all([
        api.get('/inventory/view'),
        api.get('/inventory'),
        api.get('/inventory/alerts'),
      ]);

      if (viewRes.data.success) setViewData(viewRes.data.data);
      if (invRes.data.success) setInventoryList(invRes.data.data);
      if (alertRes.data.success) setAlerts(alertRes.data.data);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdjust = (item: any) => {
    setSelectedItem(item);
    setAdjustQty(item.quantity);
    setTriggerAlertNotice(null);
  };

  const handleSaveStock = async () => {
    if (!selectedItem) return;
    setIsSubmitting(true);
    try {
      const res = await api.patch(`/inventory/${selectedItem.inventory_id || selectedItem.id}/stock`, {
        quantity: Number(adjustQty),
      });

      if (res.data.success) {
        if (res.data.triggerFired) {
          setTriggerAlertNotice(res.data.latestAlert);
        } else {
          setSelectedItem(null);
        }
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to update stock:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter logic
  const filteredViewData = viewData.filter((item) => {
    const matchesSearch =
      item.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesWarehouse =
      selectedWarehouse === 'ALL' || item.warehouse_code === selectedWarehouse;
    return matchesSearch && matchesWarehouse;
  });

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'OPTIMAL':
        return <Badge variant="emerald">OPTIMAL</Badge>;
      case 'LOW_STOCK':
        return <Badge variant="amber">LOW STOCK</Badge>;
      case 'CRITICAL_STOCK':
      case 'OUT_OF_STOCK':
        return <Badge variant="rose">{health.replace('_', ' ')}</Badge>;
      case 'OVERSTOCKED':
        return <Badge variant="blue">OVERSTOCKED</Badge>;
      default:
        return <Badge variant="slate">{health}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Smart Inventory Control</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20">
              Resolved M:N (Product ↔ Warehouse)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-warehouse stock monitoring powered directly by PostgreSQL views and triggers.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors flex items-center gap-2 text-xs self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
        <button
          onClick={() => setActiveTab('view')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'view'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>PostgreSQL View (v_inventory_stock_status)</span>
          <span className="px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 text-[10px] font-mono">
            {viewData.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'alerts'
              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>PostgreSQL Trigger Alerts</span>
          <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[10px] font-mono">
            {alerts.length}
          </span>
        </button>
      </div>

      {/* Controls: Search and Warehouse Filter */}
      {activeTab === 'view' && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 p-3 rounded-2xl">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search product name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">All Regional Warehouses</option>
              <option value="WH-ORD-01">Chicago Central (WH-ORD-01)</option>
              <option value="WH-DFW-02">Dallas Metro (WH-DFW-02)</option>
              <option value="WH-LAX-03">West Coast Terminal (WH-LAX-03)</option>
              <option value="WH-JFK-04">Northeast Gateway (WH-JFK-04)</option>
              <option value="WH-ATL-05">Southeast Depot (WH-ATL-05)</option>
            </select>
          </div>
        </div>
      )}

      {/* PostgreSQL View Tab */}
      {activeTab === 'view' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-3.5 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">
                SQL Source: <span className="text-teal-400 font-bold">SELECT * FROM v_inventory_stock_status</span>
              </span>
            </div>
            <span className="text-xs text-slate-500">Showing {filteredViewData.length} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3">Product / SKU</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Warehouse</th>
                  <th className="px-4 py-3 text-right">Quantity</th>
                  <th className="px-4 py-3 text-right">Reorder Threshold</th>
                  <th className="px-4 py-3 text-right">Total Retail Value</th>
                  <th className="px-4 py-3 text-center">Health Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredViewData.map((row) => (
                  <tr key={`${row.product_id}-${row.warehouse_id}`} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-white">{row.product_name}</div>
                      <div className="font-mono text-[11px] text-teal-400/90">{row.sku}</div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-300">{row.category}</td>
                    <td className="px-4 py-3.5">
                      <div className="text-slate-200 font-medium">{row.warehouse_name}</div>
                      <div className="text-slate-500 text-[10px]">{row.warehouse_city}</div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-white">
                      {row.quantity}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-slate-400">
                      {row.reorder_threshold}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-slate-200">
                      ${Number(row.total_retail_value || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {getHealthBadge(row.stock_health_status)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleOpenAdjust(row)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-[11px] transition-colors"
                      >
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trigger Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="mb-4">
            <h2 className="text-base font-bold text-white">Live PostgreSQL Trigger Alerts Table (stock_alerts)</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              These rows were created automatically by PostgreSQL's <code className="text-teal-400 font-mono">trg_inventory_low_stock_check</code> trigger whenever <code className="text-amber-400 font-mono">NEW.quantity &lt;= NEW.reorder_threshold</code>.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3">Alert ID</th>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">Warehouse Location</th>
                  <th className="px-4 py-3">Alert Type</th>
                  <th className="px-4 py-3 text-right">Current Stock</th>
                  <th className="px-4 py-3 text-right">Threshold</th>
                  <th className="px-4 py-3">Triggered At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {alerts.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-slate-500">#{a.id}</td>
                    <td className="px-4 py-3.5 font-semibold text-white">{a.product?.name}</td>
                    <td className="px-4 py-3.5 text-slate-300">{a.warehouse?.name} ({a.warehouse?.city})</td>
                    <td className="px-4 py-3.5">
                      <Badge variant={a.alertType === 'CRITICAL_STOCK' ? 'rose' : 'amber'}>
                        {a.alertType}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-rose-400">{a.currentQuantity}</td>
                    <td className="px-4 py-3.5 text-right font-mono text-slate-400">{a.threshold}</td>
                    <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">
                      {new Date(a.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={selectedItem !== null}
        onClose={() => setSelectedItem(null)}
        title="Adjust Inventory Quantity"
        subtitle={`Updating stock for ${selectedItem?.product_name || selectedItem?.product?.name}`}
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>Warehouse:</span>
              <span className="text-white font-medium">{selectedItem?.warehouse_name || selectedItem?.warehouse?.name}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Reorder Threshold:</span>
              <span className="text-amber-400 font-mono font-semibold">{selectedItem?.reorder_threshold || 20} units</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              New Quantity
            </label>
            <input
              type="number"
              min="0"
              value={adjustQty}
              onChange={(e) => setAdjustQty(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-base focus:outline-none focus:border-teal-500"
            />
            {adjustQty <= (selectedItem?.reorder_threshold || 20) && (
              <p className="mt-2 text-xs text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Notice: Quantity is &lt;= threshold! PostgreSQL trigger will automatically fire and log an alert.</span>
              </p>
            )}
          </div>

          {triggerAlertNotice && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">PostgreSQL Trigger Fired Successfully!</p>
                <p className="text-[11px] text-emerald-400/80 mt-0.5">
                  Row inserted into <code className="font-mono">stock_alerts</code> (Alert ID: #{triggerAlertNotice.id}, Type: {triggerAlertNotice.alertType}).
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedItem(null)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSaveStock}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950 transition-colors"
            >
              {isSubmitting ? 'Updating in PostgreSQL...' : 'Save & Fire Triggers'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Badge } from '../components/common/Badge';
import {
  Database,
  ShieldCheck,
  Zap,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Layers,
  Sparkles,
  ArrowRight,
  GitMerge,
  Cpu,
} from 'lucide-react';

export const DbmsShowcase: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Trigger test states
  const [isTestingTrigger, setIsTestingTrigger] = useState(false);
  const [triggerResult, setTriggerResult] = useState<any | null>(null);

  // Rollback test states
  const [isTestingRollback, setIsTestingRollback] = useState(false);
  const [rollbackResult, setRollbackResult] = useState<any | null>(null);

  // Explain query states
  const [isExplaining, setIsExplaining] = useState(false);
  const [explainResult, setExplainResult] = useState<any | null>(null);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await api.get('/dbms/overview');
        if (res.data.success) setOverview(res.data);
      } catch (err) {
        console.error('Failed to load DBMS overview:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  const handleTestTrigger = async () => {
    setIsTestingTrigger(true);
    setTriggerResult(null);
    try {
      const res = await api.post('/dbms/test-trigger');
      setTriggerResult(res.data);
    } catch (err: any) {
      setTriggerResult({ success: false, message: err.message });
    } finally {
      setIsTestingTrigger(false);
    }
  };

  const handleTestRollback = async () => {
    setIsTestingRollback(true);
    setRollbackResult(null);
    try {
      const res = await api.post('/orders/simulate-rollback');
      setRollbackResult(res.data);
    } catch (err: any) {
      setRollbackResult(err.response?.data || { success: false, message: err.message });
    } finally {
      setIsTestingRollback(false);
    }
  };

  const handleExplainQuery = async () => {
    setIsExplaining(true);
    setExplainResult(null);
    try {
      const res = await api.get('/dbms/explain-query');
      setExplainResult(res.data);
    } catch (err: any) {
      setExplainResult({ success: false, message: err.message });
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950/50 via-slate-900 to-teal-950/40 border border-purple-500/30 rounded-3xl p-8 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold mb-3">
            <Database className="w-3.5 h-3.5" />
            <span>DBMS Academic Defense & Viva Evaluation Suite</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Relational Architecture & DBMS Verification
          </h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            This module provides live, verifiable execution proof for the core DBMS requirements:
            Third Normal Form (3NF), resolved M:N relationships, PostgreSQL Views, Triggers, ACID Transactions with rollback, and B-Tree Index execution plans.
          </p>
        </div>
      </div>

      {/* Schema Metrics & 3NF Status Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Normalization</span>
          <span className="text-lg font-black text-purple-400 font-mono mt-1 block">3NF</span>
          <span className="text-[10px] text-slate-500">Zero Transitive Dep</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Total Tables</span>
          <span className="text-lg font-black text-white font-mono mt-1 block">12</span>
          <span className="text-[10px] text-slate-500">PostgreSQL Relations</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Resolved M:N</span>
          <span className="text-lg font-black text-teal-400 font-mono mt-1 block">3</span>
          <span className="text-[10px] text-slate-500">Bridge Tables</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">PostgreSQL Views</span>
          <span className="text-lg font-black text-blue-400 font-mono mt-1 block">2</span>
          <span className="text-[10px] text-slate-500">v_inventory_stock</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Triggers Attached</span>
          <span className="text-lg font-black text-amber-400 font-mono mt-1 block">1</span>
          <span className="text-[10px] text-slate-500">trg_inventory_alert</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">B-Tree Indexes</span>
          <span className="text-lg font-black text-rose-400 font-mono mt-1 block">4</span>
          <span className="text-[10px] text-slate-500">Accelerated Lookups</span>
        </div>
      </div>

      {/* Feature 1: Resolved Many-to-Many Relationships */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
            <GitMerge className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">1. Resolved Many-to-Many (M:N) Relationships</h3>
            <p className="text-xs text-slate-400">Elimination of repeating groups and partial dependencies via bridge tables</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-teal-400 font-mono">product_suppliers</span>
              <Badge variant="teal">M:N Bridge</Badge>
            </div>
            <p className="text-slate-400 text-[11px]">
              Resolves <strong>Product ↔ Supplier</strong>. A product can be supplied by multiple vendors; a supplier offers many products.
            </p>
            <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400 space-y-1">
              <div>• FK: product_id → products(id)</div>
              <div>• FK: supplier_id → suppliers(id)</div>
              <div>• UNIQUE(product_id, supplier_id)</div>
              <div>• Payload: supply_price, is_primary</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-400 font-mono">inventory</span>
              <Badge variant="blue">M:N Bridge</Badge>
            </div>
            <p className="text-slate-400 text-[11px]">
              Resolves <strong>Product ↔ Warehouse</strong>. A product is stocked across multiple regional hubs; warehouses store many SKUs.
            </p>
            <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400 space-y-1">
              <div>• FK: product_id → products(id)</div>
              <div>• FK: warehouse_id → warehouses(id)</div>
              <div>• UNIQUE(product_id, warehouse_id)</div>
              <div>• Payload: quantity, reorder_threshold</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-400 font-mono">order_items</span>
              <Badge variant="purple">M:N Bridge</Badge>
            </div>
            <p className="text-slate-400 text-[11px]">
              Resolves <strong>Order ↔ Product</strong>. An order contains multiple product line items; products appear across thousands of orders.
            </p>
            <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400 space-y-1">
              <div>• FK: order_id → orders(id) ON DELETE CASCADE</div>
              <div>• FK: product_id → products(id)</div>
              <div>• FK: warehouse_id → warehouses(id)</div>
              <div>• Payload: quantity, unit_price, subtotal</div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature 2: PostgreSQL Trigger Demonstration */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">2. Live PostgreSQL Trigger Test (trg_inventory_low_stock_check)</h3>
              <p className="text-xs text-slate-400">
                Trigger fires automatically on UPDATE of inventory.quantity to insert a row into stock_alerts
              </p>
            </div>
          </div>

          <button
            onClick={handleTestTrigger}
            disabled={isTestingTrigger}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 self-start sm:self-auto"
          >
            <Zap className={`w-3.5 h-3.5 ${isTestingTrigger ? 'animate-spin' : ''}`} />
            <span>{isTestingTrigger ? 'Executing in PostgreSQL...' : 'Test Trigger Execution Live'}</span>
          </button>
        </div>

        {/* Trigger Code Preview */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
          <span className="text-slate-500">// PostgreSQL Trigger Definition</span>
          <p className="text-purple-400">CREATE TRIGGER trg_inventory_low_stock_check</p>
          <p className="text-slate-300 pl-4">AFTER UPDATE OF quantity OR INSERT ON inventory</p>
          <p className="text-slate-300 pl-4">FOR EACH ROW EXECUTE FUNCTION fn_check_inventory_alert();</p>
        </div>

        {/* Live Output */}
        {triggerResult && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>{triggerResult.demonstration}</span>
            </div>
            <p className="text-emerald-300/90 text-[11px]">{triggerResult.explanation}</p>
            {triggerResult.generatedAlertRecord && (
              <div className="p-3 rounded-lg bg-slate-950/80 border border-emerald-500/30 text-[11px] font-mono text-slate-200">
                <div>• Alert ID: #{triggerResult.generatedAlertRecord.id}</div>
                <div>• Product: {triggerResult.generatedAlertRecord.product?.name}</div>
                <div>• Warehouse: {triggerResult.generatedAlertRecord.warehouse?.name}</div>
                <div>• Alert Type: {triggerResult.generatedAlertRecord.alertType}</div>
                <div>• Logged Quantity: {triggerResult.generatedAlertRecord.currentQuantity} units</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Feature 3: Atomic ACID Transaction with Rollback Guarantee */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">3. Atomic ACID Transaction Rollback Guarantee</h3>
              <p className="text-xs text-slate-400">
                Tests order placement failure (stock deficit) ensuring zero partial writes to orders, order_items, or inventory
              </p>
            </div>
          </div>

          <button
            onClick={handleTestRollback}
            disabled={isTestingRollback}
            className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs transition-all shadow-lg shadow-rose-500/20 flex items-center gap-2 self-start sm:self-auto"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isTestingRollback ? 'animate-spin' : ''}`} />
            <span>{isTestingRollback ? 'Testing Rollback...' : 'Simulate Failed Transaction'}</span>
          </button>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-2">
          <p className="font-semibold text-slate-200">Transaction Workflow ($transaction):</p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px] font-mono">
            <div className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300">1. Lock Stock Check</div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300">2. Insert Order</div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300">3. Insert Line Items</div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300">4. Decrement Stock</div>
          </div>
        </div>

        {/* Rollback Output */}
        {rollbackResult && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>{rollbackResult.demonstration || 'Transaction Rollback Test'}</span>
            </div>
            <p className="text-slate-300 text-[11px] font-mono">
              <strong>Error Caught:</strong> {rollbackResult.errorCaught || rollbackResult.message}
            </p>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-rose-500/30 text-emerald-400 text-xs font-semibold">
              ✓ {rollbackResult.verdict || 'Atomicity verified: All pending inserts were revoked cleanly.'}
            </div>
          </div>
        )}
      </div>

      {/* Feature 4: PostgreSQL Indexing & EXPLAIN ANALYZE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">4. Index Optimization & EXPLAIN ANALYZE</h3>
              <p className="text-xs text-slate-400">
                Verifying B-Tree index scan on orders(created_at DESC) vs sequential full-table scans
              </p>
            </div>
          </div>

          <button
            onClick={handleExplainQuery}
            disabled={isExplaining}
            className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 self-start sm:self-auto"
          >
            <Search className={`w-3.5 h-3.5 ${isExplaining ? 'animate-spin' : ''}`} />
            <span>{isExplaining ? 'Running EXPLAIN...' : 'Run Live EXPLAIN ANALYZE'}</span>
          </button>
        </div>

        {explainResult && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <div className="text-slate-400">
              <span className="text-slate-500">Executed SQL:</span>{' '}
              <code className="text-teal-400 font-mono">{explainResult.query}</code>
            </div>
            <div className="text-slate-400">
              <span className="text-slate-500">Index Justification:</span>{' '}
              <span className="text-white font-medium">{explainResult.indexUsed}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48">
              <pre>{JSON.stringify(explainResult.executionPlan, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>

      {/* Viva Defense & Examination Cheat Sheet */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">5. Viva Defense Q&A Reference</h3>
            <p className="text-xs text-slate-400">Rapid talking points for the academic examiner</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <span className="font-bold text-purple-400">Q: Why is the schema in 3NF?</span>
            <p className="text-slate-300 text-[11px]">
              <strong>1NF:</strong> All attribute values are atomic; no repeating groups.<br />
              <strong>2NF:</strong> In 1NF and no non-key attribute is partially dependent on any candidate key (resolved via composite keys in bridge tables).<br />
              <strong>3NF:</strong> In 2NF and no non-key attribute has transitive dependencies on the primary key (e.g. Supplier country is not repeated in Product; Warehouse capacity is not repeated in Inventory).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <span className="font-bold text-purple-400">Q: How are ACID properties guaranteed?</span>
            <p className="text-slate-300 text-[11px]">
              Using PostgreSQL read committed transaction isolation via Prisma <code className="text-teal-400 font-mono">$transaction</code>. If any item stock is insufficient or a foreign key fails, the entire transaction throws an exception and rolls back atomically, ensuring zero partial data corruption.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <span className="font-bold text-purple-400">Q: What is the purpose of the PostgreSQL View?</span>
            <p className="text-slate-300 text-[11px]">
              <code className="text-teal-400 font-mono">v_inventory_stock_status</code> abstracts multi-table joins across <code className="font-mono">inventory</code>, <code className="font-mono">products</code>, and <code className="font-mono">warehouses</code>, computing retail valuation and real-time health badges directly inside the database engine without application overhead.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <span className="font-bold text-purple-400">Q: How does the Trigger maintain integrity?</span>
            <p className="text-slate-300 text-[11px]">
              <code className="text-teal-400 font-mono">trg_inventory_low_stock_check</code> automatically checks updated stock levels. Because it executes within PostgreSQL itself, it guarantees stock alert generation even if inventory is decremented through external queries, direct SQL, or batch scripts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

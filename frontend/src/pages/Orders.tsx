import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  ShoppingCart,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Truck,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Orders: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Place Order Modal
  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [destinationCity, setDestinationCity] = useState('New York');
  const [priority, setPriority] = useState('MEDIUM');
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | ''>('');
  const [orderQuantity, setOrderQuantity] = useState<number>(5);

  // Transaction Status notification
  const [txResult, setTxResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View Order Modal
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const [orderRes, prodRes, invRes] = await Promise.all([
        api.get('/orders'),
        api.get('/products'),
        api.get('/inventory'),
      ]);

      if (orderRes.data.success) setOrders(orderRes.data.data);
      if (prodRes.data.success) {
        setProducts(prodRes.data.data);
        if (prodRes.data.data.length > 0) setSelectedProductId(prodRes.data.data[0].id);
      }
      if (invRes.data.success && invRes.data.data.length > 0) {
        const uniqueWh = Array.from(
          new Map(invRes.data.data.map((item: any) => [item.warehouse.id, item.warehouse])).values()
        );
        setWarehouses(uniqueWh);
        if (uniqueWh.length > 0) setSelectedWarehouseId((uniqueWh[0] as any).id);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !selectedWarehouseId) return;

    setIsSubmitting(true);
    setTxResult(null);

    try {
      const payload = {
        customerName: customerName || 'Metro Retail Logistics Ltd',
        destinationCity,
        priority,
        items: [
          {
            productId: Number(selectedProductId),
            warehouseId: Number(selectedWarehouseId),
            quantity: Number(orderQuantity),
          },
        ],
      };

      const res = await api.post('/orders', payload);
      if (res.data.success) {
        setTxResult({
          success: true,
          message: 'Order created & inventory decremented atomically via ACID Transaction!',
          details: res.data.data,
        });
        setCustomerName('');
        await fetchOrders();
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Transaction aborted and rolled back.';
      setTxResult({
        success: false,
        message: errorMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredOrders = orders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.destinationCity.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <Badge variant="emerald">DELIVERED</Badge>;
      case 'SHIPPED':
      case 'IN_TRANSIT':
        return <Badge variant="blue">{status}</Badge>;
      case 'CONFIRMED':
      case 'PROCESSING':
        return <Badge variant="purple">{status}</Badge>;
      case 'PENDING':
        return <Badge variant="amber">PENDING</Badge>;
      default:
        return <Badge variant="slate">{status}</Badge>;
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'URGENT':
        return <Badge variant="rose">URGENT</Badge>;
      case 'HIGH':
        return <Badge variant="amber">HIGH</Badge>;
      case 'MEDIUM':
        return <Badge variant="blue">MEDIUM</Badge>;
      default:
        return <Badge variant="slate">LOW</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Orders & Atomic Fulfillment</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20">
              ACID Transaction ($transaction)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Atomic order intake, multi-product line items, inventory decrementing, and automatic shipment provisioning.
          </p>
        </div>

        <button
          onClick={() => {
            setIsPlaceModalOpen(true);
            setTxResult(null);
          }}
          className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs transition-all shadow-lg shadow-teal-500/20 flex items-center gap-2 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Place New Order</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800/80 p-3 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search order #, customer, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-3.5 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400">
            Resolved M:N (Orders ↔ Products via <code className="text-teal-400 font-bold">order_items</code>)
          </span>
          <span className="text-xs text-slate-500">Showing {filteredOrders.length} orders</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Order Number</th>
                <th className="px-4 py-3">Customer & Destination</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Total Amount</th>
                <th className="px-4 py-3">Created By</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-5 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="font-mono font-bold text-teal-400">{order.orderNumber}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-white">{order.customerName}</div>
                    <div className="text-slate-400 text-[11px]">{order.destinationCity}</div>
                  </td>
                  <td className="px-4 py-3.5">{getPriorityBadge(order.priority)}</td>
                  <td className="px-4 py-3.5">{getStatusBadge(order.status)}</td>
                  <td className="px-4 py-3.5 text-right font-mono font-bold text-white">
                    ${order.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="text-slate-300 font-medium">{order.createdBy?.fullName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{order.createdBy?.role?.name}</div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-[11px] transition-colors"
                    >
                      View Items
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Place Order Modal (Demonstrating Atomic Transaction) */}
      <Modal
        isOpen={isPlaceModalOpen}
        onClose={() => setIsPlaceModalOpen(false)}
        title="Place New Order (Atomic Transaction)"
        subtitle="Simulates: Lock stock check → Insert Order → Insert Order Items → Decrement Inventory"
        maxWidth="lg"
      >
        <form onSubmit={handlePlaceOrder} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Customer Name
              </label>
              <input
                type="text"
                placeholder="e.g. Apex Global Supply"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Destination City
              </label>
              <select
                value={destinationCity}
                onChange={(e) => setDestinationCity(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
              >
                <option value="New York">New York</option>
                <option value="Los Angeles">Los Angeles</option>
                <option value="Chicago">Chicago</option>
                <option value="Houston">Houston</option>
                <option value="Miami">Miami</option>
                <option value="Seattle">Seattle</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Product
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (${p.unitPrice})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Fulfillment Warehouse
              </label>
              <select
                value={selectedWarehouseId}
                onChange={(e) => setSelectedWarehouseId(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
              >
                {warehouses.map((wh: any) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.city})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={orderQuantity}
                onChange={(e) => setOrderQuantity(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Hint regarding transaction rollback */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <span>
              <strong>ACID Guarantee:</strong> If the ordered quantity exceeds available inventory in the selected warehouse, the database rolls back the entire transaction.
            </span>
          </div>

          {/* Transaction Outcome Alert */}
          {txResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2 ${
                txResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
              }`}
            >
              {txResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold">{txResult.success ? 'Transaction Committed' : 'Transaction Aborted & Rolled Back'}</p>
                <p className="text-[11px] mt-0.5">{txResult.message}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsPlaceModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950 transition-colors flex items-center gap-2"
            >
              {isSubmitting ? 'Executing $transaction...' : 'Execute Order Transaction'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Order Details Modal */}
      <Modal
        isOpen={selectedOrder !== null}
        onClose={() => setSelectedOrder(null)}
        title={`Order Details: ${selectedOrder?.orderNumber}`}
        subtitle={`Placed by ${selectedOrder?.createdBy?.fullName} (${selectedOrder?.createdBy?.role?.name})`}
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500 block">Customer:</span>
              <span className="text-white font-semibold">{selectedOrder?.customerName}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Destination:</span>
              <span className="text-white font-semibold">{selectedOrder?.destinationCity}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Total Amount:</span>
              <span className="text-teal-400 font-mono font-bold">
                ${selectedOrder?.totalAmount?.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Shipment Status:</span>
              <span className="text-slate-300 font-medium">
                {selectedOrder?.shipment?.status || 'PREPARING'} (Tracking: {selectedOrder?.shipment?.trackingNumber || 'Pending'})
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Order Items (Resolved M:N)
            </h4>
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-2.5">Product SKU</th>
                    <th className="px-4 py-2.5">Warehouse</th>
                    <th className="px-4 py-2.5 text-right">Qty</th>
                    <th className="px-4 py-2.5 text-right">Unit Price</th>
                    <th className="px-4 py-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {selectedOrder?.items?.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-800/20">
                      <td className="px-4 py-2.5 font-mono text-teal-400">{item.product?.sku || `Prod #${item.productId}`}</td>
                      <td className="px-4 py-2.5 text-slate-300">{item.warehouse?.name || `WH #${item.warehouseId}`}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-white">{item.quantity}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-300">${item.unitPrice}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-white font-bold">${item.subtotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

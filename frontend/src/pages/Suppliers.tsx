import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  Building2,
  Search,
  Plus,
  Star,
  Clock,
  Mail,
  MapPin,
  Link as LinkIcon,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Suppliers: React.FC = () => {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Add Supplier Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    country: '',
    rating: 4.5,
    leadTimeDays: 7,
  });

  // Link Product Modal
  const [selectedSupplierForLink, setSelectedSupplierForLink] = useState<any | null>(null);
  const [linkProductId, setLinkProductId] = useState<number | ''>('');
  const [supplyPrice, setSupplyPrice] = useState<number>(50);
  const [isPrimary, setIsPrimary] = useState(false);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const [supRes, prodRes] = await Promise.all([
        api.get('/suppliers'),
        api.get('/products'),
      ]);
      if (supRes.data.success) setSuppliers(supRes.data.data);
      if (prodRes.data.success) {
        setProducts(prodRes.data.data);
        if (prodRes.data.data.length > 0) setLinkProductId(prodRes.data.data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/suppliers', {
        ...newSupplier,
        rating: Number(newSupplier.rating),
        leadTimeDays: Number(newSupplier.leadTimeDays),
      });
      if (res.data.success) {
        setIsAddModalOpen(false);
        setNewSupplier({ name: '', email: '', phone: '', city: '', country: '', rating: 4.5, leadTimeDays: 7 });
        await fetchSuppliers();
      }
    } catch (err) {
      console.error('Failed to create supplier:', err);
    }
  };

  const handleLinkProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkProductId || !selectedSupplierForLink) return;

    try {
      const res = await api.post(`/products/${linkProductId}/suppliers`, {
        supplierId: selectedSupplierForLink.id,
        supplyPrice: Number(supplyPrice),
        isPrimary,
      });

      if (res.data.success) {
        setSelectedSupplierForLink(null);
        await fetchSuppliers();
      }
    } catch (err) {
      console.error('Failed to link product:', err);
    }
  };

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Supplier Relationship Network</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20">
              Resolved M:N (Product ↔ Supplier)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Global supplier management, lead time performance metrics, and multi-vendor product agreements.
          </p>
        </div>

        {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs transition-all shadow-lg shadow-teal-500/20 flex items-center gap-2 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800/80 p-3 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search supplier, city, or country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>
      </div>

      {/* Supplier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSuppliers.map((supplier) => (
          <div
            key={supplier.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-colors"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white">{supplier.name}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    <span>{supplier.city}, {supplier.country}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>{supplier.rating.toFixed(1)}</span>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-2 my-4 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-semibold block">Lead Time</span>
                  <span className="text-white font-mono font-bold flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-teal-400" />
                    <span>{supplier.leadTimeDays} days</span>
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-semibold block">Products Linked</span>
                  <span className="text-teal-400 font-mono font-bold mt-0.5 block">
                    {supplier.productSuppliers?.length || 0} items
                  </span>
                </div>
              </div>

              {/* Catalog snippet (M:N) */}
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Contracted Catalog
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {supplier.productSuppliers?.length === 0 ? (
                    <span className="text-[11px] text-slate-500 italic">No products linked yet</span>
                  ) : (
                    supplier.productSuppliers?.map((ps: any) => (
                      <span
                        key={ps.id}
                        className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[10px] text-slate-300 flex items-center gap-1"
                      >
                        <span>{ps.product?.name || `Prod #${ps.productId}`}</span>
                        {ps.isPrimary && (
                          <span className="text-teal-400 font-bold" title="Primary Supplier">★</span>
                        )}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-end">
                <button
                  onClick={() => {
                    setSelectedSupplierForLink(supplier);
                  }}
                  className="px-3 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <LinkIcon className="w-3 h-3" />
                  <span>Link Product (M:N)</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Supplier Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Global Supplier"
        subtitle="Registers a new supplier entity in the 3NF schema"
        maxWidth="md"
      >
        <form onSubmit={handleCreateSupplier} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Supplier Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Apex Semiconductors"
              value={newSupplier.name}
              onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                placeholder="sales@company.com"
                value={newSupplier.email}
                onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Phone
              </label>
              <input
                type="text"
                placeholder="+1-555-0199"
                value={newSupplier.phone}
                onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                City
              </label>
              <input
                type="text"
                required
                placeholder="Munich"
                value={newSupplier.city}
                onChange={(e) => setNewSupplier({ ...newSupplier, city: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Country
              </label>
              <input
                type="text"
                required
                placeholder="Germany"
                value={newSupplier.country}
                onChange={(e) => setNewSupplier({ ...newSupplier, country: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Rating (1.0 to 5.0)
              </label>
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="5.0"
                value={newSupplier.rating}
                onChange={(e) => setNewSupplier({ ...newSupplier, rating: Number(e.target.value) })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Lead Time (Days)
              </label>
              <input
                type="number"
                min="1"
                value={newSupplier.leadTimeDays}
                onChange={(e) => setNewSupplier({ ...newSupplier, leadTimeDays: Number(e.target.value) })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950"
            >
              Create Supplier
            </button>
          </div>
        </form>
      </Modal>

      {/* Link Product Modal */}
      <Modal
        isOpen={selectedSupplierForLink !== null}
        onClose={() => setSelectedSupplierForLink(null)}
        title="Resolve Product ↔ Supplier M:N Relationship"
        subtitle={`Linking a product to supplier: ${selectedSupplierForLink?.name}`}
        maxWidth="md"
      >
        <form onSubmit={handleLinkProduct} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Select Product
            </label>
            <select
              value={linkProductId}
              onChange={(e) => setLinkProductId(Number(e.target.value))}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (SKU: {p.sku})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Agreed Supply Price ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={supplyPrice}
              onChange={(e) => setSupplyPrice(Number(e.target.value))}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPrimaryCheck"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800 text-teal-500 focus:ring-0"
            />
            <label htmlFor="isPrimaryCheck" className="text-xs text-slate-300">
              Set as primary supplier for this product
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedSupplierForLink(null)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950"
            >
              Save Product Supplier Row
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};


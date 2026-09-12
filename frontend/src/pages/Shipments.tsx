import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  Truck,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  MapPin,
  RefreshCw,
} from 'lucide-react';

export const Shipments: React.FC = () => {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<any | null>(null);
  const [evaluatingRiskId, setEvaluatingRiskId] = useState<number | null>(null);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const url = statusFilter === 'ALL' ? '/shipments' : `/shipments?status=${statusFilter}`;
      const res = await api.get(url);
      if (res.data.success) {
        setShipments(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch shipments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, [statusFilter]);

  const handleEvaluateRisk = async (shipmentId: number) => {
    setEvaluatingRiskId(shipmentId);
    try {
      const res = await api.post('/ml/delay-risk', { shipmentId });
      if (res.data.success) {
        await fetchShipments();
        // If viewing this shipment in modal, refresh modal
        if (selectedShipment?.id === shipmentId) {
          const updated = await api.get(`/shipments/${shipmentId}`);
          if (updated.data.success) setSelectedShipment(updated.data.data);
        }
      }
    } catch (err) {
      console.error('Failed to evaluate delay risk:', err);
    } finally {
      setEvaluatingRiskId(null);
    }
  };

  const handleOpenDetail = async (shipment: any) => {
    try {
      const res = await api.get(`/shipments/${shipment.id}`);
      if (res.data.success) setSelectedShipment(res.data.data);
      else setSelectedShipment(shipment);
    } catch {
      setSelectedShipment(shipment);
    }
  };

  const filteredShipments = shipments.filter(
    (s) =>
      s.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.carrierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.order?.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.route?.destinationCity.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <Badge variant="emerald">DELIVERED</Badge>;
      case 'DELAYED':
        return <Badge variant="rose">DELAYED</Badge>;
      case 'IN_TRANSIT':
        return <Badge variant="blue">IN TRANSIT</Badge>;
      case 'OUT_FOR_DELIVERY':
        return <Badge variant="amber">OUT FOR DELIVERY</Badge>;
      case 'PREPARING':
        return <Badge variant="purple">PREPARING</Badge>;
      default:
        return <Badge variant="slate">{status}</Badge>;
    }
  };

  const getRiskBadge = (riskScore?: any) => {
    if (!riskScore) return <Badge variant="slate">NOT EVALUATED</Badge>;
    const level = riskScore.predictedDelayRisk;
    if (level === 'HIGH') return <Badge variant="rose">HIGH RISK ({(riskScore.delayProbability * 100).toFixed(0)}%)</Badge>;
    if (level === 'MEDIUM') return <Badge variant="amber">MEDIUM RISK ({(riskScore.delayProbability * 100).toFixed(0)}%)</Badge>;
    return <Badge variant="emerald">LOW RISK ({(riskScore.delayProbability * 100).toFixed(0)}%)</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Shipment Intelligence & Tracking</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20">
              1:M Milestone Tracking
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-carrier tracking augmented with machine learning delay risk classification.
          </p>
        </div>

        <button
          onClick={fetchShipments}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors flex items-center gap-2 text-xs self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 p-3 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tracking #, carrier, order..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-teal-500"
          >
            <option value="ALL">All Shipment Statuses</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="DELAYED">Delayed</option>
            <option value="PREPARING">Preparing</option>
            <option value="DELIVERED">Delivered</option>
          </select>
        </div>
      </div>

      {/* Shipments Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Tracking Number</th>
                <th className="px-4 py-3">Carrier & Order</th>
                <th className="px-4 py-3">Route (Origin → Dest)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">AI Delay Risk</th>
                <th className="px-4 py-3">Est. Delivery</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredShipments.map((s) => {
                const latestScore = s.riskScores?.[0];
                return (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-bold text-teal-400">{s.trackingNumber}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-white">{s.carrierName}</div>
                      <div className="text-slate-500 font-mono text-[11px]">{s.order?.orderNumber}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-slate-300 font-medium">{s.route?.originWarehouse?.city || 'Hub'} → {s.route?.destinationCity}</div>
                      <div className="text-slate-500 text-[10px]">{s.route?.distanceKm} km • Congestion: {s.route?.trafficCongestion}</div>
                    </td>
                    <td className="px-4 py-3.5">{getStatusBadge(s.status)}</td>
                    <td className="px-4 py-3.5">{getRiskBadge(latestScore)}</td>
                    <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">
                      {s.estimatedDelivery ? new Date(s.estimatedDelivery).toLocaleDateString() : 'TBD'}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleEvaluateRisk(s.id)}
                        disabled={evaluatingRiskId === s.id}
                        className="px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 font-medium text-[11px] transition-colors inline-flex items-center gap-1"
                        title="Evaluate with ML Classifier"
                      >
                        <Sparkles className={`w-3 h-3 ${evaluatingRiskId === s.id ? 'animate-spin' : ''}`} />
                        <span>AI Score</span>
                      </button>
                      <button
                        onClick={() => handleOpenDetail(s)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-[11px] transition-colors"
                      >
                        Timeline
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shipment Details & Timeline Modal */}
      <Modal
        isOpen={selectedShipment !== null}
        onClose={() => setSelectedShipment(null)}
        title={`Shipment: ${selectedShipment?.trackingNumber}`}
        subtitle={`Carrier: ${selectedShipment?.carrierName} • Order #${selectedShipment?.order?.orderNumber}`}
        maxWidth="xl"
      >
        <div className="space-y-5">
          {/* AI Risk Summary Card */}
          {selectedShipment?.riskScores?.[0] && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  <span>AI Predictive Delay Analysis</span>
                </span>
                {getRiskBadge(selectedShipment.riskScores[0])}
              </div>
              <div className="text-xs text-slate-300">
                <span className="text-slate-500">Primary Risk Factor:</span>{' '}
                <span className="font-semibold text-white">{selectedShipment.riskScores[0].primaryRiskFactor}</span>
              </div>
              <div className="text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                <span className="text-teal-400 font-semibold">Suggested Mitigation: </span>
                {selectedShipment.riskScores[0].suggestedMitigation}
              </div>
            </div>
          )}

          {/* Milestone History (1:M shipment_tracking) */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-teal-400" />
              <span>Milestone Tracking History (shipment_tracking table)</span>
            </h4>

            <div className="space-y-3 relative pl-4 before:content-[''] before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {selectedShipment?.trackingHistory?.map((event: any, idx: number) => (
                <div key={event.id || idx} className="relative pl-4">
                  <div className="absolute -left-[18px] top-1 w-2.5 h-2.5 rounded-full bg-teal-400 ring-4 ring-slate-900" />
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{event.statusUpdate}</span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(event.checkpointTimestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px] mt-0.5">Location: {event.location}</div>
                    {event.notes && <p className="text-slate-500 text-[11px] mt-1 italic">{event.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};


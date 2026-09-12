import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Badge } from '../components/common/Badge';
import {
  TrendingUp,
  Sparkles,
  RefreshCw,
  Clock,
  Package,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from 'recharts';

export const DemandForecasting: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-Q4');
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [latestResult, setLatestResult] = useState<any | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, forecastRes] = await Promise.all([
        api.get('/products'),
        api.get('/ml/forecasts'),
      ]);

      if (prodRes.data.success) {
        setProducts(prodRes.data.data);
        if (prodRes.data.data.length > 0) setSelectedProductId(prodRes.data.data[0].id);
      }
      if (forecastRes.data.success) {
        setForecasts(forecastRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load forecasting data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateForecast = async () => {
    if (!selectedProductId) return;
    setIsGenerating(true);
    try {
      const res = await api.post('/ml/forecast', {
        productId: Number(selectedProductId),
        forecastPeriod: selectedPeriod,
      });

      if (res.data.success) {
        setLatestResult(res.data.data);
        await fetchData();
      }
    } catch (err) {
      console.error('Forecast generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedProduct = products.find((p) => p.id === Number(selectedProductId));

  // Build chart comparison data
  const chartData = forecasts
    .filter((f) => f.productId === Number(selectedProductId))
    .slice(0, 6)
    .map((f) => ({
      period: f.forecastPeriod,
      historicalAvg: f.historicalAvgSales,
      predictedDemand: f.predictedDemand,
      suggestedReorder: f.suggestedReorderQty,
    }));

  if (chartData.length === 0 && selectedProduct) {
    chartData.push({
      period: '2026-Q4',
      historicalAvg: 38,
      predictedDemand: 46,
      suggestedReorder: 55,
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Predictive Demand Intelligence</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20">
              Scikit-learn RandomForestRegressor
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Offline-trained regression models persisted with joblib and served via stateless FastAPI microservice.
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

      {/* Model Control Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <h3 className="text-base font-bold text-white">Generate Real-Time Demand Inference</h3>
            </div>
            <p className="text-xs text-slate-400 max-w-xl">
              Select any inventory SKU to feed historical order velocity, lead time, and price elasticity into the machine learning regressor. Predictions are persisted into the <code className="text-teal-400 font-mono">demand_forecasts</code> relational table.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(Number(e.target.value))}
              className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>

            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
            >
              <option value="2026-Q4">2026-Q4 (Upcoming)</option>
              <option value="2027-Q1">2027-Q1</option>
              <option value="2027-Q2">2027-Q2</option>
            </select>

            <button
              onClick={handleGenerateForecast}
              disabled={isGenerating}
              className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-teal-500/20 flex items-center gap-2"
            >
              <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Predicting via FastAPI...' : 'Run ML Forecast'}</span>
            </button>
          </div>
        </div>

        {/* Latest Prediction Output Banner */}
        {latestResult && (
          <div className="mt-5 p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-white text-sm">
                  {latestResult.product?.name || 'Product'} Forecast Generated!
                </span>
                <p className="text-teal-300/80 text-[11px] mt-0.5">
                  Saved to database (Record #{latestResult.id} • Model confidence: {(latestResult.confidenceScore * 100).toFixed(0)}%)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-teal-500/20 pt-2 sm:pt-0 sm:pl-4">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">Predicted Demand</span>
                <span className="text-white font-mono font-bold text-sm">{latestResult.predictedDemand} units</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">Suggested Reorder</span>
                <span className="text-teal-400 font-mono font-bold text-sm">{latestResult.suggestedReorderQty} units</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart: Historical vs Predicted Demand */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Historical Average vs ML Predicted Demand</h3>
            <p className="text-xs text-slate-400">RandomForestRegressor predictive trend compared against baseline sales</p>
          </div>
          <span className="text-xs font-mono text-teal-400 px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/20">
            Recharts Visualization
          </span>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="period" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="historicalAvg" name="Historical Baseline (Units)" fill="#64748b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="predictedDemand" name="ML Predicted Demand (Units)" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="suggestedReorder" name="Suggested Reorder Quantity" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Historical Forecast Records Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-3.5 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400">
            Database Archive: <code className="text-teal-400 font-bold">SELECT * FROM demand_forecasts</code>
          </span>
          <span className="text-xs text-slate-500">Showing {forecasts.length} persisted records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Forecast ID</th>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3 text-right">Historical Avg</th>
                <th className="px-4 py-3 text-right">Predicted Demand</th>
                <th className="px-4 py-3 text-right">Confidence</th>
                <th className="px-4 py-3 text-right">Suggested Restock</th>
                <th className="px-4 py-3">Generated By</th>
                <th className="px-5 py-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {forecasts.map((f) => (
                <tr key={f.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-slate-500">#{f.id}</td>
                  <td className="px-4 py-3.5 font-semibold text-white">{f.product?.name}</td>
                  <td className="px-4 py-3.5 font-mono text-teal-400">{f.forecastPeriod}</td>
                  <td className="px-4 py-3.5 text-right font-mono text-slate-400">{f.historicalAvgSales}</td>
                  <td className="px-4 py-3.5 text-right font-mono font-bold text-white">{f.predictedDemand}</td>
                  <td className="px-4 py-3.5 text-right font-mono text-emerald-400">
                    {(f.confidenceScore * 100).toFixed(0)}%
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-bold text-purple-400">
                    {f.suggestedReorderQty}
                  </td>
                  <td className="px-4 py-3.5 text-slate-300">{f.createdBy?.fullName || 'System ML'}</td>
                  <td className="px-5 py-3.5 text-right font-mono text-slate-500 text-[11px]">
                    {new Date(f.generatedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


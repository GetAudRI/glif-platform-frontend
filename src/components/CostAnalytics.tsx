import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Activity, BarChart3, Calendar, Cpu } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const API_BASE = 'http://localhost:5002';

interface CostSummary {
  total_cost: number;
  total_operations: number;
  avg_cost_per_operation: number;
  breakdown: {
    playbooks: number;
    documents: number;
    validations: number;
  };
}

interface DailyCost {
  date: string;
  cost: number;
  operations: number;
}

interface ModelCost {
  model: string;
  cost: number;
  operations: number;
  avg_cost: number;
}

export default function CostAnalytics() {
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [dailyCosts, setDailyCosts] = useState<DailyCost[]>([]);
  const [modelCosts, setModelCosts] = useState<ModelCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCostData();
  }, []);

  async function loadCostData() {
    setLoading(true);
    setError('');
    const errors: string[] = [];
    
    try {
      // Load summary
      try {
        const summaryRes = await fetch(`${API_BASE}/analytics/api/costs/summary`);
        if (summaryRes.ok) {
          const summaryData = await summaryRes.json();
          setSummary(summaryData);
        } else {
          const errorData = await summaryRes.json().catch(() => ({}));
          errors.push(`Summary: ${errorData.error || summaryRes.statusText}`);
        }
      } catch (err: any) {
        errors.push(`Summary: ${err.message}`);
      }

      // Load daily costs
      try {
        const dailyRes = await fetch(`${API_BASE}/analytics/api/costs/daily`);
        if (dailyRes.ok) {
          const dailyData = await dailyRes.json();
          setDailyCosts(Array.isArray(dailyData) ? dailyData : []);
        } else {
          const errorData = await dailyRes.json().catch(() => ({}));
          errors.push(`Daily costs: ${errorData.error || dailyRes.statusText}`);
        }
      } catch (err: any) {
        errors.push(`Daily costs: ${err.message}`);
      }

      // Load model costs
      try {
        const modelRes = await fetch(`${API_BASE}/analytics/api/costs/by-model`);
        if (modelRes.ok) {
          const modelData = await modelRes.json();
          setModelCosts(Array.isArray(modelData) ? modelData : []);
        } else {
          const errorData = await modelRes.json().catch(() => ({}));
          errors.push(`Model costs: ${errorData.error || modelRes.statusText}`);
        }
      } catch (err: any) {
        errors.push(`Model costs: ${err.message}`);
      }

      // Show errors if any, but don't block the UI if some data loaded
      if (errors.length > 0) {
        setError(`Some data failed to load: ${errors.join('; ')}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load cost analytics');
      console.error('Cost analytics error:', err);
    } finally {
      setLoading(false);
    }
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-blue-600" />
            Cost Analytics
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Track AI operation costs and usage across all modules
          </p>
        </div>
        <button
          onClick={loadCostData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Cost</span>
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              ${summary.total_cost.toFixed(4)}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Operations</span>
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {summary.total_operations.toLocaleString()}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Avg Cost/Operation</span>
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              ${summary.avg_cost_per_operation.toFixed(4)}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Breakdown</span>
              <BarChart3 className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <div>Playbooks: ${summary.breakdown.playbooks.toFixed(4)}</div>
              <div>Documents: ${summary.breakdown.documents.toFixed(4)}</div>
              <div>Validations: ${summary.breakdown.validations.toFixed(4)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Costs Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Daily Costs (Last 30 Days)
          </h3>
          {dailyCosts.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyCosts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number) => `$${value.toFixed(4)}`}
                  labelStyle={{ color: '#374151' }}
                />
                <Legend />
                <Bar dataKey="cost" fill="#3b82f6" name="Cost ($)" />
                <Bar dataKey="operations" fill="#10b981" name="Operations" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-gray-500 py-12">
              No daily cost data available
            </div>
          )}
        </div>

        {/* Model Costs Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-600" />
            Costs by AI Model
          </h3>
          {modelCosts.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={modelCosts}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ model, percent }) => `${model}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="cost"
                >
                  {modelCosts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value.toFixed(4)}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-gray-500 py-12">
              No model cost data available
            </div>
          )}
        </div>
      </div>

      {/* Model Costs Table */}
      {modelCosts.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Model Cost Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Model</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Total Cost</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Operations</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Avg Cost</th>
                </tr>
              </thead>
              <tbody>
                {modelCosts.map((model, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900 font-mono text-sm">{model.model}</td>
                    <td className="py-3 px-4 text-right text-gray-900 font-semibold">
                      ${model.cost.toFixed(4)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {model.operations.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      ${model.avg_cost.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


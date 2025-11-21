import { useMemo } from 'react';
import { TrendingUp, Zap, CheckCircle2, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ProcessingVelocityDashboardProps {
  className?: string;
}

export default function ProcessingVelocityDashboard({ className = '' }: ProcessingVelocityDashboardProps) {
  // Generate 24-hour processing data with realistic patterns
  const hourlyData = useMemo(() => {
    const hours = [];
    const now = new Date();
    
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourLabel = hour.getHours();
      
      // Business hours spike (9am-5pm), lower at night
      let baseRate = 50;
      if (hourLabel >= 9 && hourLabel <= 17) {
        baseRate = 120 + Math.random() * 40;
      } else if (hourLabel >= 6 && hourLabel < 9) {
        baseRate = 80 + Math.random() * 20;
      } else {
        baseRate = 30 + Math.random() * 20;
      }
      
      hours.push({
        time: `${hourLabel.toString().padStart(2, '0')}:00`,
        claims: Math.round(baseRate),
      });
    }
    
    return hours;
  }, []);

  const totalToday = useMemo(() => {
    return hourlyData.reduce((sum, h) => sum + h.claims, 0);
  }, [hourlyData]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Hero Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Claims Processed Today */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <Zap className="w-8 h-8 opacity-80" />
            <div className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">
              TODAY
            </div>
          </div>
          <div className="text-4xl font-bold mb-1">
            {totalToday.toLocaleString()}
          </div>
          <div className="text-blue-100 text-sm font-medium">
            Auto Claims Audited
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-blue-100">
            <TrendingUp className="w-4 h-4" />
            <span>+22% vs yesterday</span>
          </div>
        </div>

        {/* Processing Speed */}
        <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <Clock className="w-8 h-8 opacity-80" />
            <div className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">
              AVG TIME
            </div>
          </div>
          <div className="text-4xl font-bold mb-1">
            3.2<span className="text-2xl">min</span>
          </div>
          <div className="text-green-100 text-sm font-medium">
            Per Claim Audit
          </div>
          <div className="mt-3 text-xs text-green-100">
            Traditional: 4-6 hours
          </div>
        </div>

        {/* Audit Coverage */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <CheckCircle2 className="w-8 h-8 opacity-80" />
            <div className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">
              COVERAGE
            </div>
          </div>
          <div className="text-4xl font-bold mb-1">
            100<span className="text-2xl">%</span>
          </div>
          <div className="text-purple-100 text-sm font-medium">
            Audit Coverage
          </div>
          <div className="mt-3 text-xs text-purple-100">
            Traditional: 2-5% sample
          </div>
        </div>

        {/* Current Backlog */}
        <div className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 flex items-center justify-center text-2xl opacity-80">
              ⚡
            </div>
            <div className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">
              QUEUE
            </div>
          </div>
          <div className="text-4xl font-bold mb-1">
            0
          </div>
          <div className="text-teal-100 text-sm font-medium">
            Claims Backlog
          </div>
          <div className="mt-3 text-xs text-teal-100">
            Real-time processing
          </div>
        </div>
      </div>

      {/* Main Content: Before/After + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Before/After Comparison */}
        <div className="lg:col-span-1 bg-white rounded-xl border-2 border-gray-200 p-6 shadow-md">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <div className="w-2 h-8 bg-blue-500 rounded"></div>
            Impact Comparison
          </h3>

          {/* Traditional Approach */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm">
                Old
              </div>
              <h4 className="font-semibold text-gray-700">Traditional Manual Audit</h4>
            </div>
            <div className="space-y-2 ml-10">
              <div className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900">50 claims/week</div>
                  <div className="text-xs text-gray-600">Manual sample review</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900">2-5% coverage</div>
                  <div className="text-xs text-gray-600">Limited sampling</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900">4-6 hours/claim</div>
                  <div className="text-xs text-gray-600">Per audit time</div>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-300"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-sm font-bold text-gray-500">VS</span>
            </div>
          </div>

          {/* GLIF Approach */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-sm">
                New
              </div>
              <h4 className="font-semibold text-gray-700">GLIF AuditOversight</h4>
            </div>
            <div className="space-y-2 ml-10">
              <div className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">•</span>
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900">{totalToday.toLocaleString()} claims/day</div>
                  <div className="text-xs text-gray-600">Automated processing</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">•</span>
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900">100% coverage</div>
                  <div className="text-xs text-gray-600">Complete validation</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">•</span>
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900">3.2 minutes/claim</div>
                  <div className="text-xs text-gray-600">Per audit time</div>
                </div>
              </div>
            </div>
          </div>

          {/* Efficiency Multiplier */}
          <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border-2 border-blue-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">1,240×</div>
              <div className="text-sm font-semibold text-gray-700">Faster than manual audits</div>
            </div>
          </div>
        </div>

        {/* 24-Hour Processing Timeline */}
        <div className="lg:col-span-2 bg-white rounded-xl border-2 border-gray-200 p-6 shadow-md">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <div className="w-2 h-8 bg-blue-500 rounded"></div>
                Processing Velocity (Last 24 Hours)
              </h3>
              <div className="flex items-center gap-2 text-sm">
                <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                  🔴 LIVE
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 ml-4">
              Real-time audit throughput across all auto claims
            </p>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={hourlyData}>
              <defs>
                <linearGradient id="colorClaims" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="time" 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                interval={2}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                label={{ value: 'Claims Audited', angle: -90, position: 'insideLeft', style: { fontSize: '12px', fill: '#6b7280' } }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e3a8a', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '12px'
                }}
                labelStyle={{ color: '#93c5fd', fontWeight: 'bold' }}
              />
              <Line 
                type="monotone" 
                dataKey="claims" 
                stroke="#3b82f6" 
                strokeWidth={3}
                fill="url(#colorClaims)"
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6, fill: '#1e40af' }}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Current Rate Indicator */}
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-blue-600">
                {hourlyData[hourlyData.length - 1]?.claims || 0}
              </div>
              <div className="text-xs text-gray-600 font-medium">Current Hour</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-green-600">
                {Math.max(...hourlyData.map(h => h.claims))}
              </div>
              <div className="text-xs text-gray-600 font-medium">Peak Hour</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-purple-600">
                {Math.round(hourlyData.reduce((sum, h) => sum + h.claims, 0) / hourlyData.length)}
              </div>
              <div className="text-xs text-gray-600 font-medium">Avg/Hour</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

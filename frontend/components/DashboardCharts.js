import React from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const COLORS = ['#06b6d4', '#a855f7', '#fbbf24', '#f43f5e', '#3b82f6'];

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/90 border border-white/20 p-4 rounded-lg shadow-xl backdrop-blur-md">
        <p className="text-white font-semibold mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm font-medium">
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/90 border border-white/20 p-4 rounded-lg shadow-xl backdrop-blur-md">
        <p className="text-white font-semibold">{payload[0].name}</p>
        <p className="text-white/90 text-sm mt-1 font-semibold">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export default function DashboardCharts({ chartData }) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !chartData) {
    return (
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
        <div className="lg:col-span-2 holographic-card rounded-xl p-6 h-[384px] animate-pulse"></div>
        <div className="lg:col-span-1 holographic-card rounded-xl p-6 h-[384px] animate-pulse"></div>
      </div>
    );
  }

  const { monthly_revenue = [], top_customers = [] } = chartData;


  return (
    <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Revenue vs Purchases Chart */}
      <div className="lg:col-span-2 holographic-card rounded-xl p-6">
        <h3 className="text-white font-semibold mb-6">6-Month Cash Flow (Sales vs Purchases)</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monthly_revenue} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="sales" name="Sales" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Line type="monotone" dataKey="purchases" name="Purchases" stroke="#a855f7" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Customers Pie Chart */}
      <div className="lg:col-span-1 holographic-card rounded-xl p-6">
        <h3 className="text-white font-semibold mb-6">Top 5 Customers</h3>
        <div className="h-72">
          {top_customers.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={top_customers}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {top_customers.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#e2e8f0', marginTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400/50 text-sm">
              No sales data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

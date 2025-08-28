import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

// Color schemes for different chart types
const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
const GRADIENTS = [
  { id: 'colorUv', color: '#2563eb' },
  { id: 'colorPv', color: '#10b981' },
  { id: 'colorTv', color: '#f59e0b' }
];

// Reusable Chart Container
export const ChartContainer = ({ title, subtitle, children, className = "" }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
    {title && (
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
      </div>
    )}
    <div className="w-full h-80">
      {children}
    </div>
  </div>
);

// Order Trend Line Chart
export const OrderTrendChart = ({ data }) => (
  <ChartContainer title="Order Trends" subtitle="Orders over time">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="orders" 
          stroke="#2563eb" 
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        <Line 
          type="monotone" 
          dataKey="completed" 
          stroke="#10b981" 
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  </ChartContainer>
);

// Revenue Area Chart
export const RevenueChart = ({ data }) => (
  <ChartContainer title="Revenue Analysis" subtitle="Revenue trends and projections">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#2563eb"
          fillOpacity={1}
          fill="url(#colorRevenue)"
        />
      </AreaChart>
    </ResponsiveContainer>
  </ChartContainer>
);

// Order Status Distribution Pie Chart
export const OrderStatusChart = ({ data }) => (
  <ChartContainer title="Order Status Distribution" subtitle="Current order status breakdown">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  </ChartContainer>
);

// Vehicle Performance Bar Chart
export const VehiclePerformanceChart = ({ data }) => (
  <ChartContainer title="Vehicle Performance" subtitle="Delivery performance by vehicle">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="vehicle" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="deliveries" fill="#2563eb" />
        <Bar dataKey="onTime" fill="#10b981" />
        <Bar dataKey="delayed" fill="#ef4444" />
      </BarChart>
    </ResponsiveContainer>
  </ChartContainer>
);

// Top Products Chart
export const TopProductsChart = ({ data }) => (
  <ChartContainer title="Top Products" subtitle="Best selling products this month">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="horizontal">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="product" type="category" width={100} />
        <Tooltip />
        <Bar dataKey="sales" fill="#2563eb" />
      </BarChart>
    </ResponsiveContainer>
  </ChartContainer>
);

// Shipment Timeline Chart
export const ShipmentTimelineChart = ({ data }) => (
  <ChartContainer title="Shipment Timeline" subtitle="Average delivery times by route">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="route" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="avgTime" fill="#8b5cf6" />
        <Bar dataKey="target" fill="#06b6d4" />
      </BarChart>
    </ResponsiveContainer>
  </ChartContainer>
);

// KPI Card Component
export const KPICard = ({ title, value, change, icon, color = "blue" }) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    yellow: "bg-yellow-50 text-yellow-600 border-yellow-200",
    red: "bg-red-50 text-red-600 border-red-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200"
  };

  return (
    <div className={`rounded-lg border p-6 ${colorClasses[color]}`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          {icon && <div className="text-2xl">{icon}</div>}
        </div>
        <div className="ml-4">
          <dt className="text-sm font-medium truncate">{title}</dt>
          <dd className="mt-1 text-3xl font-semibold">{value}</dd>
          {change && (
            <dd className={`mt-1 text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '+' : ''}{change}%
            </dd>
          )}
        </div>
      </div>
    </div>
  );
};

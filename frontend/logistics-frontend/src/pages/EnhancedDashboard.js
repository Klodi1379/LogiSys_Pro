import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import { 
  OrderTrendChart, 
  RevenueChart, 
  OrderStatusChart, 
  VehiclePerformanceChart,
  TopProductsChart,
  ShipmentTimelineChart,
  KPICard 
} from '../components/charts/ChartComponents';

const EnhancedDashboard = () => {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState({
    orderTrends: [],
    revenue: [],
    orderStatus: [],
    vehiclePerformance: [],
    topProducts: [],
    shipmentTimeline: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTimeframe, setActiveTimeframe] = useState('7d');
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    fetchStats();
    generateMockChartData(); // In a real app, this would come from API
  }, [activeTimeframe]);

  // Auto refresh every 30 seconds if enabled
  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchStats, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await dashboardAPI.getStats();
      setStats(data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate mock chart data (replace with real API calls)
  const generateMockChartData = () => {
    const orderTrends = Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      orders: Math.floor(Math.random() * 50) + 10,
      completed: Math.floor(Math.random() * 40) + 5
    }));

    const revenue = Array.from({ length: 6 }, (_, i) => ({
      month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i],
      revenue: Math.floor(Math.random() * 50000) + 20000
    }));

    const orderStatus = [
      { name: 'Pending', value: 24 },
      { name: 'Processing', value: 18 },
      { name: 'Shipped', value: 32 },
      { name: 'Delivered', value: 67 },
      { name: 'Cancelled', value: 5 }
    ];

    const vehiclePerformance = [
      { vehicle: 'VH-001', deliveries: 45, onTime: 42, delayed: 3 },
      { vehicle: 'VH-002', deliveries: 38, onTime: 35, delayed: 3 },
      { vehicle: 'VH-003', deliveries: 52, onTime: 48, delayed: 4 },
      { vehicle: 'VH-004', deliveries: 29, onTime: 27, delayed: 2 }
    ];

    const topProducts = [
      { product: 'Product A', sales: 125 },
      { product: 'Product B', sales: 98 },
      { product: 'Product C', sales: 87 },
      { product: 'Product D', sales: 76 },
      { product: 'Product E', sales: 65 }
    ];

    const shipmentTimeline = [
      { route: 'Route A', avgTime: 2.5, target: 3 },
      { route: 'Route B', avgTime: 4.2, target: 4.5 },
      { route: 'Route C', avgTime: 1.8, target: 2 },
      { route: 'Route D', avgTime: 3.7, target: 4 }
    ];

    setChartData({
      orderTrends,
      revenue,
      orderStatus,
      vehiclePerformance,
      topProducts,
      shipmentTimeline
    });
  };

  const timeframes = [
    { key: '24h', label: '24 Hours' },
    { key: '7d', label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: '3m', label: '3 Months' }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <strong>Error:</strong> {error}
        <button 
          onClick={fetchStats}
          className="ml-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            Real-time insights into your logistics operations
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:flex sm:items-center space-x-4">
          {/* Auto Refresh Toggle */}
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Auto refresh</span>
          </label>

          {/* Timeframe Selector */}
          <div className="flex rounded-md shadow-sm">
            {timeframes.map((timeframe) => (
              <button
                key={timeframe.key}
                onClick={() => setActiveTimeframe(timeframe.key)}
                className={`px-4 py-2 text-sm font-medium border ${
                  activeTimeframe === timeframe.key
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                } ${timeframe.key === timeframes[0].key ? 'rounded-l-md' : ''} ${
                  timeframe.key === timeframes[timeframes.length - 1].key ? 'rounded-r-md' : ''
                }`}
              >
                {timeframe.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Orders"
          value={stats?.total_orders || 0}
          change={5.2}
          icon="📦"
          color="blue"
        />
        <KPICard
          title="Revenue"
          value={`$${((stats?.total_revenue || 0) / 1000).toFixed(1)}k`}
          change={12.5}
          icon="💰"
          color="green"
        />
        <KPICard
          title="Active Vehicles"
          value={stats?.available_vehicles || 0}
          change={-2.3}
          icon="🚛"
          color="yellow"
        />
        <KPICard
          title="On-Time Delivery"
          value="94.2%"
          change={1.8}
          icon="⏱️"
          color="purple"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OrderTrendChart data={chartData.orderTrends} />
        <RevenueChart data={chartData.revenue} />
        <OrderStatusChart data={chartData.orderStatus} />
        <VehiclePerformanceChart data={chartData.vehiclePerformance} />
        <TopProductsChart data={chartData.topProducts} />
        <ShipmentTimelineChart data={chartData.shipmentTimeline} />
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats?.recent_orders?.slice(0, 5).map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(order.order_date).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    New order #{order.order_number} from {order.customer_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status}
                    </span>
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

export default EnhancedDashboard;

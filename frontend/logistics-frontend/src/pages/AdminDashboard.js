import React, { useState, useEffect } from 'react';
import { useNotifications } from '../components/notifications/NotificationSystem';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const [systemStats, setSystemStats] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [systemHealth, setSystemHealth] = useState('healthy');
  const [activeUsers, setActiveUsers] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedTab, setSelectedTab] = useState('overview');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showSystemConfig, setShowSystemConfig] = useState(false);
  
  const { success, error, info, warning } = useNotifications();
  const { user } = useAuth();

  // System configuration form
  const [systemConfig, setSystemConfig] = useState({
    max_concurrent_users: 100,
    session_timeout: 30,
    backup_frequency: 'daily',
    notification_email: 'admin@logistics.com',
    maintenance_mode: false,
    debug_mode: false,
    api_rate_limit: 1000
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      error('Access denied. Admin privileges required.');
      return;
    }
    
    fetchAdminData();
    
    // Set up real-time updates
    const interval = setInterval(fetchPerformanceMetrics, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Simulate admin data fetching
      await generateMockAdminData();
      
    } catch (err) {
      error('Failed to load admin dashboard data');
      console.error('Admin dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformanceMetrics = async () => {
    // Real-time performance data simulation
    const newMetric = {
      timestamp: new Date().toLocaleTimeString(),
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      network: Math.random() * 1000,
      requests: Math.floor(Math.random() * 200) + 50
    };
    
    setPerformanceMetrics(prev => [...prev.slice(-19), newMetric]);
  };

  const generateMockAdminData = async () => {
    // Mock system statistics
    setSystemStats({
      total_users: 1247,
      active_sessions: 89,
      total_orders: 15847,
      total_revenue: 2847593.45,
      system_uptime: '99.7%',
      avg_response_time: 145,
      database_size: '2.4 GB',
      storage_used: '847 MB'
    });

    // Mock performance metrics
    const metrics = Array.from({ length: 20 }, (_, i) => ({
      timestamp: new Date(Date.now() - (19 - i) * 60000).toLocaleTimeString(),
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      network: Math.random() * 1000,
      requests: Math.floor(Math.random() * 200) + 50
    }));
    setPerformanceMetrics(metrics);

    // Mock user activity
    setUserActivity([
      { hour: '00:00', users: 12 },
      { hour: '04:00', users: 8 },
      { hour: '08:00', users: 45 },
      { hour: '12:00', users: 89 },
      { hour: '16:00', users: 67 },
      { hour: '20:00', users: 34 }
    ]);

    // Mock active users
    setActiveUsers([
      { id: 1, name: 'John Doe', role: 'manager', lastActivity: '2 min ago', status: 'active' },
      { id: 2, name: 'Jane Smith', role: 'driver', lastActivity: '5 min ago', status: 'active' },
      { id: 3, name: 'Bob Wilson', role: 'admin', lastActivity: '1 min ago', status: 'active' },
      { id: 4, name: 'Alice Brown', role: 'manager', lastActivity: '3 min ago', status: 'idle' }
    ]);

    // Mock system logs
    setSystemLogs([
      { id: 1, level: 'info', message: 'User login successful', timestamp: new Date().toISOString(), user: 'john.doe' },
      { id: 2, level: 'warning', message: 'High memory usage detected', timestamp: new Date(Date.now() - 300000).toISOString(), system: 'server-01' },
      { id: 3, level: 'error', message: 'Database connection timeout', timestamp: new Date(Date.now() - 600000).toISOString(), system: 'database' },
      { id: 4, level: 'info', message: 'Backup completed successfully', timestamp: new Date(Date.now() - 900000).toISOString(), system: 'backup-service' }
    ]);

    // Determine system health
    const avgCpu = metrics.reduce((sum, m) => sum + m.cpu, 0) / metrics.length;
    if (avgCpu > 80) setSystemHealth('critical');
    else if (avgCpu > 60) setSystemHealth('warning');
    else setSystemHealth('healthy');
  };

  const handleSystemConfigSave = async (e) => {
    e.preventDefault();
    try {
      // Mock API call to save system configuration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      success('System configuration updated successfully!');
      setShowSystemConfig(false);
    } catch (err) {
      error('Failed to update system configuration');
    }
  };

  const handleMaintenanceToggle = async () => {
    try {
      const newMode = !systemConfig.maintenance_mode;
      setSystemConfig({ ...systemConfig, maintenance_mode: newMode });
      
      if (newMode) {
        warning('Maintenance mode activated. Users will be notified.');
      } else {
        success('Maintenance mode deactivated. System is now available.');
      }
    } catch (err) {
      error('Failed to toggle maintenance mode');
    }
  };

  const handleUserAction = (action, userId) => {
    switch (action) {
      case 'suspend':
        warning(`User ${userId} has been suspended`);
        break;
      case 'activate':
        success(`User ${userId} has been activated`);
        break;
      case 'reset_password':
        info(`Password reset email sent to user ${userId}`);
        break;
      default:
        break;
    }
  };

  const getHealthColor = (health) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthBadge = (health) => {
    switch (health) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'info': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const tabs = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'performance', label: 'Performance', icon: '⚡' },
    { key: 'users', label: 'Users', icon: '👥' },
    { key: 'logs', label: 'System Logs', icon: '📝' },
    { key: 'config', label: 'Configuration', icon: '⚙️' }
  ];

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">Administrator privileges are required to access this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Administration</h1>
          <p className="mt-2 text-sm text-gray-700">
            Monitor system health, manage users, and configure system settings
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:flex sm:items-center space-x-3">
          <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${getHealthBadge(systemHealth)}`}>
            System Health: {systemHealth.charAt(0).toUpperCase() + systemHealth.slice(1)}
          </span>
          <button
            onClick={handleMaintenanceToggle}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium ${
              systemConfig.maintenance_mode 
                ? 'text-white bg-red-600 hover:bg-red-700'
                : 'text-white bg-orange-600 hover:bg-orange-700'
            }`}
          >
            {systemConfig.maintenance_mode ? 'Exit Maintenance' : 'Maintenance Mode'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* System Stats Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">👥</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                      <dd className="text-lg font-medium text-gray-900">{systemStats?.total_users}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">🔄</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Sessions</dt>
                      <dd className="text-lg font-medium text-gray-900">{systemStats?.active_sessions}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">📊</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">System Uptime</dt>
                      <dd className="text-lg font-medium text-gray-900">{systemStats?.system_uptime}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">⚡</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Avg Response</dt>
                      <dd className="text-lg font-medium text-gray-900">{systemStats?.avg_response_time}ms</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* User Activity Chart */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Activity (24h)</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="users" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'performance' && (
        <div className="space-y-6">
          {/* Real-time Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">CPU & Memory Usage</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="cpu" stroke="#ef4444" name="CPU %" />
                    <Line type="monotone" dataKey="memory" stroke="#2563eb" name="Memory %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Network & Requests</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="network" stroke="#10b981" name="Network (KB/s)" />
                    <Line type="monotone" dataKey="requests" stroke="#f59e0b" name="Requests/min" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'users' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Active Users</h3>
            <button
              onClick={() => setShowUserModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Manage Users
            </button>
          </div>
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.lastActivity}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleUserAction('suspend', user.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Suspend
                        </button>
                        <button
                          onClick={() => handleUserAction('reset_password', user.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Reset Password
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedTab === 'logs' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">System Logs</h3>
          </div>
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {systemLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getLevelColor(log.level)}`}>
                        {log.level.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{log.message}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.user || log.system}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedTab === 'config' && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">System Configuration</h3>
            <button
              onClick={() => setShowSystemConfig(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Edit Configuration
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">General Settings</h4>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Max Concurrent Users:</dt>
                  <dd className="text-sm text-gray-900">{systemConfig.max_concurrent_users}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Session Timeout:</dt>
                  <dd className="text-sm text-gray-900">{systemConfig.session_timeout} minutes</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Backup Frequency:</dt>
                  <dd className="text-sm text-gray-900">{systemConfig.backup_frequency}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">API Rate Limit:</dt>
                  <dd className="text-sm text-gray-900">{systemConfig.api_rate_limit}/hour</dd>
                </div>
              </dl>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">System Modes</h4>
              <dl className="space-y-2">
                <div className="flex justify-between items-center">
                  <dt className="text-sm text-gray-500">Maintenance Mode:</dt>
                  <dd className={`text-sm font-medium ${
                    systemConfig.maintenance_mode ? 'text-orange-600' : 'text-green-600'
                  }`}>
                    {systemConfig.maintenance_mode ? 'Enabled' : 'Disabled'}
                  </dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-sm text-gray-500">Debug Mode:</dt>
                  <dd className={`text-sm font-medium ${
                    systemConfig.debug_mode ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {systemConfig.debug_mode ? 'Enabled' : 'Disabled'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Notification Email:</dt>
                  <dd className="text-sm text-gray-900">{systemConfig.notification_email}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}

      {/* System Configuration Modal */}
      {showSystemConfig && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-2/3 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">System Configuration</h3>
            <form onSubmit={handleSystemConfigSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Concurrent Users</label>
                  <input
                    type="number"
                    value={systemConfig.max_concurrent_users}
                    onChange={(e) => setSystemConfig({ ...systemConfig, max_concurrent_users: parseInt(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Session Timeout (minutes)</label>
                  <input
                    type="number"
                    value={systemConfig.session_timeout}
                    onChange={(e) => setSystemConfig({ ...systemConfig, session_timeout: parseInt(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Backup Frequency</label>
                  <select
                    value={systemConfig.backup_frequency}
                    onChange={(e) => setSystemConfig({ ...systemConfig, backup_frequency: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">API Rate Limit (per hour)</label>
                  <input
                    type="number"
                    value={systemConfig.api_rate_limit}
                    onChange={(e) => setSystemConfig({ ...systemConfig, api_rate_limit: parseInt(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Notification Email</label>
                  <input
                    type="email"
                    value={systemConfig.notification_email}
                    onChange={(e) => setSystemConfig({ ...systemConfig, notification_email: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={systemConfig.debug_mode}
                    onChange={(e) => setSystemConfig({ ...systemConfig, debug_mode: e.target.checked })}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable Debug Mode</span>
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Save Configuration
                </button>
                <button
                  type="button"
                  onClick={() => setShowSystemConfig(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

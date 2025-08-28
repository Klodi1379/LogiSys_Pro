import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../components/notifications/NotificationSystem';
import { 
  MagnifyingGlassIcon, 
  BellIcon, 
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  CogIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

const EnhancedLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  
  const { user, logout } = useAuth();
  const { info } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const userMenuRef = useRef(null);
  const notificationRef = useRef(null);

  // Role-based navigation configuration
  const getNavigationForRole = (userRole) => {
    const baseNav = [
      { name: 'Dashboard', href: '/dashboard', icon: '📊', roles: ['admin', 'manager', 'driver'] },
      { name: 'Orders', href: '/orders', icon: '📦', roles: ['admin', 'manager'] },
      { name: 'Products', href: '/products', icon: '🏷️', roles: ['admin', 'manager'] },
      { name: 'Inventory', href: '/inventory', icon: '📋', roles: ['admin', 'manager'] },
      { name: 'Shipments', href: '/shipments', icon: '🚛', roles: ['admin', 'manager', 'driver'] },
      { name: 'Vehicles', href: '/vehicles', icon: '🚐', roles: ['admin', 'manager'] },
    ];

    // Add admin-only sections
    if (userRole === 'admin') {
      baseNav.push({ name: 'Administration', href: '/admin', icon: '⚙️', roles: ['admin'] });
    }

    return baseNav.filter(item => item.roles.includes(userRole));
  };

  const navigation = getNavigationForRole(user?.role || 'manager');

  // Mock notifications
  useEffect(() => {
    setNotifications([
      {
        id: 1,
        title: 'New Order Received',
        message: 'Order #ORD-2024-001 has been placed by Customer ABC',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        type: 'info',
        read: false
      },
      {
        id: 2,
        title: 'Shipment Delayed',
        message: 'Shipment #SHP-001 is delayed due to traffic conditions',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        type: 'warning',
        read: false
      },
      {
        id: 3,
        title: 'Low Stock Alert',
        message: 'Product "Laptop Stand" is running low on stock',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        type: 'error',
        read: true
      }
    ]);
  }, []);

  // Global search functionality
  useEffect(() => {
    const handleSearch = async () => {
      if (searchQuery.trim().length > 2) {
        // Mock search results
        const mockResults = [
          { type: 'Order', title: `Order #${searchQuery.toUpperCase()}`, href: '/orders', icon: '📦' },
          { type: 'Product', title: `Product containing "${searchQuery}"`, href: '/products', icon: '🏷️' },
          { type: 'Customer', title: `Customer "${searchQuery}"`, href: '/orders', icon: '👤' },
          { type: 'Shipment', title: `Shipment #SHP-${searchQuery}`, href: '/shipments', icon: '🚛' }
        ];
        setSearchResults(mockResults.slice(0, 5));
      } else {
        setSearchResults([]);
      }
    };

    const debounce = setTimeout(handleSearch, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isCurrentPath = (href) => {
    return location.pathname === href || (href === '/dashboard' && location.pathname === '/');
  };

  const handleLogout = () => {
    logout();
    info('You have been logged out successfully');
  };

  const handleSearchSelect = (result) => {
    navigate(result.href);
    setSearchQuery('');
    setSearchOpen(false);
    info(`Navigating to ${result.title}`);
  };

  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 z-50 w-64 h-full bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="text-2xl mr-3">🚚</div>
            <h1 className="text-xl font-bold text-gray-900">LogiSys Pro</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isCurrentPath(item.href)
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>

        {/* User info in sidebar */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                </span>
              </div>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.full_name || user?.username}
              </p>
              <p className="text-xs text-gray-500 capitalize truncate">
                {user?.role}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top navigation */}
        <header className="bg-white border-b border-gray-200 h-16">
          <div className="flex items-center justify-between h-full px-4 sm:px-6">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-400 hover:text-gray-600"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>

            {/* Breadcrumb */}
            <div className="hidden lg:flex lg:items-center lg:space-x-2">
              <span className="text-sm text-gray-500">
                {location.pathname === '/' || location.pathname === '/dashboard' 
                  ? 'Dashboard' 
                  : location.pathname.split('/').slice(-1)[0].charAt(0).toUpperCase() + 
                    location.pathname.split('/').slice(-1)[0].slice(1)
                }
              </span>
            </div>

            {/* Right side items */}
            <div className="flex items-center space-x-4">
              {/* Global search */}
              <div className="relative" ref={searchRef}>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search orders, products, customers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchOpen(true)}
                    className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Search results dropdown */}
                {searchOpen && searchResults.length > 0 && (
                  <div className="absolute top-12 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="py-2">
                      {searchResults.map((result, index) => (
                        <button
                          key={index}
                          onClick={() => handleSearchSelect(result)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                        >
                          <span className="mr-3 text-lg">{result.icon}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{result.title}</div>
                            <div className="text-xs text-gray-500">{result.type}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Notifications */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setNotificationOpen(!notificationOpen)}
                  className="relative p-2 text-gray-400 hover:text-gray-600"
                >
                  <BellIcon className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications dropdown */}
                {notificationOpen && (
                  <div className="absolute top-12 right-0 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${
                            !notification.read ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => markNotificationAsRead(notification.id)}
                        >
                          <div className="flex items-start">
                            <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                              notification.type === 'error' ? 'bg-red-500' :
                              notification.type === 'warning' ? 'bg-yellow-500' :
                              'bg-blue-500'
                            }`} />
                            <div className="ml-3 flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-2">
                                {notification.timestamp.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-2 border-t border-gray-200">
                      <button className="w-full text-sm text-blue-600 hover:text-blue-700">
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-2 text-sm rounded-lg text-gray-700 hover:bg-gray-100"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.full_name || user?.username}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {user?.role}
                    </p>
                  </div>
                  <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                </button>

                {/* User menu dropdown */}
                {userMenuOpen && (
                  <div className="absolute top-12 right-0 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="py-1">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">
                          {user?.full_name || user?.username}
                        </p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                      
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <UserCircleIcon className="w-4 h-4 mr-3" />
                        Profile Settings
                      </Link>
                      
                      {user?.role === 'admin' && (
                        <Link
                          to="/admin"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <CogIcon className="w-4 h-4 mr-3" />
                          Administration
                        </Link>
                      )}
                      
                      <div className="border-t border-gray-100">
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                        >
                          <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default EnhancedLayout;

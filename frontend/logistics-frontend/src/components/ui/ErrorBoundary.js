import React from 'react';
import { useNotifications } from '../notifications/NotificationSystem';

// Error Boundary Class Component (React Error Boundaries must be class components)
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log error to monitoring service (e.g., Sentry)
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    // Report to error tracking service
    if (window.reportError) {
      window.reportError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error} 
          errorInfo={this.state.errorInfo}
          resetError={() => this.setState({ hasError: false, error: null, errorInfo: null })}
        />
      );
    }

    return this.props.children;
  }
}

// Error Fallback Component
const ErrorFallback = ({ error, errorInfo, resetError }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        {/* Error Icon */}
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        {/* Error Message */}
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-600 mb-6">
            We're sorry, but something unexpected happened. Please try refreshing the page.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Refresh Page
          </button>
          
          <button
            onClick={resetError}
            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Try Again
          </button>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full text-gray-500 text-sm hover:text-gray-700 transition-colors"
          >
            {showDetails ? 'Hide' : 'Show'} Error Details
          </button>
        </div>

        {/* Error Details */}
        {showDetails && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Error Details:</h3>
            <div className="text-xs text-gray-600 font-mono break-words">
              <div className="mb-2">
                <strong>Error:</strong> {error?.toString()}
              </div>
              {errorInfo?.componentStack && (
                <div>
                  <strong>Component Stack:</strong>
                  <pre className="whitespace-pre-wrap text-xs mt-1">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Support Link */}
        <div className="text-center mt-4">
          <a 
            href="mailto:support@logisys.com" 
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
};

// Loading Spinner Component
export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]} ${className}`}>
    </div>
  );
};

// Loading Overlay Component
export const LoadingOverlay = ({ message = 'Loading...', transparent = false }) => {
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${
      transparent ? 'bg-white bg-opacity-75' : 'bg-gray-900 bg-opacity-50'
    }`}>
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <div className="flex items-center space-x-3">
          <LoadingSpinner size="md" />
          <span className="text-gray-700 font-medium">{message}</span>
        </div>
      </div>
    </div>
  );
};

// Skeleton Loading Components
export const SkeletonCard = ({ className = '' }) => (
  <div className={`bg-white rounded-lg shadow animate-pulse ${className}`}>
    <div className="p-6">
      <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-300 rounded"></div>
        <div className="h-3 bg-gray-300 rounded w-5/6"></div>
        <div className="h-3 bg-gray-300 rounded w-4/6"></div>
      </div>
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5, columns = 4 }) => (
  <div className="bg-white shadow rounded-lg overflow-hidden animate-pulse">
    <div className="px-6 py-4 border-b border-gray-200">
      <div className="h-6 bg-gray-300 rounded w-1/4"></div>
    </div>
    <table className="min-w-full">
      <thead className="bg-gray-50">
        <tr>
          {[...Array(columns)].map((_, i) => (
            <th key={i} className="px-6 py-3">
              <div className="h-4 bg-gray-300 rounded w-full"></div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {[...Array(rows)].map((_, i) => (
          <tr key={i}>
            {[...Array(columns)].map((_, j) => (
              <td key={j} className="px-6 py-4">
                <div className="h-4 bg-gray-300 rounded w-full"></div>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const SkeletonChart = ({ height = 'h-80' }) => (
  <div className={`bg-white rounded-lg shadow p-6 animate-pulse ${height}`}>
    <div className="h-6 bg-gray-300 rounded w-1/4 mb-4"></div>
    <div className="flex items-end justify-between h-full space-x-2">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="bg-gray-300 rounded-t w-full"
          style={{ height: `${Math.random() * 60 + 20}%` }}
        ></div>
      ))}
    </div>
  </div>
);

// Empty State Component
export const EmptyState = ({ 
  icon = '📋', 
  title = 'No data available', 
  description = 'There is no data to display at this time.',
  action = null 
}) => (
  <div className="text-center py-12">
    <div className="text-6xl mb-4">{icon}</div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 mb-4">{description}</p>
    {action}
  </div>
);

// Connection Status Component
export const ConnectionStatus = ({ isOnline = true }) => {
  return (
    <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300 ${
      isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`}>
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${
          isOnline ? 'bg-green-600' : 'bg-red-600'
        }`}></div>
        <span className="text-sm font-medium">
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>
    </div>
  );
};

// Progress Bar Component
export const ProgressBar = ({ progress = 0, className = '', showPercentage = true }) => (
  <div className={`w-full ${className}`}>
    <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
      <div
        className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      ></div>
    </div>
    {showPercentage && (
      <span className="text-sm text-gray-600 mt-1">
        {Math.round(progress)}%
      </span>
    )}
  </div>
);

// Page Header Component
export const PageHeader = ({ 
  title, 
  description, 
  action = null, 
  breadcrumb = null,
  className = '' 
}) => (
  <div className={`mb-8 ${className}`}>
    {breadcrumb && (
      <nav className="mb-4">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          {breadcrumb.map((item, index) => (
            <li key={index} className="flex items-center">
              {index > 0 && <span className="mx-2">/</span>}
              {item.href ? (
                <a href={item.href} className="hover:text-gray-700">
                  {item.label}
                </a>
              ) : (
                <span className="text-gray-900">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    )}
    
    <div className="sm:flex sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        {description && (
          <p className="mt-2 text-sm text-gray-700">{description}</p>
        )}
      </div>
      {action && <div className="mt-4 sm:mt-0">{action}</div>}
    </div>
  </div>
);

// Status Badge Component
export const StatusBadge = ({ status, colorMap = {} }) => {
  const defaultColors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-blue-100 text-blue-800'
  };

  const colors = { ...defaultColors, ...colorMap };
  const statusKey = status?.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const colorClass = colors[statusKey] || colors.inactive;

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}>
      {status}
    </span>
  );
};

// Confirmation Dialog
export const ConfirmationDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action',
  message = 'Are you sure you want to perform this action?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning' // warning, danger, info
}) => {
  if (!isOpen) return null;

  const typeStyles = {
    warning: 'bg-yellow-50 text-yellow-600',
    danger: 'bg-red-50 text-red-600',
    info: 'bg-blue-50 text-blue-600'
  };

  const buttonStyles = {
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    danger: 'bg-red-600 hover:bg-red-700',
    info: 'bg-blue-600 hover:bg-blue-700'
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="p-6">
          <div className={`flex items-center justify-center w-12 h-12 mx-auto rounded-full mb-4 ${typeStyles[type]}`}>
            {type === 'danger' && '⚠️'}
            {type === 'warning' && '⚠️'}
            {type === 'info' && 'ℹ️'}
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            {title}
          </h3>
          
          <p className="text-gray-600 text-center mb-6">
            {message}
          </p>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${buttonStyles[type]}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add missing import
import { useState } from 'react';

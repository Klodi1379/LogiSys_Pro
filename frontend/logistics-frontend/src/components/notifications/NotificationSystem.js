import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

// Notification Context
const NotificationContext = createContext();

// Notification Types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Actions
const ACTIONS = {
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  CLEAR_ALL: 'CLEAR_ALL'
};

// Reducer
const notificationReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.ADD_NOTIFICATION:
      return [...state, action.payload];
    case ACTIONS.REMOVE_NOTIFICATION:
      return state.filter(notification => notification.id !== action.payload);
    case ACTIONS.CLEAR_ALL:
      return [];
    default:
      return state;
  }
};

// Provider Component
export const NotificationProvider = ({ children }) => {
  const [notifications, dispatch] = useReducer(notificationReducer, []);

  const addNotification = (notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: NOTIFICATION_TYPES.INFO,
      duration: 5000,
      ...notification
    };

    dispatch({
      type: ACTIONS.ADD_NOTIFICATION,
      payload: newNotification
    });

    // Auto remove after duration
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  };

  const removeNotification = (id) => {
    dispatch({
      type: ACTIONS.REMOVE_NOTIFICATION,
      payload: id
    });
  };

  const clearAll = () => {
    dispatch({ type: ACTIONS.CLEAR_ALL });
  };

  // Helper methods
  const success = (message, options = {}) => addNotification({ 
    ...options, 
    type: NOTIFICATION_TYPES.SUCCESS, 
    message 
  });
  
  const error = (message, options = {}) => addNotification({ 
    ...options, 
    type: NOTIFICATION_TYPES.ERROR, 
    message,
    duration: 8000
  });
  
  const warning = (message, options = {}) => addNotification({ 
    ...options, 
    type: NOTIFICATION_TYPES.WARNING, 
    message 
  });
  
  const info = (message, options = {}) => addNotification({ 
    ...options, 
    type: NOTIFICATION_TYPES.INFO, 
    message 
  });

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearAll,
      success,
      error,
      warning,
      info
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook to use notifications
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

// Individual Notification Component
const Notification = ({ notification, onRemove }) => {
  const typeStyles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const iconStyles = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  return (
    <div 
      className={`max-w-sm w-full bg-white shadow-lg rounded-lg border pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all duration-300 ease-in-out ${typeStyles[notification.type]}`}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-lg">{iconStyles[notification.type]}</span>
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            {notification.title && (
              <p className="text-sm font-medium text-gray-900">
                {notification.title}
              </p>
            )}
            <p className={`text-sm ${notification.title ? 'mt-1' : ''} text-gray-700`}>
              {notification.message}
            </p>
            {notification.action && (
              <div className="mt-3">
                <button
                  onClick={notification.action.onClick}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  {notification.action.label}
                </button>
              </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={() => onRemove(notification.id)}
              className="rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Container Component
export const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-4">
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          notification={notification}
          onRemove={removeNotification}
        />
      ))}
    </div>
  );
};

export default NotificationProvider;

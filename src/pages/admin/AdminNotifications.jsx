import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Bell, AlertCircle, CheckCircle, Info, Clock, Trash2, BookMarked as MarkAsRead } from 'lucide-react';

const AdminNotifications = () => {
  const { apiCall } = useAdminAuth();
  const { addNotification } = useNotification();
  
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await apiCall('/admin/notifications');
        setNotifications(response.data || []);
        setNotifications(response.data || []);
      } else if (Array.isArray(response)) {
        setNotifications(response);
      } else {
        console.warn('Unexpected notifications response format:', response);
        setNotifications([]);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      // Don't show error notification, just use empty data
      console.warn('Notifications endpoint not available, using empty data');
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh notifications
  useEffect(() => {
    const interval = setInterval(() => {
      loadNotifications();
    }, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      const response = await apiCall(`/admin/notifications/${notificationId}/read`, {
        method: 'PUT'
      });

      if (response.success) {
        setNotifications(prev => prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        ));
        // Reload notifications to ensure consistency
        setTimeout(() => loadNotifications(), 1000);
      }
    } catch (error) {
      addNotification('Failed to mark notification as read', 'error');
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const response = await apiCall(`/admin/notifications/${notificationId}`, {
        method: 'DELETE'
      });

      if (response.success) {
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        addNotification('Notification deleted', 'success');
        // Reload notifications to ensure consistency
        setTimeout(() => loadNotifications(), 1000);
      }
    } catch (error) {
      addNotification('Failed to delete notification', 'error');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'booking': return <Clock className="w-5 h-5 text-blue-500" />;
      case 'alert': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.read;
    if (filter === 'read') return notif.read;
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">Stay updated with restaurant activities and alerts</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Unread:</span>
          <span className="text-lg font-semibold text-red-600">
            {notifications.filter(n => !n.read).length}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'unread' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Unread ({notifications.filter(n => !n.read).length})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'read' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Read ({notifications.filter(n => n.read).length})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.map((notification) => (
          <div 
            key={notification.id} 
            className={`bg-white rounded-xl shadow-sm border p-6 transition-all hover:shadow-md ${
              !notification.read ? 'border-l-4 border-l-blue-500' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className={`text-lg font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                      {notification.title}
                    </h3>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-2">{notification.message}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{new Date(notification.created_at).toLocaleString()}</span>
                    <span className="capitalize">{notification.type}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {!notification.read && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Mark as read"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(notification.id)}
                  className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredNotifications.length === 0 && (
        <div className="text-center py-12">
          <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
          <p className="text-gray-500">
            {filter === 'all' 
              ? 'You have no notifications at the moment.' 
              : `You have no ${filter} notifications.`
            }
          </p>
        </div>
      )}

      {/* Quick Actions */}
      {notifications.filter(n => !n.read).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="flex space-x-4">
            <button
              onClick={() => {
                notifications.filter(n => !n.read).forEach(n => markAsRead(n.id));
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Mark All as Read</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
import React, { useState, useEffect } from 'react';
import { useSuperAdminAuth } from '../../context/SuperAdminAuthContext';
import { useNotification } from '../../context/NotificationContext';
import { 
  Bell, 
  AlertCircle, 
  CheckCircle, 
  Info, 
  Clock, 
  Trash2, 
  Send,
  Users,
  Building,
  Globe
} from 'lucide-react';

const SuperAdminNotifications = () => {
  const { apiCall } = useSuperAdminAuth();
  const { addNotification } = useNotification();
  
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showSendModal, setShowSendModal] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'info',
    recipients: 'all',
    urgent: false
  });

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await apiCall('/super-admin/notifications');
      if (response && response.success) {
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

  const sendNotification = async (e) => {
    e.preventDefault();
    try {
      const response = await apiCall('/super-admin/notifications/send', {
        method: 'POST',
        body: newNotification
      });

      if (response.success) {
        addNotification('Notification sent successfully', 'success');
        setShowSendModal(false);
        setNewNotification({
          title: '',
          message: '',
          type: 'info',
          recipients: 'all',
          urgent: false
        });
        loadNotifications();
      }
    } catch (error) {
      addNotification('Failed to send notification', 'error');
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await apiCall(`/super-admin/notifications/${notificationId}/read`, {
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
      const response = await apiCall(`/super-admin/notifications/${notificationId}`, {
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
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getRecipientIcon = (recipients) => {
    switch (recipients) {
      case 'admins': return <Building className="w-4 h-4" />;
      case 'customers': return <Users className="w-4 h-4" />;
      case 'superadmins': return <Globe className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.read;
    if (filter === 'read') return notif.read;
    if (filter === 'urgent') return notif.urgent;
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Notifications</h1>
          <p className="text-gray-600">Manage system-wide notifications and alerts</p>
        </div>
        <button
          onClick={() => setShowSendModal(true)}
          className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-yellow-700 hover:to-orange-700 transition-all duration-300 flex items-center space-x-2"
        >
          <Send className="w-5 h-5" />
          <span>Send Notification</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-yellow-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'unread' 
                ? 'bg-yellow-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Unread ({notifications.filter(n => !n.read).length})
          </button>
          <button
            onClick={() => setFilter('urgent')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'urgent' 
                ? 'bg-yellow-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Urgent ({notifications.filter(n => n.urgent).length})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.map((notification) => (
          <div 
            key={notification.id} 
            className={`bg-white rounded-xl shadow-sm border p-6 transition-all hover:shadow-md ${
              !notification.read ? 'border-l-4 border-l-yellow-500' : ''
            } ${notification.urgent ? 'ring-2 ring-red-200' : ''}`}
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
                      <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    )}
                    {notification.urgent && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                        URGENT
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-3">{notification.message}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{notification.created_at.toLocaleString()}</span>
                    <div className="flex items-center space-x-1">
                      {getRecipientIcon(notification.recipients)}
                      <span className="capitalize">{notification.recipients}</span>
                    </div>
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
              ? 'No notifications at the moment.' 
              : `No ${filter} notifications.`
            }
          </p>
        </div>
      )}

      {/* Send Notification Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Send Platform Notification</h3>
              <form onSubmit={sendNotification} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={newNotification.title}
                    onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    value={newNotification.message}
                    onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={newNotification.type}
                      onChange={(e) => setNewNotification({...newNotification, type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                      <option value="info">Info</option>
                      <option value="success">Success</option>
                      <option value="warning">Warning</option>
                      <option value="error">Error</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
                    <select
                      value={newNotification.recipients}
                      onChange={(e) => setNewNotification({...newNotification, recipients: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                      <option value="all">All Users</option>
                      <option value="customers">Customers Only</option>
                      <option value="admins">Restaurant Admins</option>
                      <option value="superadmins">Super Admins</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="urgent"
                    checked={newNotification.urgent}
                    onChange={(e) => setNewNotification({...newNotification, urgent: e.target.checked})}
                    className="rounded"
                  />
                  <label htmlFor="urgent" className="text-sm text-gray-700">Mark as urgent</label>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowSendModal(false)}
                    className="px-4 py-2 text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                  >
                    Send Notification
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminNotifications;
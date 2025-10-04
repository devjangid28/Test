import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { apiCache } from '../utils/apiCache';

const NotificationBell = () => {
  const { apiCall } = useCustomerAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);
  const loadingNotificationsRef = useRef(false);
  const loadingCountRef = useRef(false);

  useEffect(() => {
    loadNotifications();

    const interval = setInterval(() => {
      apiCache.invalidatePattern('/bookings/notifications');
      loadNotifications();
    }, 120000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    if (loadingNotificationsRef.current) return;

    loadingNotificationsRef.current = true;
    setIsLoading(true);

    try {
      console.log('🔔 [Optimized] Loading notifications and counts...');
      const response = await apiCache.dedupe('/bookings/notifications', { limit: 10 }, async () => {
        return await apiCall('/bookings/notifications?limit=10');
      });

      console.log('🔔 [Optimized] Consolidated response:', response);

      if (response && response.success && response.data) {
        const { notifications: notificationsList, unread_count, total_count } = response.data;

        setNotifications(notificationsList || []);
        setUnreadCount(unread_count || 0);

        console.log(`🔔 [Optimized] Loaded ${notificationsList?.length || 0} notifications, ${unread_count} unread, ${total_count} total`);
      } else {
        console.error('🔔 Response not successful:', response);
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
      loadingNotificationsRef.current = false;
    }
  };

  const markAsRead = async (notificationId) => {
    const previousUnreadCount = unreadCount;
    const previousNotifications = notifications;

    try {
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: 1 } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      await apiCall(`/bookings/notifications/${notificationId}/read`, {
        method: 'PUT'
      });

      apiCache.invalidatePattern('/bookings/notifications');
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
    }
  };

  const markAllAsRead = async () => {
    const previousUnreadCount = unreadCount;
    const previousNotifications = notifications;

    try {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);

      await apiCall('/bookings/notifications/mark-all-read', {
        method: 'PUT'
      });

      apiCache.invalidatePattern('/bookings/notifications');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
    }
  };

  const handleBellClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Invalidate all notification-related cache entries
      apiCache.invalidatePattern('/bookings/notifications');
      loadNotifications();
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 border-green-200';
      case 'error':
        return 'bg-red-100 border-red-200';
      case 'info':
        return 'bg-blue-100 border-blue-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleBellClick}
        className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell className="w-5 h-5 md:w-6 md:h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No notifications yet</p>
                <p className="text-sm text-gray-400 mt-1">We'll notify you when something happens</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.is_read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 text-sm">{notification.title}</h4>
                      {!notification.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="text-blue-600 hover:text-blue-800 ml-2"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>

                    {notification.restaurant_name && (
                      <p className="text-xs text-gray-500 mb-1">
                        <span className="font-medium">Restaurant:</span> {notification.restaurant_name}
                      </p>
                    )}

                    {notification.booking_details && (
                      <div className="text-xs text-gray-500 mb-1 space-y-0.5">
                        {notification.booking_details.date && notification.booking_details.time && (
                          <p>
                            <span className="font-medium">Booking:</span> {notification.booking_details.date} at {notification.booking_details.time}
                          </p>
                        )}
                        {notification.booking_details.table_number && (
                          <p>
                            <span className="font-medium">Table:</span> {notification.booking_details.table_number}
                          </p>
                        )}
                      </div>
                    )}

                    {notification.order_details && (
                      <div className="text-xs text-gray-500 mb-1 space-y-0.5">
                        <p>
                          <span className="font-medium">Order Type:</span> {notification.order_details.order_type}
                        </p>
                        {notification.order_details.status && (
                          <p>
                            <span className="font-medium">Status:</span> {notification.order_details.status}
                          </p>
                        )}
                        {notification.order_details.total_amount && (
                          <p>
                            <span className="font-medium">Total:</span> ${notification.order_details.total_amount}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">{formatDate(notification.created_at)}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        notification.type === 'success' ? 'bg-green-100 text-green-800' :
                        notification.type === 'error' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {notification.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

const AdminNotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/admin/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.warn('Failed to fetch notifications');
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
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

  const handleMarkAsRead = async (e, id) => {
    e.stopPropagation();
    try {
      await api.patch(`/admin/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.warn(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/admin/notifications/read-all');
      fetchNotifications();
      setIsOpen(false);
    } catch (err) {
      console.warn(err);
    }
  };

  const toggleDropdown = () => setIsOpen(!isOpen);

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button 
        onClick={toggleDropdown} 
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative', padding: '0.5rem' }}
        title="Notifications"
      >
        <Bell size={24} color="#475569" />
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: 2, right: 2, background: '#ef4444', color: 'white', borderRadius: '50%', fontSize: '0.7rem', fontWeight: 700, width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{ position: 'absolute', top: '100%', right: 0, width: '320px', background: 'white', borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', zIndex: 50, border: '1px solid #e2e8f0', marginTop: '0.5rem' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, color: '#0f172a' }}>Notifications</h4>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} style={{ background: 'none', border: 'none', color: '#059669', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>
                Mark all as read
              </button>
            )}
          </div>
          
          <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                No notifications
              </div>
            ) : (
              notifications.map(notif => (
                <div key={notif._id} style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', background: notif.isRead ? 'white' : '#f0fdf4', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                      {notif.title}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                      {notif.message}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {new Date(notif.createdAt).toLocaleString()}
                    </div>
                  </div>
                  {!notif.isRead && (
                    <button onClick={(e) => handleMarkAsRead(e, notif._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#059669', padding: '0.25rem' }} title="Mark as read">
                      <CheckCircle2 size={16} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotificationBell;

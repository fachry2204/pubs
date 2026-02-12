import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Search, Bell, Mail, Menu, Server, Database, X, Check } from 'lucide-react';
import api from '../services/api';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [serverStatus, setServerStatus] = useState<'online' | 'offline'>('offline');
  const [dbStatus, setDbStatus] = useState<'online' | 'offline'>('offline');
  
  // Notification State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await api.get('/health');
        if (res.status === 200) {
            setServerStatus('online');
            if (res.data.status === 'connected') {
                setDbStatus('online');
            } else {
                setDbStatus('offline');
            }
        }
      } catch (error) {
        setServerStatus('offline');
        setDbStatus('offline');
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Fetch Notifications
  useEffect(() => {
      fetchNotifications();
      // Poll every 1 minute
      const notifInterval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(notifInterval);
  }, []);

  // Click outside listener
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
              setShowNotifications(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
      try {
          const res = await api.get('/notifications');
          setNotifications(res.data.notifications);
          setUnreadCount(res.data.unreadCount);
      } catch (error) {
          console.error('Failed to fetch notifications');
      }
  };

  const markRead = async (id: number) => {
      try {
          await api.put(`/notifications/${id}/read`);
          // Optimistic update
          setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
          setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
          console.error('Failed to mark read');
      }
  };

  const markAllRead = async () => {
      try {
          await api.put('/notifications/read-all');
          setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
          setUnreadCount(0);
      } catch (error) {
          console.error('Failed to mark all read');
      }
  };

  const getNotificationIcon = (type: string) => {
      switch(type) {
          case 'success': return <div className="w-2 h-2 bg-green-500 rounded-full"></div>;
          case 'error': return <div className="w-2 h-2 bg-red-500 rounded-full"></div>;
          case 'warning': return <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>;
          default: return <div className="w-2 h-2 bg-blue-500 rounded-full"></div>;
      }
  };

  return (
    <header className="bg-white h-20 flex items-center justify-between px-8 ml-64 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center space-x-6">
         <button className="text-gray-400 hover:text-gray-600 lg:hidden">
            <Menu size={24} />
         </button>
         
         <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
                type="text" 
                placeholder="Search..." 
                className="pl-10 pr-4 py-2.5 rounded-full bg-gray-50 border border-gray-100 focus:outline-none focus:bg-white focus:ring-2 focus:ring-purple-100 text-sm w-64 transition-all" 
            />
         </div>
      </div>

      <div className="flex items-center space-x-6">
        {/* Status Indicators */}
        <div className="hidden md:flex items-center gap-4 mr-4 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
            <div className="flex items-center gap-2" title="Server Status">
                <div className={`w-2.5 h-2.5 rounded-full ${serverStatus === 'online' ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`}></div>
                <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                    <Server size={12} />
                    Server
                </span>
            </div>
            <div className="w-px h-3 bg-gray-300"></div>
            <div className="flex items-center gap-2" title="Database Status">
                <div className={`w-2.5 h-2.5 rounded-full ${dbStatus === 'online' ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`}></div>
                <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                    <Database size={12} />
                    DB
                </span>
            </div>
        </div>

        {/* Notification Bell */}
        <div className="relative" ref={notificationRef}>
            <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 rounded-full transition-colors ${showNotifications ? 'bg-purple-50 text-purple-600' : 'text-gray-400 hover:text-purple-600'}`}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden transform origin-top-right transition-all z-50">
                    <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-semibold text-gray-800">Notifications</h3>
                        {unreadCount > 0 && (
                            <button 
                                onClick={markAllRead}
                                className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                            >
                                <Check size={14} /> Mark all read
                            </button>
                        )}
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Bell size={32} className="mx-auto mb-2 text-gray-300" />
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {notifications.map((notif) => (
                                    <div 
                                        key={notif.id} 
                                        onClick={() => !notif.is_read && markRead(notif.id)}
                                        className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notif.is_read ? 'bg-purple-50/30' : ''}`}
                                    >
                                        <div className="flex gap-3">
                                            <div className="mt-1.5 flex-shrink-0">
                                                {getNotificationIcon(notif.type)}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className={`text-sm font-medium ${!notif.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                                                    {notif.title}
                                                </h4>
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                    {notif.message}
                                                </p>
                                                <span className="text-[10px] text-gray-400 mt-2 block">
                                                    {new Date(notif.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                            {!notif.is_read && (
                                                <div className="self-center">
                                                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        <button className="relative text-gray-400 hover:text-purple-600 transition-colors">
            <Mail size={20} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="h-8 w-px bg-gray-200 mx-2"></div>

        <div className="flex items-center space-x-3 cursor-pointer group relative">
            <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-gray-700 group-hover:text-purple-700 transition-colors">Hello, {user?.name}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-0.5">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                    <User size={20} className="text-gray-600" />
                </div>
            </div>
            
            {/* Simple Dropdown for Logout */}
            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-red-500 flex items-center"
                >
                    <LogOut size={16} className="mr-2" />
                    Logout
                </button>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
